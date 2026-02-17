import { ChildProcess, spawn } from 'child_process';

const PORT = 3099;
const BASE = `http://localhost:${PORT}`;

let serverProcess: ChildProcess;
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    failed++;
    console.error(`  FAIL: ${message}`);
  } else {
    passed++;
    console.log(`  PASS: ${message}`);
  }
}

async function request(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('npx', ['tsx', 'src/server/index.ts'], {
      cwd: '/Users/ivanpanov/dev/work/afc/core',
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const timeout = setTimeout(() => reject(new Error('Server start timeout')), 15000);

    serverProcess.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      if (text.includes('Ready to accept game requests')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProcess.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      // tsx outputs some info to stderr, ignore unless it's an actual error
      if (text.includes('Error') || text.includes('error')) {
        console.error('Server stderr:', text);
      }
    });

    serverProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
}

// ---------------------------------------------------------------------------
// Game API smoke test
// ---------------------------------------------------------------------------
async function testGameAPI() {
  console.log('\n--- Game API ---\n');

  // Health check
  const health = await request('GET', '/health');
  assert(health.status === 200, 'GET /health returns 200');
  assert(health.data.status === 'ok', 'health status is ok');

  // List scenarios
  const scenarios = await request('GET', '/scenarios');
  assert(scenarios.status === 200, 'GET /scenarios returns 200');
  const hasLibrary = scenarios.data.some((s: { id: string }) => s.id === 'library_escape');
  assert(hasLibrary, 'library_escape scenario is available');

  // Create game
  const create = await request('POST', '/games', {
    agentId: 'smoke-test',
    scenarioId: 'library_escape',
  });
  assert(create.status === 201, 'POST /games returns 201');
  assert(typeof create.data.gameId === 'string', 'gameId is returned');
  assert(create.data.initialMessage.length > 0, 'initialMessage is returned');
  const gameId = create.data.gameId;

  // Get game state
  const state = await request('GET', `/games/${gameId}`);
  assert(state.status === 200, 'GET /games/:id returns 200');
  assert(state.data.status === 'in_progress', 'game status is in_progress');
  assert(state.data.turnCount === 0, 'initial turnCount is 0');

  // Helper to send commands
  async function cmd(command: string, args: string[] = []) {
    return request('POST', `/games/${gameId}/command`, { command, args });
  }

  // Look around entrance
  const look = await cmd('look');
  assert(look.data.success === true, 'look succeeds');
  assert(look.data.message.includes('Entrance') || look.data.message.includes('entrance'), 'look shows entrance description');

  // Take flashlight
  const take1 = await cmd('take', ['flashlight']);
  assert(take1.data.success === true, 'take flashlight succeeds');

  // Move north to Reading Room
  const move1 = await cmd('move', ['north']);
  assert(move1.data.success === true, 'move north succeeds');
  assert(move1.data.message.includes('Reading Room'), 'entered Reading Room');

  // Take cipher book
  const take2 = await cmd('take', ['book_cipher']);
  assert(take2.data.success === true, 'take book_cipher succeeds');

  // Check inventory
  const inv = await cmd('inventory');
  assert(inv.data.success === true, 'inventory succeeds');
  assert(inv.data.message.includes('flashlight'), 'inventory has flashlight');
  assert(inv.data.message.includes('book_cipher'), 'inventory has book_cipher');

  // Move east to Main Hall
  const move2 = await cmd('move', ['east']);
  assert(move2.data.success === true, 'move east succeeds');
  assert(move2.data.message.includes('Main Hall'), 'entered Main Hall');

  // Solve cipher puzzle
  const solve = await cmd('solve', ['cipher_puzzle', 'HELLO', 'WORLD']);
  assert(solve.data.success === true, 'solve cipher_puzzle succeeds');

  // Move east to Secret Study (unlocked by solving cipher)
  const move3 = await cmd('move', ['east']);
  assert(move3.data.success === true, 'move east to Secret Study succeeds');
  assert(move3.data.message.includes('Secret Study'), 'entered Secret Study');

  // Take golden key
  const take3 = await cmd('take', ['golden_key']);
  assert(take3.data.success === true, 'take golden_key succeeds');

  // Move south to Exit Door (unlocked by golden_key in inventory)
  const move4 = await cmd('move', ['south']);
  assert(move4.data.success === true, 'move south to Exit Door succeeds');
  assert(move4.data.gameStatus === 'completed', 'game status is completed after reaching exit');

  // Verify final state
  const finalState = await request('GET', `/games/${gameId}`);
  assert(finalState.data.status === 'completed', 'final game status is completed');
  assert(finalState.data.score > 0, `final score is positive (${finalState.data.score})`);
  assert(finalState.data.turnCount > 0, `turns were counted (${finalState.data.turnCount})`);

  // Get stats for finished game
  const stats = await request('GET', `/games/${gameId}/stats`);
  assert(stats.status === 200, 'GET /games/:id/stats returns 200');
  assert(stats.data.status === 'completed', 'stats status is completed');
  assert(stats.data.turnCount > 0, `stats turnCount is positive (${stats.data.turnCount})`);
  assert(stats.data.timeSpentMs > 0, `stats timeSpentMs is positive (${stats.data.timeSpentMs})`);
  assert(stats.data.score > 0, `stats score is positive (${stats.data.score})`);

  // Stats should fail for in-progress game
  const newGame = await request('POST', '/games', {
    agentId: 'smoke-test',
    scenarioId: 'library_escape',
  });
  const inProgressStats = await request('GET', `/games/${newGame.data.gameId}/stats`);
  assert(inProgressStats.status === 400, 'GET /games/:id/stats returns 400 for in-progress game');
}

// ---------------------------------------------------------------------------
// CLI API smoke test
// ---------------------------------------------------------------------------
async function testCLIAPI() {
  console.log('\n--- CLI API ---\n');

  // Create session
  const session = await request('POST', '/cli/sessions');
  assert(session.status === 201, 'POST /cli/sessions returns 201');
  assert(typeof session.data.sessionId === 'string', 'sessionId is returned');
  const sessionId = session.data.sessionId;

  // Helper to send CLI commands
  async function cli(command: string) {
    return request('POST', `/cli/sessions/${sessionId}/command`, { command });
  }

  // List scenarios via CLI
  const scenariosOut = await cli('scenarios');
  assert(scenariosOut.data.output.includes('library_escape'), 'CLI scenarios lists library_escape');

  // Start game
  const start = await cli('start library_escape');
  assert(start.data.output.includes('Game started'), 'CLI game started');
  assert(start.data.output.includes('Entrance'), 'CLI shows starting room');

  // Look around
  const look = await cli('look');
  assert(look.data.output.includes('Entrance') || look.data.output.includes('entrance'), 'CLI look shows entrance');

  // Take flashlight
  const take1 = await cli('take flashlight');
  assert(take1.data.output.includes('flashlight'), 'CLI take flashlight works');

  // Move north
  const move1 = await cli('move north');
  assert(move1.data.output.includes('Reading Room'), 'CLI moved to Reading Room');

  // Take cipher book
  const take2 = await cli('take book_cipher');
  assert(take2.data.output.includes('cipher book') || take2.data.output.includes('book_cipher'), 'CLI take book_cipher works');

  // Move east to Main Hall
  const move2 = await cli('move east');
  assert(move2.data.output.includes('Main Hall'), 'CLI moved to Main Hall');

  // Solve cipher puzzle
  const solve = await cli('solve cipher_puzzle HELLO WORLD');
  assert(solve.data.output.includes('clicks open') || solve.data.output.includes('secret study'), 'CLI solve cipher_puzzle works');

  // Move east to Secret Study
  const move3 = await cli('move east');
  assert(move3.data.output.includes('Secret Study'), 'CLI moved to Secret Study');

  // Take golden key
  const take3 = await cli('take golden_key');
  assert(take3.data.output.includes('golden key') || take3.data.output.includes('golden_key'), 'CLI take golden_key works');

  // Move south to Exit
  const move4 = await cli('move south');
  assert(move4.data.output.includes('Exit Door'), 'CLI moved to Exit Door');
  assert(move4.data.output.includes('Congratulations') || move4.data.output.includes('won'), 'CLI reports game won');

  // Check status shows completed
  const status = await cli('status');
  assert(status.data.output.includes('completed'), 'CLI status shows completed');

  // Delete session
  const del = await request('DELETE', `/cli/sessions/${sessionId}`);
  assert(del.status === 200, 'DELETE /cli/sessions/:id returns 200');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Starting smoke test...\n');

  try {
    console.log('Starting server on port', PORT, '...');
    await startServer();
    console.log('Server ready.\n');

    await testGameAPI();
    await testCLIAPI();
  } catch (err) {
    console.error('\nFATAL:', err);
    failed++;
  } finally {
    stopServer();
  }

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
