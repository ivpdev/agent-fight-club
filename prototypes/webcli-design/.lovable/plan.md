

# 🖥️ Terminal Adventure Game — Minimal Prototype

## Overview
A text-based browser adventure game with a retro terminal interface. Players type commands to navigate rooms and solve puzzles. The visual style draws from the reference image — a dark, gritty CRT-style terminal with a **black background**, **yellow/amber text**, and **red accents**, evoking a retro hacker/cyberpunk aesthetic.

---

## 1. Terminal UI
- **Full-screen terminal interface** with a dark black background, monospace font, and CRT-style feel
- **Amber/yellow main text** for descriptions and narrative, **red for errors/warnings**, **white for system messages**
- A blinking cursor input line at the bottom where the player types commands
- Scrollable text history showing previous commands and responses
- Optional subtle CRT scanline effect and screen flicker for atmosphere
- ASCII art title screen on load

## 2. Command Parser
- Accepts typed text commands like `go north`, `look`, `take key`, `use key on door`, `inventory`, `help`
- Supports shorthand: `n`, `s`, `e`, `w` for directions
- `help` command lists available actions
- Unrecognized commands return a flavored error message (e.g., *"That doesn't make sense here..."*)

## 3. Game World — Small Map (4-6 rooms)
- A small interconnected map of rooms the player can navigate
- Each room has a **description**, **available exits**, and optionally **items** or **interactive objects**
- Example layout:
  - **Entry Hall** → connects to Storage Room (east), Corridor (north)
  - **Storage Room** → contains a key item
  - **Corridor** → connects to Locked Door (north), Entry Hall (south)
  - **Locked Room** → requires key to enter, contains the puzzle goal
- Room descriptions update based on state (e.g., "The door is now open")

## 4. Simple Puzzle Mechanic
- One core puzzle to demonstrate the system: **find a key → unlock a door → reach the goal**
- Basic inventory system: `take` items, `use` items, `inventory` to check what you're carrying
- Win condition when the player reaches the final room or completes the objective

## 5. Game Feel & Polish
- Typewriter-style text animation for room descriptions (text appears letter by letter)
- Sound-optional — no audio needed for prototype
- Responsive layout that works on both desktop and mobile
- Mobile-friendly: input field is always visible at the bottom

---

## No Backend Required
Everything runs client-side with React state management. No database, no auth, no saving — just a self-contained game loop in the browser.

