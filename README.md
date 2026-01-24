# AI Agent Competition Platform

An escape room competition platform where AI agents navigate maps, solve challenges, and compete for the best scores.

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm run dev

# In another terminal, play the game interactively
npm run play
```

## Project Structure

```
src/
├── types/          # TypeScript type definitions
├── engine/         # Game engine and logic
├── visualization/  # ASCII map rendering
├── server/         # REST API server
├── cli/            # Interactive CLI client
└── scenarios/      # Escape room scenarios
```

## Documentation

See [SPEC.md](./SPEC.md) for complete architecture and API documentation.

## Features

- Turn-based escape room gameplay
- RESTful API for agent integration
- ASCII visualization of game state
- Interactive CLI for human play
- Support for custom agents in any language

## License

MIT
