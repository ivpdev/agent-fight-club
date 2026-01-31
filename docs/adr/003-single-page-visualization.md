# ADR 003: Single-Page HTML Visualization

## Status
Accepted

## Context
We needed to create a web-based UI for visualizing the game state. We had to decide between:
1. Single HTML file with embedded CSS/JS
2. Separate files (HTML, CSS, JS)
3. Using a frontend framework (React, Vue, etc.)

## Decision
Implement visualization as a single HTML file with embedded CSS and JavaScript.

## Consequences

### Positive
- **Zero build step**: No bundling, transpiling, or compilation needed
- **Simplicity**: Everything in one place, easy to understand and modify
- **Fast development**: Immediate changes, no build process
- **No dependencies**: No npm packages needed for frontend
- **Easy deployment**: Single file to serve, works immediately

### Negative
- **Limited scalability**: Would be harder to maintain if UI becomes very complex
- **No hot reload**: Need to refresh browser manually during development (acceptable for this use case)
- **No TypeScript**: JavaScript only (could add if needed, but adds build step)

### When to Reconsider
If we need:
- Complex state management
- Multiple pages/routes
- Shared components across many views
- Type safety in frontend code
- Heavy interactivity beyond current scope

## Implementation
- Single `index.html` file at `src/visualization/public/index.html`
- Embedded `<style>` tags for CSS
- Embedded `<script>` tags for JavaScript
- Socket.IO client loaded via CDN
- Served as static file by Express

## Technical Details
- **Styling**: Modern CSS with gradients, flexbox, grid, animations
- **JavaScript**: Vanilla JS with Socket.IO client for WebSocket
- **Compatibility**: Modern browsers (ES6+)
- **Size**: ~20KB single file, highly maintainable for current scope
