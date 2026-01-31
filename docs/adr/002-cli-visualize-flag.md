# ADR 002: CLI --visualize Flag

## Status
Accepted

## Context
We needed a way for users to opt-in to web visualization when starting the CLI client. The visualization should be optional since some users may prefer the pure terminal experience, and opening a browser automatically could be disruptive.

## Decision
Implement a `--visualize` (or `-v`) command-line flag that:
1. Enables visualization mode in the CLI client
2. Automatically opens the browser to the visualization page when a game starts
3. Provides a convenient npm script `play:visual` as a shortcut

**Usage:**
```bash
npm run play -- --visualize
# or
npm run play:visual
```

## Consequences

### Positive
- **Opt-in**: Users choose when they want visualization, not forced
- **Convenience**: Browser opens automatically, no manual URL copying
- **Discoverability**: Dedicated npm script makes feature easy to find
- **Flexibility**: Users can still use regular CLI mode without visualization

### Negative
- **Platform differences**: Browser opening behavior varies by OS (handled with platform detection)
- **User preference**: Some users may not want automatic browser opening (could add config in future)

### Alternatives Considered
- **Always on**: Rejected - too intrusive for users who don't want it
- **Interactive prompt**: Rejected - adds friction to startup flow
- **Config file**: Rejected for initial implementation - too much setup for first use

## Implementation
- CLI parses `--visualize` flag from command-line arguments
- Cross-platform browser opening using `child_process.exec()`
- Platform detection: `open` (macOS), `start` (Windows), `xdg-open` (Linux)
- Browser opens with URL: `http://localhost:3000/visualize/{gameId}` when game starts
