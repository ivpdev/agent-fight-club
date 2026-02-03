# ADR 003: Circuit Board Style Connections

## Status
Accepted

## Context
The web visualization initially showed room connections as thin (2px) solid lines between rooms. While functional, they lacked visual impact and didn't align with the retro electronic theme established by the four-color palette and geometric design language.

User requested to "show doors on the map so that it's visible how to come from room to room." Four options were presented:
1. Thicker lines with direction symbols
2. Door boxes between rooms
3. Enhanced lines with borders and arrows
4. Circuit board style (thicker traces with connection pads)

Option 4 was selected as it best fit the retro electronic aesthetic.

## Decision
Styled connection lines to resemble printed circuit board (PCB) traces:
- Increased line thickness from 2px to 5px (like PCB traces)
- Added 12px circular "pads" where connections meet rooms (like solder pads)
- Applied glow effects to connections (yellow with opacity)
- Enhanced styling for connections from current room (brighter yellow, stronger glow)
- Added black borders and inner shadows to pads for depth

## Consequences

### Positive
- **Strong thematic cohesion**: Connections now match the retro electronic aesthetic
- **Better visibility**: Thicker lines are easier to see and understand navigation
- **Visual hierarchy**: Current room connections highlighted automatically
- **Authentic PCB look**: Circular pads and traces feel like real circuit boards
- **Depth and dimension**: Shadows and glow create visual interest

### Negative
- **More complex rendering**: Each connection now creates 3 DOM elements (line + 2 pads)
- **Performance consideration**: More elements in complex maps
- **Visual noise**: Could be overwhelming in very dense maps

### Styling Details
- Connection lines: 5px thick, yellow (#f7d000), subtle glow
- Connection pads: 12px diameter circles with black border, inner shadow
- Current room connections: Brighter yellow (#ffea3a), enhanced glow
- Pads positioned at connection endpoints (where line meets room edge)

### Implementation
- CSS classes: `.connection`, `.connection-pad`, `.from-current`
- JavaScript: `renderConnections()` creates line + 2 pads per connection
- Z-index: Connections rendered before rooms so they appear underneath
