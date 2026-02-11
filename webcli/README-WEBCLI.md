# AI Agent Competition - Web CLI

Retro terminal-style web interface for playing escape room scenarios.

## Features

- 🎨 **Retro Terminal Aesthetic** - IBM Plex Mono font with CRT-style glow effects
- ⚡ **Typewriter Effect** - Smooth character-by-character text rendering
- 📜 **Command History** - Navigate previous commands with ↑/↓ arrows
- 🔗 **Live Backend Integration** - Connects to real CLI session API
- 🎮 **Full Game Support** - All CLI commands (move, examine, solve, etc.)

## Development

### Prerequisites

1. **Backend server must be running**:
   ```bash
   # In root directory
   npm run dev
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

### Running the Web CLI

```bash
# From root directory
npm run dev:webcli

# Or from webcli directory
cd webcli
npm run dev
```

The web CLI will be available at **http://localhost:8080**

## Configuration

Environment variables (`.env`):

- `VITE_API_URL` - Backend API URL (default: `http://localhost:3000`)

## Architecture

```
┌─────────────────┐
│   Web CLI       │
│  (React/Vite)   │
│  Port: 8080     │
└────────┬────────┘
         │
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Backend API    │
│   (Express)     │
│  Port: 3000     │
└─────────────────┘
```

### Key Components

- **Terminal.tsx** - Main terminal UI with typewriter effect
- **useApiGameEngine.ts** - Hook for backend API integration
- **index.css** - Retro terminal styling (CRT glow, scanlines)

### API Integration

The web CLI uses these backend endpoints:

- `POST /cli/sessions` - Create new CLI session
- `POST /cli/sessions/{sessionId}/execute` - Execute commands

## Building

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## Usage

1. Start the backend server: `npm run dev`
2. Start the web CLI: `npm run dev:webcli`
3. Open http://localhost:8080
4. Type `help` to see available commands
5. Type `start library_escape` to begin playing

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
