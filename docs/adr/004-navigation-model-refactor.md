# ADR 001: Navigation Model Refactor

## Status
Accepted

## Context
The original navigation model stored exits as `Partial<Record<Direction, string>>` where each direction mapped to a destination room ID. This created a dual source of truth problem:
- Room positions defined spatial layout (grid coordinates)
- Exit mappings defined navigation destinations

This led to inconsistencies where visual layout (derived from positions) could disagree with actual navigation (derived from exit mappings). For example, Reading Room at (0,1) had an exit `north: 'archives'`, but Archives was positioned at (1,0) instead of (0,0), making the visual connection incorrect.

## Decision
Refactored exits to be a simple array of allowed directions: `Direction[]`. Destination rooms are calculated at runtime based on grid positions:
- `north`: targetY = currentY - 1
- `south`: targetY = currentY + 1
- `east`: targetX = currentX + 1
- `west`: targetX = currentX - 1

Added `getDestinationRoom()` method in GameEngine to calculate destinations from positions rather than looking them up in exit mappings.

## Consequences

### Positive
- **Eliminated navigation bugs**: Visual layout and navigation are always synchronized
- **Single source of truth**: Grid positions define everything
- **Simpler data model**: No need to maintain room ID mappings
- **Easier to author scenarios**: Just position rooms on grid and list allowed directions

### Negative
- **Less flexible**: Cannot create non-euclidean spaces or teleportation (rooms connected but not adjacent)
- **Migration required**: Existing scenarios must be updated to new format

### Implementation
- Updated `Room` type in types/index.ts
- Updated GameEngine.move() to use getDestinationRoom()
- Updated MapRenderer to use .includes() for Direction arrays
- Updated library scenario with correct positions
- Updated web visualization to calculate destinations from positions
