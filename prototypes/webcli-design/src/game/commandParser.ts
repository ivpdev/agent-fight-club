import { GameState, OutputLine, Room } from './types';

const DIRECTION_ALIASES: Record<string, string> = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
  north: 'north',
  south: 'south',
  east: 'east',
  west: 'west',
};

const HELP_TEXT: OutputLine[] = [
  { text: '─── AVAILABLE COMMANDS ───', type: 'system' },
  { text: 'look          - Examine your surroundings', type: 'system' },
  { text: 'go <dir>      - Move in a direction (north/south/east/west)', type: 'system' },
  { text: 'n/s/e/w       - Shorthand movement', type: 'system' },
  { text: 'take <item>   - Pick up an item', type: 'system' },
  { text: 'use <item>    - Use an item or interact with something', type: 'system' },
  { text: 'inventory     - Check what you\'re carrying', type: 'system' },
  { text: 'examine <obj> - Look at something specific', type: 'system' },
  { text: 'help          - Show this help', type: 'system' },
  { text: '──────────────────────────', type: 'system' },
];

export interface CommandResult {
  output: OutputLine[];
  newState?: Partial<GameState>;
}

export function parseCommand(
  input: string,
  state: GameState,
  rooms: Record<string, Room>
): CommandResult {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return { output: [] };

  const parts = trimmed.split(/\s+/);
  const verb = parts[0];
  const rest = parts.slice(1).join(' ');

  const currentRoom = rooms[state.currentRoom];

  // Help
  if (verb === 'help') {
    return { output: HELP_TEXT };
  }

  // Look
  if (verb === 'look' || verb === 'l') {
    return { output: describeRoom(currentRoom, state) };
  }

  // Movement (shorthand or 'go <dir>')
  if (DIRECTION_ALIASES[verb]) {
    return handleMovement(DIRECTION_ALIASES[verb], state, rooms);
  }
  if (verb === 'go' && rest && DIRECTION_ALIASES[rest]) {
    return handleMovement(DIRECTION_ALIASES[rest], state, rooms);
  }
  if (verb === 'go') {
    return { output: [{ text: 'Go where? Specify a direction (north, south, east, west).', type: 'error' }] };
  }

  // Take
  if (verb === 'take' || verb === 'get' || verb === 'pick') {
    const itemName = verb === 'pick' ? rest.replace(/^up\s+/, '') : rest;
    return handleTake(itemName, state, currentRoom);
  }

  // Use
  if (verb === 'use') {
    return handleUse(rest, state, currentRoom);
  }

  // Inventory
  if (verb === 'inventory' || verb === 'inv' || verb === 'i') {
    return handleInventory(state);
  }

  // Examine
  if (verb === 'examine' || verb === 'inspect' || verb === 'x') {
    return handleExamine(rest, state, currentRoom);
  }

  // Unknown
  const errorMessages = [
    "That doesn't make sense here...",
    'You fumble in the dark. Nothing happens.',
    "I don't understand that command.",
    'The terminal buzzes with confusion.',
    'Error: unrecognized input. Try "help".',
  ];
  const msg = errorMessages[Math.floor(Math.random() * errorMessages.length)];
  return { output: [{ text: msg, type: 'error' }] };
}

function describeRoom(room: Room, state: GameState): OutputLine[] {
  const lines: OutputLine[] = [
    { text: `── ${room.name.toUpperCase()} ──`, type: 'system' },
    { text: room.description, type: 'narrative' },
  ];

  // Show items on ground
  const roomItems = room.items.filter(
    (item) => !state.flags[`taken_${item.replace(/\s+/g, '_')}`]
  );
  if (roomItems.length > 0) {
    lines.push({
      text: `You notice: ${roomItems.join(', ')}`,
      type: 'narrative',
    });
  }

  // Show exits
  const exits = Object.keys(room.exits);
  if (exits.length > 0) {
    lines.push({
      text: `Exits: ${exits.join(', ')}`,
      type: 'system',
    });
  }

  return lines;
}

function handleMovement(
  direction: string,
  state: GameState,
  rooms: Record<string, Room>
): CommandResult {
  const currentRoom = rooms[state.currentRoom];
  const targetRoomId = currentRoom.exits[direction];

  if (!targetRoomId) {
    return {
      output: [{ text: `You can't go ${direction} from here.`, type: 'error' }],
    };
  }

  // Check for locked_door redirect
  if (targetRoomId === 'locked_door') {
    const lockedRoom = rooms['locked_door'];
    if (lockedRoom.onEnter) {
      const result = lockedRoom.onEnter(state);
      if (result === 'BLOCKED') {
        return {
          output: [
            {
              text: 'The reinforced door is locked tight. You need some kind of key.',
              type: 'error',
            },
          ],
        };
      }
    }
    // Door is unlocked, go to control room instead
    const controlRoom = rooms['control_room'];
    return {
      output: [
        { text: `You push through the unlocked door...`, type: 'narrative' },
        { text: '', type: 'narrative' },
        ...describeRoom(controlRoom, state),
      ],
      newState: { currentRoom: 'control_room' },
    };
  }

  const targetRoom = rooms[targetRoomId];
  if (targetRoom.onEnter) {
    const result = targetRoom.onEnter(state);
    if (result === 'BLOCKED') {
      return {
        output: [{ text: 'The way is blocked.', type: 'error' }],
      };
    }
  }

  return {
    output: [
      { text: `You move ${direction}...`, type: 'narrative' },
      { text: '', type: 'narrative' },
      ...describeRoom(targetRoom, state),
    ],
    newState: { currentRoom: targetRoomId },
  };
}

function handleTake(
  itemName: string,
  state: GameState,
  room: Room
): CommandResult {
  if (!itemName) {
    return { output: [{ text: 'Take what?', type: 'error' }] };
  }

  const flagKey = `taken_${itemName.replace(/\s+/g, '_')}`;

  // Check if item is in room and not already taken
  const available = room.items.filter(
    (item) => !state.flags[flagKey] && item.toLowerCase() === itemName
  );

  if (available.length === 0) {
    // Fuzzy match
    const fuzzy = room.items.find(
      (item) =>
        !state.flags[`taken_${item.replace(/\s+/g, '_')}`] &&
        item.toLowerCase().includes(itemName)
    );
    if (fuzzy) {
      const fuzzyFlag = `taken_${fuzzy.replace(/\s+/g, '_')}`;
      return {
        output: [{ text: `You pick up the ${fuzzy}.`, type: 'narrative' }],
        newState: {
          inventory: [...state.inventory, fuzzy],
          flags: { ...state.flags, [fuzzyFlag]: true },
        },
      };
    }
    return {
      output: [{ text: `There's no "${itemName}" here to take.`, type: 'error' }],
    };
  }

  const item = available[0];
  return {
    output: [{ text: `You pick up the ${item}.`, type: 'narrative' }],
    newState: {
      inventory: [...state.inventory, item],
      flags: { ...state.flags, [flagKey]: true },
    },
  };
}

function handleUse(
  target: string,
  state: GameState,
  room: Room
): CommandResult {
  if (!target) {
    return { output: [{ text: 'Use what?', type: 'error' }] };
  }

  // Handle "use X on Y" syntax
  const onMatch = target.match(/^(.+?)\s+on\s+(.+)$/);

  if (onMatch) {
    const itemName = onMatch[1].trim();
    const targetName = onMatch[2].trim();

    if (!state.inventory.some((i) => i.toLowerCase().includes(itemName))) {
      return {
        output: [{ text: `You don't have "${itemName}".`, type: 'error' }],
      };
    }

    if (room.interactables) {
      const interactable = Object.entries(room.interactables).find(
        ([key]) => key.toLowerCase().includes(targetName) || targetName.includes(key.toLowerCase())
      );
      if (interactable && interactable[1].onUse) {
        const result = interactable[1].onUse(state);
        return {
          output: [{ text: result.message, type: 'narrative' }],
          newState: result.stateChanges,
        };
      }
    }

    return {
      output: [{ text: `You can't use that here.`, type: 'error' }],
    };
  }

  // Try using on interactables directly
  if (room.interactables) {
    const interactable = Object.entries(room.interactables).find(
      ([key]) => key.toLowerCase().includes(target) || target.includes(key.toLowerCase())
    );
    if (interactable) {
      if (interactable[1].requiresItem) {
        if (!state.inventory.some((i) => i.toLowerCase().includes(interactable[1].requiresItem!.replace('rusty ', '')))) {
          return {
            output: [{ text: `You need something to use with the ${interactable[0]}.`, type: 'error' }],
          };
        }
      }
      if (interactable[1].onUse) {
        const result = interactable[1].onUse(state);
        return {
          output: [{ text: result.message, type: 'narrative' }],
          newState: result.stateChanges,
        };
      }
      return {
        output: [{ text: interactable[1].description, type: 'narrative' }],
      };
    }
  }

  // Try using inventory item
  if (state.inventory.some((i) => i.toLowerCase().includes(target))) {
    return {
      output: [{ text: `You hold up the ${target}, but nothing happens here.`, type: 'narrative' }],
    };
  }

  return {
    output: [{ text: `You can't use "${target}" here.`, type: 'error' }],
  };
}

function handleInventory(state: GameState): CommandResult {
  if (state.inventory.length === 0) {
    return {
      output: [{ text: 'Your pockets are empty.', type: 'system' }],
    };
  }
  return {
    output: [
      { text: '─── INVENTORY ───', type: 'system' },
      ...state.inventory.map((item) => ({
        text: `  • ${item}`,
        type: 'system' as const,
      })),
      { text: '─────────────────', type: 'system' },
    ],
  };
}

function handleExamine(
  target: string,
  state: GameState,
  room: Room
): CommandResult {
  if (!target) {
    return { output: [{ text: 'Examine what?', type: 'error' }] };
  }

  // Check interactables
  if (room.interactables) {
    const interactable = Object.entries(room.interactables).find(
      ([key]) => key.toLowerCase().includes(target) || target.includes(key.toLowerCase())
    );
    if (interactable) {
      return {
        output: [{ text: interactable[1].description, type: 'narrative' }],
      };
    }
  }

  // Check inventory
  const invItem = state.inventory.find((i) => i.toLowerCase().includes(target));
  if (invItem) {
    const descriptions: Record<string, string> = {
      'rusty key': 'A corroded metal key. It looks old but functional. Might fit a heavy lock.',
    };
    return {
      output: [
        {
          text: descriptions[invItem] || `A ${invItem}. Nothing remarkable about it.`,
          type: 'narrative',
        },
      ],
    };
  }

  // Check room items
  const roomItem = room.items.find(
    (i) =>
      !state.flags[`taken_${i.replace(/\s+/g, '_')}`] &&
      i.toLowerCase().includes(target)
  );
  if (roomItem) {
    return {
      output: [{ text: `You see a ${roomItem} on the ground. You could TAKE it.`, type: 'narrative' }],
    };
  }

  return {
    output: [{ text: `You don't see anything like "${target}" here.`, type: 'error' }],
  };
}
