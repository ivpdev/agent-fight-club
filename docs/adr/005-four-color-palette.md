# ADR 002: Four-Color Palette

## Status
Accepted

## Context
The web visualization initially used a broader color palette including green for success states. User provided a reference image (theme-reference.jpeg) showing a retro synthesizer/electronic equipment aesthetic with a strict limited palette. The goal was to create a cohesive retro electronic visual style reminiscent of vintage computing and electronic equipment.

## Decision
Restricted all visualization colors to a four-color palette:
- **Black (#0b0b0b)**: Background, primary surface
- **Yellow (#f7d000, #ffea3a)**: Accents, current state, attention, active elements
- **Red (#c61f26)**: Warnings, locked rooms, errors, blocked states
- **White (#f7f3e7)**: Goals, exits, completed states

Removed all other colors (green, blue, etc.) from the UI.

## Consequences

### Positive
- **Cohesive aesthetic**: Strong retro electronic/synthesizer theme
- **Clear visual hierarchy**: Limited palette forces intentional color usage
- **Better accessibility**: High contrast between semantic states
- **Authentic period feel**: Matches vintage computing and electronic equipment displays
- **Focused attention**: Color becomes more meaningful when limited

### Negative
- **Less conventional**: Users may expect green for success
- **Semantic limitations**: Cannot use color alone to distinguish many states
- **Requires discipline**: Easy to accidentally introduce other colors

### Color Semantics
- Yellow: Activity, current location, available actions, connection traces
- Red: Danger, locked, unavailable, errors
- White: Completion, goals, success markers
- Black: Background, inactive state

### Implementation
- CSS variables in index.html define theme colors
- MapRenderer.ts uses theme object with hex values
- All UI components updated to use only theme colors
- Glow effects use yellow with reduced opacity
