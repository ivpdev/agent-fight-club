import { Room, GameState } from './types';

export const ASCII_TITLE = `
 ████████╗██╗  ██╗███████╗    ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗
 ╚══██╔══╝██║  ██║██╔════╝    ██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝
    ██║   ███████║█████╗      ██║   ██║███████║██║   ██║██║     ██║   
    ██║   ██╔══██║██╔══╝      ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   
    ██║   ██║  ██║███████╗     ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   
    ╚═╝   ╚═╝  ╚═╝╚══════╝      ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   
`;

export const INTRO_TEXT = [
  'You awaken in a cold, dimly lit chamber.',
  'The hum of old machinery echoes through the walls.',
  'A terminal flickers nearby. You must find a way out.',
  '',
  'Type "help" for a list of commands.',
  'Type "look" to examine your surroundings.',
];

export const createRooms = (): Record<string, Room> => ({
  entry_hall: {
    id: 'entry_hall',
    name: 'Entry Hall',
    description:
      'A crumbling hall with rusted metal walls. Faded warning signs line the corridor. A heavy door leads NORTH into darkness. To the EAST, a narrow passage opens into what looks like a storage area.',
    exits: {
      north: 'corridor',
      east: 'storage_room',
    },
    items: [],
  },
  storage_room: {
    id: 'storage_room',
    name: 'Storage Room',
    description:
      'Shelves of forgotten supplies line the walls. Most containers are empty or corroded beyond recognition. Something glints on the floor near the back wall.',
    exits: {
      west: 'entry_hall',
    },
    items: ['rusty key'],
    interactables: {
      shelves: {
        description: 'The shelves hold nothing useful — just dust and decay.',
      },
    },
  },
  corridor: {
    id: 'corridor',
    name: 'Dark Corridor',
    description:
      'A long, narrow corridor stretching into shadow. The air is thick and stale. To the SOUTH lies the Entry Hall. A reinforced steel door blocks the way NORTH — it appears to be locked.',
    exits: {
      south: 'entry_hall',
      north: 'locked_door',
    },
    items: [],
    interactables: {
      door: {
        description: 'A reinforced steel door. A keyhole glows faintly red.',
        requiresItem: 'rusty key',
        onUse: (state: GameState) => {
          if (state.flags['door_unlocked']) {
            return { message: 'The door is already unlocked.' };
          }
          return {
            message:
              'You insert the rusty key into the lock. It turns with a grinding screech. The door shudders open, revealing a passage beyond.',
            stateChanges: {
              flags: { ...state.flags, door_unlocked: true },
            },
          };
        },
      },
    },
  },
  locked_door: {
    id: 'locked_door',
    name: 'Locked Door',
    description: '',
    exits: {},
    items: [],
    onEnter: (state: GameState) => {
      if (!state.flags['door_unlocked']) {
        return 'BLOCKED';
      }
      return null;
    },
  },
  control_room: {
    id: 'control_room',
    name: 'Control Room',
    description:
      'Banks of ancient monitors flicker to life as you enter. A central console pulses with a faint amber glow. This is it — the master override terminal. A single command prompt blinks on the main screen.',
    exits: {
      south: 'corridor',
    },
    items: [],
    interactables: {
      console: {
        description:
          'The main console. A blinking cursor awaits input. Perhaps you should USE it.',
        onUse: (_state: GameState) => {
          return {
            message:
              'You slam your palm onto the console. The screens flare white. Systems engage. The vault doors grind open with a thunderous roar.\n\n>> OVERRIDE ACCEPTED <<\n>> VAULT DOORS: OPEN <<\n>> SYSTEM STATUS: FREE <<\n\nYou did it. You escaped the vault.',
            stateChanges: {
              gameOver: true,
              flags: {},
            },
          };
        },
      },
    },
  },
});

export const getInitialState = (): GameState => ({
  currentRoom: 'entry_hall',
  inventory: [],
  flags: {},
  gameOver: false,
});
