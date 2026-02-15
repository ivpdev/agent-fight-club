

# Mobile-First Agent Builder

A clean, mobile-first app for configuring AI agents with helper sub-agents.

## Screen 1: Main (Agent Screen)
- **Top bar** with "Agent" title and a "Helpers" button on the right
- **Model selector** dropdown (Claude 4.5, DeepSeek)
- **Instructions** large textarea filling most of the screen
- **Bottom bar** with a "Play" button (centered, prominent)

## Screen 2: Helpers List
- **Header** with "Helpers" title
- **List of helpers** — each item shows its name and is tappable
  - Default items: "Puzzle Solver" and "Code Explorer"
- **Bottom bar** with "Back" button to return to Main

## Screen 3: Helper Detail
- **Top bar** with "Helper" title and an on/off toggle switch
- **Name** — editable text field
- **Model selector** dropdown (Claude 4.5, DeepSeek)
- **Instructions** large textarea filling most of the screen
- **Bottom bar** with "Back" button

## Data & State
- All state managed client-side with React state (no backend needed for now)
- Helpers stored as an array in a context/state at the app level
- Navigation via React Router between the three screens

## Design
- Mobile-first layout (max-width container, full-height screens)
- Clean, minimal UI using existing shadcn/ui components (Select, Textarea, Switch, Button)
- Subtle borders and spacing for a native-app feel

