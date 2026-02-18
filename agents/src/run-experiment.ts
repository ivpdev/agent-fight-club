#!/usr/bin/env npx tsx

import * as path from "path";
import { runExperiment } from "./experiment-runner";

const args = process.argv.slice(2);
const scenarioFilter = args.find(a => !a.startsWith("-"));

// Resolve paths relative to project root (two levels up from agents/src/)
const projectRoot = path.resolve(__dirname, "../..");
const configDir = path.join(projectRoot, "challenge-lab", "run-configs");
const outputDir = path.join(projectRoot, "challenge-lab", "experiments");

async function main() {
  console.log("Challenge Lab — Experiment Runner");
  if (scenarioFilter) {
    console.log(`Filtering to scenario: ${scenarioFilter}`);
  }

  await runExperiment({
    scenarioFilter,
    configDir,
    outputDir,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
