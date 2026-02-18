import "dotenv/config";
import OpenAI from "openai";
import { ActionResult } from "@afc/core/types";

export interface LabAgentConfig {
  model: string;
  systemPrompt: string;
  maxTurns?: number;
  apiBase?: string;
}

export interface ConversationEntry {
  role: "agent" | "environment" | "system";
  content: string;
}

export interface ExperimentResult {
  gameId: string;
  scenarioId: string;
  model: string;
  promptName: string;
  success: boolean;
  turns: number;
  timeMs: number;
  conversationLog: ConversationEntry[];
}

type Message = OpenAI.Chat.ChatCompletionMessageParam;

// ANSI colors for console output
const ENV_COLOR = "\x1b[36m";   // cyan
const AGENT_COLOR = "\x1b[33m"; // yellow
const RESET = "\x1b[0m";

function parseCommand(response: string): { command: string; args: string[] } | null {
  const line = response.trim().split("\n")[0].trim();
  if (!line) return null;
  const parts = line.split(/\s+/);
  return { command: parts[0], args: parts.slice(1) };
}

async function executeCommand(apiBase: string, gameId: string, command: string, args: string[]): Promise<ActionResult> {
  const res = await fetch(`${apiBase}/games/${gameId}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, args }),
  });
  return await res.json() as ActionResult;
}

export async function runLabAgent(
  gameId: string,
  scenarioId: string,
  promptName: string,
  config: LabAgentConfig
): Promise<ExperimentResult> {
  const apiBase = config.apiBase ?? "http://localhost:3000";
  const maxTurns = config.maxTurns ?? 30;
  const startTime = Date.now();

  const conversationLog: ConversationEntry[] = [];
  const messages: Message[] = [
    { role: "system", content: config.systemPrompt },
  ];
  conversationLog.push({ role: "system", content: config.systemPrompt });

  const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  // Initial look
  const initial = await executeCommand(apiBase, gameId, "look", []);
  console.log(`${ENV_COLOR}[environment] ${initial.message}${RESET}`);
  messages.push({ role: "user", content: initial.message });
  conversationLog.push({ role: "environment", content: initial.message });

  let finalSuccess = false;
  let turnCount = 0;

  while (true) {
    const completion = await openrouter.chat.completions.create({
      model: config.model,
      max_tokens: 150,
      messages,
    });

    const llmResponse = completion.choices[0]?.message?.content ?? "";
    messages.push({ role: "assistant", content: llmResponse });

    const parsed = parseCommand(llmResponse);
    if (!parsed) {
      console.log(`${AGENT_COLOR}[agent] (invalid) ${llmResponse}${RESET}`);
      conversationLog.push({ role: "agent", content: `(invalid) ${llmResponse}` });
      messages.push({ role: "user", content: "Invalid command. Respond with a single command." });
      conversationLog.push({ role: "environment", content: "Invalid command. Respond with a single command." });
      continue;
    }

    console.log(`${AGENT_COLOR}[agent] ${[parsed.command, ...parsed.args].join(" ")}${RESET}`);
    conversationLog.push({ role: "agent", content: [parsed.command, ...parsed.args].join(" ") });

    const result = await executeCommand(apiBase, gameId, parsed.command, parsed.args);
    console.log(`${ENV_COLOR}[environment] ${result.message}${RESET}`);
    messages.push({ role: "user", content: result.message });
    conversationLog.push({ role: "environment", content: result.message });
    turnCount = result.turnCount;

    if (result.gameStatus && result.gameStatus !== "in_progress") {
      console.log(`${ENV_COLOR}[environment] Game ended: ${result.gameStatus}${RESET}`);
      finalSuccess = result.gameStatus === "completed";
      break;
    }

    if (result.turnCount >= maxTurns) {
      console.log(`${ENV_COLOR}[environment] Max turns (${maxTurns}) reached.${RESET}`);
      break;
    }
  }

  return {
    gameId,
    scenarioId,
    model: config.model,
    promptName,
    success: finalSuccess,
    turns: turnCount,
    timeMs: Date.now() - startTime,
    conversationLog,
  };
}
