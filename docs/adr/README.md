# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) documenting significant design decisions made during the development of the AI Agent Competition Platform.

## Index

- [ADR 001: WebSocket Visualization Architecture](001-websocket-visualization-architecture.md)
  - Integrated Socket.IO into main server for real-time game state updates

- [ADR 002: CLI Visualize Flag](002-cli-visualize-flag.md)
  - Added --visualize flag to CLI client to automatically open browser visualization

- [ADR 003: Single Page Visualization](003-single-page-visualization.md)
  - Designed web visualization as a single-page application

- [ADR 004: Navigation Model Refactor](004-navigation-model-refactor.md)
  - Refactored exits to use Direction arrays with position-based destination calculation

- [ADR 005: Four-Color Palette](005-four-color-palette.md)
  - Restricted visualization to black, yellow, red, and white for retro electronic aesthetic

- [ADR 006: Circuit Board Style Connections](006-circuit-board-style-connections.md)
  - Styled map connections as PCB traces with solder pads

- [ADR 007: Web Visualization Command Interface](007-web-visualization-command-interface.md)
  - Added interactive command interface to browser visualization

## ADR Format

Each ADR follows this structure:
- **Status**: Accepted, Proposed, Deprecated, Superseded
- **Context**: The situation and problem being addressed
- **Decision**: What was decided and why
- **Consequences**: Positive and negative outcomes of the decision
