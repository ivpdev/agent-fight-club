#!/usr/bin/env npx ts-node

import { exec } from "child_process";
import { CreateGameResponse } from "@afc/core/types";

const API_BASE = "http://localhost:3000";

// Parse args
const args = process.argv.slice(2);
const visualize = args.includes("--visualize") || args.includes("-v");
const scenario = args.find(a => !a.startsWith("-")) || "library_escape";

function openBrowser(url: string) {
  const cmd = process.platform === "darwin" ? "open" :
              process.platform === "win32" ? "start" : "xdg-open";
  exec(`${cmd} ${url}`);
}

async function main() {
  // 1. Create a new game
  console.log(`Creating game with scenario: ${scenario}...`);
  const createRes = await fetch(`${API_BASE}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId: "memoryless-v1",
      scenarioId: scenario,
    }),
  });

  if (!createRes.ok) {
    console.error("Failed to create game:", await createRes.text());
    process.exit(1);
  }

  const { gameId } = await createRes.json() as CreateGameResponse;
  console.log(`Game created: ${gameId}\n`);

  // 2. Open visualization if requested
  if (visualize) {
    const vizUrl = `${API_BASE}/visualize/${gameId}`;
    console.log(`Opening visualization: ${vizUrl}\n`);
    openBrowser(vizUrl);
  }

  // 3. Run the memoryless agent
  const { runAgent } = await import("./memoryless");
  await runAgent(gameId);
}

main().catch(console.error);
