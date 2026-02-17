import "dotenv/config";
import OpenAI from "openai";
import { ActionResult, GameStatsResponse } from "@afc/core/types";

const API_BASE = "http://localhost:3000";
const MAX_TURNS = 30;

// OpenRouter client (OpenAI-compatible API)
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Model to use - easy to swap
const MODEL = "google/gemini-3-flash-preview";

type Message = OpenAI.Chat.ChatCompletionMessageParam;

// ANSI colors for console output
const ENV_COLOR = "\x1b[36m";   // cyan
const AGENT_COLOR = "\x1b[33m"; // yellow
const STATS_COLOR = "\x1b[32m"; // green
const RESET = "\x1b[0m";

// System prompt - the agent plays like a human typing commands
const SYSTEM_PROMPT = `You are playing a text adventure escape room. Your goal: reach the exit.

Available commands:
  look                 Look around the current room
  examine <target>     Examine an object or challenge
  move <direction>     Move north/south/east/west
  take <object>        Pick up an object
  use <object>         Use an object
  inventory            Check y our inventory
  solve <id> <answer>  Solve a challenge (use examine to see IDs)
  hint <id>            Get a hint for a challenge

Respond with ONLY a single command. No explanation.
`;

// Parse LLM response into command + args
function parseCommand(response: string): { command: string; args: string[] } | null {
  const line = response.trim().split("\n")[0].trim();
  if (!line) return null;
  const parts = line.split(/\s+/);
  return { command: parts[0], args: parts.slice(1) };
}

// Execute a command via the API
async function executeCommand(gameId: string, command: string, args: string[]): Promise<ActionResult> {
  const res = await fetch(`${API_BASE}/games/${gameId}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, args }),
  });
  return await res.json() as ActionResult;
}

// Main agent loop
export async function runAgent(gameId: string) {
  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT }
  ];

  // Get initial room description with "look"
  const initial = await executeCommand(gameId, "look", []);
  console.log(`${ENV_COLOR}[environment] ${initial.message}${RESET}`);
  messages.push({ role: "user", content: initial.message });

  while (true) {
    // 1. Call LLM
    const completion = await openrouter.chat.completions.create({
      model: MODEL,
      max_tokens: 150,
      messages,
    });

    const llmResponse = completion.choices[0]?.message?.content ?? "";
    messages.push({ role: "assistant", content: llmResponse });

    // 2. Parse command
    const parsed = parseCommand(llmResponse);
    if (!parsed) {
      console.log(`${AGENT_COLOR}[agent] (invalid) ${llmResponse}${RESET}`);
      messages.push({ role: "user", content: "Invalid command. Respond with a single command." });
      continue;
    }

    console.log(`${AGENT_COLOR}[agent] ${[parsed.command, ...parsed.args].join(" ")}${RESET}`);

    // 3. Execute command
    const result = await executeCommand(gameId, parsed.command, parsed.args);
    console.log(`${ENV_COLOR}[environment] ${result.message}${RESET}`);
    messages.push({ role: "user", content: result.message });

    // 4. Check game end
    if (result.gameStatus && result.gameStatus !== "in_progress") {
      console.log(`${ENV_COLOR}[environment] Game ended: ${result.gameStatus}${RESET}`);
      break;
    }

    // 5. Check turn limit
    if (result.turnCount >= MAX_TURNS) {
      console.log(`${ENV_COLOR}[environment] Max turns (${MAX_TURNS}) reached.${RESET}`);
      break;
    }
  }

  await printStats(gameId);
}

// Fetch and print game stats
async function printStats(gameId: string) {
  const statsRes = await fetch(`${API_BASE}/games/${gameId}/stats`);
  if (statsRes.ok) {
    const stats = await statsRes.json() as GameStatsResponse;
    const seconds = (stats.timeSpentMs / 1000).toFixed(1);
    console.log(`\n${STATS_COLOR}--- Game Stats ---`);
    console.log(`Status:     ${stats.status}`);
    console.log(`Turns:      ${stats.turnCount}`);
    console.log(`Time spent: ${seconds}s`);
    console.log(`Score:      ${stats.score}`);
    console.log(`---${RESET}\n`);
  }
}

// Entry point (when run directly)
if (require.main === module) {
  const gameId = process.argv[2];
  if (!gameId) {
    console.log("Usage: npx ts-node src/agents/simple-agent.ts <gameId>");
    process.exit(1);
  }
  runAgent(gameId);
}