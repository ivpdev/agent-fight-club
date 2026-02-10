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

// Simple prompt - no memory, no planning
function buildPrompt(state: GameStateResponse): string {
  return `You are an AI agent in an escape room. Your goal: reach the exit.

CURRENT STATE:
- Room: ${state.currentRoom.name}
- Description: ${state.currentRoom.description}
- Objects here: ${state.currentRoom.visibleObjects.join(", ") || "none"}
- Exits: ${state.currentRoom.exits.join(", ")}
- Inventory: ${state.inventory.join(", ") || "empty"}
- Turns used: ${state.turnCount}

AVAILABLE ACTIONS:
- {"action": "move", "direction": "north|south|east|west"}
- {"action": "examine", "target": "<object_name>"}
- {"action": "interact", "objectId": "<id>", "interactAction": "take|use"}
- {"action": "solve", "challengeId": "<id>", "solution": "<answer>"}

Respond with ONLY a JSON object for your next action. No explanation.`;
}

// Parse LLM response into action
function parseAction(response: string): { endpoint: string; body: object } | null {
  try {
    const json = JSON.parse(response.trim());
    const { action, ...params } = json;

    switch (action) {
      case "move":
        return { endpoint: "move", body: { direction: params.direction } };
      case "examine":
        return { endpoint: "examine", body: { target: params.target } };
      case "interact":
        return { endpoint: "interact", body: { objectId: params.objectId, action: params.interactAction } };
      case "solve":
        return { endpoint: "solve", body: { challengeId: params.challengeId, solution: params.solution } };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// Main agent loop
export async function runAgent(gameId: string) {
  while (true) {
    // 1. Get current state
    const stateRes = await fetch(`${API_BASE}/games/${gameId}`);
    const state = await stateRes.json() as GameStateResponse;

    // Check if game ended
    if (state.status !== "in_progress") {
      console.log(`Game ended: ${state.status}, Score: ${state.score}`);
      break;
    }

    // Check turn limit
    if (state.turnCount >= MAX_TURNS) {
      console.log(`Max turns (${MAX_TURNS}) reached. Stopping.`);
      break;
    }

    // 2. Build prompt and call LLM via OpenRouter
    const prompt = buildPrompt(state);
    const completion = await openrouter.chat.completions.create({
      model: MODEL,
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });

    const llmResponse = completion.choices[0]?.message?.content ?? "";

    // 3. Parse action
    const action = parseAction(llmResponse);
    if (!action) {
      console.log("Failed to parse action:", llmResponse);
      continue;
    }

    // 4. Execute action
    console.log(`Turn ${state.turnCount + 1}: ${action.endpoint}`, action.body);
    const actionRes = await fetch(`${API_BASE}/games/${gameId}/${action.endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action.body),
    });
    const result = await actionRes.json() as ActionResult;
    console.log(`  → ${result.message}`);
  }
}

// Entry point (when run directly)
if (require.main === module) {
  const gameId = process.argv[2];
  if (!gameId) {
    console.log("Usage: npx ts-node src/agents/memoryless.ts <gameId>");
    process.exit(1);
  }
  runAgent(gameId);
}
