import * as fs from "fs";
import * as path from "path";
import { CreateGameResponse } from "@afc/core/types";
import { runLabAgent, ExperimentResult } from "./lab-agent";

interface PromptConfig {
  name: string;
  content: string;
}

interface RunConfig {
  models: string[];
  prompts: PromptConfig[];
}

function readModels(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf-8")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith("#") && !l.startsWith("//"));
}

function readPrompts(dirPath: string): PromptConfig[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith(".md") && f !== "models.txt")
    .map(f => ({
      name: f.replace(/\.md$/, ""),
      content: fs.readFileSync(path.join(dirPath, f), "utf-8").trim(),
    }));
}

function loadRunConfig(configDir: string, scenarioId: string): RunConfig {
  const defaultDir = path.join(configDir, "default");
  const scenarioDir = path.join(configDir, scenarioId);

  const defaultModels = readModels(path.join(defaultDir, "models.txt"));
  const scenarioModels = readModels(path.join(scenarioDir, "models.txt"));
  const models = scenarioModels.length > 0 ? scenarioModels : defaultModels;

  const defaultPrompts = readPrompts(defaultDir);
  const scenarioPrompts = readPrompts(scenarioDir);
  const prompts = [...defaultPrompts, ...scenarioPrompts];

  return { models, prompts };
}

function copyDirRecursive(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function formatConversationLog(result: ExperimentResult): string {
  const lines: string[] = [
    `# ${result.scenarioId} | ${result.model} | ${result.promptName}`,
    "",
    `- **Success:** ${result.success}`,
    `- **Turns:** ${result.turns}`,
    `- **Time:** ${(result.timeMs / 1000).toFixed(1)}s`,
    "",
    "---",
    "",
  ];

  for (const entry of result.conversationLog) {
    if (entry.role === "system") {
      lines.push(`**[system]**\n\n${entry.content}\n`);
    } else if (entry.role === "agent") {
      lines.push(`**[agent]** \`${entry.content}\`\n`);
    } else {
      lines.push(`**[environment]** ${entry.content}\n`);
    }
  }

  return lines.join("\n");
}

function generateReportHeader(totalRuns: number): string {
  const lines = [
    "# Experiment Report",
    "",
    `**Date:** ${new Date().toISOString()}`,
    `**Total runs:** ${totalRuns}`,
    "",
    "| Scenario | Model | Prompt | Success | Turns | Time |",
    "|----------|-------|--------|---------|-------|------|",
    "",
  ];
  return lines.join("\n");
}

function formatReportRow(r: ExperimentResult): string {
  const time = (r.timeMs / 1000).toFixed(1) + "s";
  return `| ${r.scenarioId} | ${r.model} | ${r.promptName} | ${r.success} | ${r.turns} | ${time} |\n`;
}

export interface ExperimentOptions {
  scenarioFilter?: string;
  apiBase?: string;
  configDir: string;
  outputDir: string;
}

async function fetchScenarios(apiBase: string): Promise<string[]> {
  const res = await fetch(`${apiBase}/scenarios`);
  const data = await res.json() as { id: string }[];
  return data.map(s => s.id);
}

export async function runExperiment(options: ExperimentOptions) {
  const apiBase = options.apiBase ?? "http://localhost:3000";

  // Discover scenarios
  let scenarioIds = await fetchScenarios(apiBase);
  if (options.scenarioFilter) {
    scenarioIds = scenarioIds.filter(id => id === options.scenarioFilter);
    if (scenarioIds.length === 0) {
      console.error(`Scenario "${options.scenarioFilter}" not found.`);
      process.exit(1);
    }
  }

  // Build the run matrix
  const runs: { scenarioId: string; model: string; prompt: PromptConfig }[] = [];
  for (const scenarioId of scenarioIds) {
    const config = loadRunConfig(options.configDir, scenarioId);
    if (config.models.length === 0) {
      console.warn(`No models configured for scenario "${scenarioId}", skipping.`);
      continue;
    }
    if (config.prompts.length === 0) {
      console.warn(`No prompts configured for scenario "${scenarioId}", skipping.`);
      continue;
    }
    for (const model of config.models) {
      for (const prompt of config.prompts) {
        runs.push({ scenarioId, model, prompt });
      }
    }
  }

  if (runs.length === 0) {
    console.error("No experiment runs to execute.");
    process.exit(1);
  }

  // Create experiment output directory
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const experimentDir = path.join(options.outputDir, timestamp);
  const logsDir = path.join(experimentDir, "logs");
  fs.mkdirSync(logsDir, { recursive: true });

  // Copy run-configs into experiment dir for reproducibility
  copyDirRecursive(options.configDir, path.join(experimentDir, "run-configs"));

  // Initialize report file
  const reportPath = path.join(experimentDir, "report.md");
  fs.writeFileSync(reportPath, generateReportHeader(runs.length));

  console.log(`\nExperiment: ${runs.length} runs → ${experimentDir}\n`);

  const results: ExperimentResult[] = [];

  for (let i = 0; i < runs.length; i++) {
    const { scenarioId, model, prompt } = runs[i];
    const label = `[${i + 1}/${runs.length}] ${scenarioId} | ${model} | ${prompt.name}`;

    console.log(`\n${label}`);

    // Create game
    const createRes = await fetch(`${apiBase}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: "lab-agent", scenarioId }),
    });

    if (!createRes.ok) {
      console.error(`→ FAILED to create game: ${await createRes.text()}`);
      continue;
    }

    const { gameId } = await createRes.json() as CreateGameResponse;

    try {
      const result = await runLabAgent(gameId, scenarioId, prompt.name, {
        model,
        systemPrompt: prompt.content,
        apiBase,
      });

      results.push(result);

      const status = result.success ? "completed" : "failed";
      console.log(`→ ${status} (${result.turns} turns, ${(result.timeMs / 1000).toFixed(1)}s)`);

      // Write conversation log
      const logFilename = `${scenarioId}-${sanitizeFilename(model)}_${prompt.name}.md`;
      fs.writeFileSync(path.join(logsDir, logFilename), formatConversationLog(result));

      // Append to report
      fs.appendFileSync(reportPath, formatReportRow(result));
    } catch (err) {
      console.error(`→ ERROR: ${err}`);
    }
  }

  console.log(`\nReport: ${reportPath}`);

  return results;
}
