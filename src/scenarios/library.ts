import { Scenario } from '../types';

export const libraryScenario: Scenario = {
  id: 'library_escape',
  name: 'The Abandoned Library',
  difficulty: 'medium',
  description:
    'You wake up locked inside an old, abandoned library. Strange puzzles block your path. Find the way out before time runs out.',
  startingRoom: 'entrance',
  exitRoom: 'exit',
  optimalTurns: 12,
  timeLimitMs: 300000, // 5 minutes

  rooms: [
    {
      id: 'entrance',
      name: 'Entrance',
      description:
        'A dusty entrance hall with faded wallpaper. Cobwebs hang from the ceiling. You see paths leading north and east.',
      position: { x: 0, y: 2 },
      exits: { north: 'reading_room', east: 'storage' },
      objects: [
        {
          id: 'flashlight',
          name: 'flashlight',
          description: 'An old flashlight. It still works!',
          takeable: true,
        },
      ],
      challenges: [],
      isExit: false,
    },
    {
      id: 'reading_room',
      name: 'Reading Room',
      description:
        'A cozy room filled with old books and comfortable chairs. A large desk sits in the corner with papers scattered on it.',
      position: { x: 0, y: 1 },
      exits: { south: 'entrance', east: 'main_hall', north: 'archives' },
      objects: [
        {
          id: 'book_cipher',
          name: 'cipher book',
          description:
            'A book about ciphers and codes. The page is opened to the ROT13 cipher section.',
          takeable: true,
        },
        {
          id: 'desk',
          name: 'desk',
          description: 'An old wooden desk with a locked drawer.',
          takeable: false,
        },
      ],
      challenges: [],
      isExit: false,
    },
    {
      id: 'main_hall',
      name: 'Main Hall',
      description:
        'The grand main hall of the library. Tall bookshelves line the walls. A mysterious message is carved into the wooden door to the east: "URYYB JBEYQ"',
      position: { x: 1, y: 1 },
      exits: { west: 'reading_room', east: 'locked_room' },
      objects: [],
      challenges: ['cipher_puzzle'],
      isExit: false,
    },
    {
      id: 'locked_room',
      name: 'Secret Study',
      description:
        'A hidden study revealed! Ancient manuscripts and a golden key rest on a pedestal.',
      position: { x: 2, y: 1 },
      exits: { west: 'main_hall', south: 'exit' },
      objects: [
        {
          id: 'golden_key',
          name: 'golden key',
          description: 'An ornate golden key. It looks important.',
          takeable: true,
        },
      ],
      challenges: [],
      isExit: false,
      locked: true,
      unlockRequires: 'cipher_puzzle',
    },
    {
      id: 'storage',
      name: 'Storage Room',
      description:
        'A cramped storage room filled with boxes and old equipment. Dust fills the air.',
      position: { x: 1, y: 2 },
      exits: { west: 'entrance', north: 'archives' },
      objects: [
        {
          id: 'ladder',
          name: 'ladder',
          description: 'A wooden ladder. It could help you reach high places.',
          takeable: false,
        },
      ],
      challenges: [],
      isExit: false,
    },
    {
      id: 'archives',
      name: 'Archives',
      description:
        'The library archives. Rows of filing cabinets and shelves packed with documents. A riddle is written on the wall: "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?"',
      position: { x: 1, y: 0 },
      exits: { south: 'reading_room', west: 'storage' },
      objects: [],
      challenges: ['riddle'],
      isExit: false,
    },
    {
      id: 'exit',
      name: 'Exit Door',
      description:
        'The exit! A heavy wooden door with a golden keyhole. Freedom awaits beyond.',
      position: { x: 2, y: 2 },
      exits: { north: 'locked_room' },
      objects: [],
      challenges: [],
      isExit: true,
      locked: true,
      unlockRequires: 'golden_key',
    },
  ],

  challenges: [
    {
      id: 'cipher_puzzle',
      type: 'logic',
      title: 'The Cipher Door',
      description:
        'The message on the door reads: "URYYB JBEYQ". You need to decode it to unlock the door.',
      solution: 'HELLO WORLD',
      hints: [
        'The cipher book mentions ROT13...',
        'ROT13 shifts each letter by 13 positions in the alphabet',
        'Try decoding: URYYB JBEYQ',
      ],
      requiredItems: ['book_cipher'],
      reward: 'The door clicks open, revealing a secret study!',
      unlocks: 'locked_room',
    },
    {
      id: 'riddle',
      type: 'riddle',
      title: 'The Archive Riddle',
      description:
        'A riddle written on the archive wall: "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?"',
      solution: 'echo',
      hints: [
        'Think about sounds...',
        'What repeats what you say?',
        'It rhymes with "deck-oh"',
      ],
      reward: 'You hear a satisfying click from somewhere in the library...',
    },
  ],
};
