import "dotenv/config";
import OpenAI from "openai";
import {
  GameStateResponse,
  ActionResult,
} from "@afc/core/types";

const API_BASE = "http://localhost:3000";
const MAX_TURNS = 20;

// OpenRouter client (OpenAI-compatible API)
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Model to use - easy to swap
const MODEL = "anthropic/claude-3-5-haiku";

type Message = OpenAI.Chat.ChatCompletionMessageParam;

// System prompt - describes the game and available actions
const SYSTEM_PROMPT = `You are an AI agent in an escape room. Your goal: reach the exit.

AVAILABLE ACTIONS:
- {"action": "move", "direction": "north|south|east|west"}
- {"action": "examine", "target": "<object_name>"}
- {"action": "interact", "objectId": "<id>", "interactAction": "take|use"}
- {"action": "solve", "challengeId": "<id>", "solution": "<answer>"}

Respond with ONLY a JSON object for your next action. No explanation.`;

type RoomData = {
  name: string;
  description: string;
  exits: string[];
  objects: { id: string; name: string }[];
  challenges: string[];
};

type ScenarioState = {
  currentRoomData: RoomData;
  inventory: string[];
  challengesCompleted: string[];
};

// Format current state as user message (sent to LLM)
function formatState(state: GameStateResponse): string {
  const ss = state.scenarioState as ScenarioState;
  const room = ss.currentRoomData;
  const objects = room.objects.map(o => o.name);
  return `CURRENT STATE:
- Room: ${room.name}
- Description: ${room.description}
- Objects here: ${objects.join(", ") || "none"}
- Exits: ${room.exits.join(", ")}
- Inventory: ${ss.inventory.join(", ") || "empty"}
- Turns used: ${state.turnCount}`;
}

// Log environment state (room info) to console
function logEnvironment(state: GameStateResponse): void {
  const ss = state.scenarioState as ScenarioState;
  const room = ss.currentRoomData;
  const parts: string[] = [room.description];
  parts.push(`Exits: ${room.exits.join(", ")}`);
  if (room.objects.length > 0)
    parts.push(`Objects: ${room.objects.map(o => o.name).join(", ")}`);
  if (room.challenges.length > 0) {
    const unsolved = room.challenges.filter(c => !ss.challengesCompleted.includes(c));
    if (unsolved.length > 0)
      parts.push(`Challenges: ${unsolved.join(", ")}`);
  }
  if (ss.inventory.length > 0)
    parts.push(`Inventory: ${ss.inventory.join(", ")}`);
  console.log(`${ENV_COLOR}[environment] ${parts.join(`\n             `)}${RESET}`);
}

// ANSI colors for console output
const ENV_COLOR = "\x1b[36m";   // cyan
const AGENT_COLOR = "\x1b[33m"; // yellow
const RESET = "\x1b[0m";

// Format agent action as a short command string
function formatAction(action: { command: string; args: string[] }): string {
  return [action.command, ...action.args].join(" ");
}

// Parse LLM response into a command for the /command endpoint
function parseAction(response: string): { command: string; args: string[] } | null {
  try {
    // Handle markdown code blocks
    let cleaned = response.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const json = JSON.parse(cleaned);
    const { action, ...params } = json;

    switch (action) {
      case "move":
        return { command: "move", args: [params.direction] };
      case "examine":
        return { command: "examine", args: [params.target] };
      case "interact":
        return { command: params.interactAction, args: [params.objectId] };
      case "solve":
        return { command: "solve", args: [params.challengeId, params.solution] };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// Main agent loop
export async function runAgent(gameId: string) {
  // Message history - this is the memory!
  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT }
  ];

  while (true) {
    // 1. Get current state
    const stateRes = await fetch(`${API_BASE}/games/${gameId}`);
    const state = await stateRes.json() as GameStateResponse;

    // Check if game ended
    if (state.status !== "in_progress") {
      console.log(`${ENV_COLOR}[environment] Game ended: ${state.status}, Score: ${state.score}${RESET}`);
      break;
    }

    // Check turn limit
    if (state.turnCount >= MAX_TURNS) {
      console.log(`${ENV_COLOR}[environment] Max turns (${MAX_TURNS}) reached. Stopping.${RESET}`);
      break;
    }

    // 2. Log current environment state and add to message history
    logEnvironment(state);
    messages.push({ role: "user", content: formatState(state) });

    // 3. Call LLM with full history
    const completion = await openrouter.chat.completions.create({
      model: MODEL,
      max_tokens: 150,
      messages,
    });

    const llmResponse = completion.choices[0]?.message?.content ?? "";

    // 4. Add assistant response to history
    messages.push({ role: "assistant", content: llmResponse });

    // 5. Parse action
    const action = parseAction(llmResponse);
    if (!action) {
      console.log(`${AGENT_COLOR}[agent] (invalid) ${llmResponse}${RESET}`);
      // Add feedback to history so agent can learn
      messages.push({ role: "user", content: "Invalid action format. Please respond with valid JSON." });
      continue;
    }

    // 6. Execute action
    console.log(`${AGENT_COLOR}[agent] ${formatAction(action)}${RESET}`);
    const actionRes = await fetch(`${API_BASE}/games/${gameId}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: action.command, args: action.args }),
    });
    const result = await actionRes.json() as ActionResult;
    console.log(`${ENV_COLOR}[environment] ${result.message}${RESET}`);

    // 7. Add action result to history
    messages.push({ role: "user", content: `Result: ${result.message}` });
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
