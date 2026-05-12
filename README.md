# Skribbl.io Clone
A real-time multiplayer drawing and guessing game — built from scratch, fully deployed, and playable right now.

**Live Demo → [skribble-clone-two.vercel.app](https://skribble-clone-two.vercel.app)**  
**Backend → [skribbleclone-sbuf.onrender.com](https://skribbleclone-sbuf.onrender.com)**

---

## What is this?
I built a full-stack clone of Skribbl.io — a game where one player draws a word and others race to guess it. The goal was to understand how real-time communication works at a deeper level, beyond just tutorials.

The trickiest part was keeping every player's canvas perfectly in sync — strokes, undo actions, and clears all had to propagate instantly across all clients with zero lag.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Backend | Node.js, Express, TypeScript |
| Real-time | Socket.io |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Features
- **Private Rooms** — create a room and share the code with friends
- **Synchronized Canvas** — brush, eraser, fill (bucket), undo, and clear — all synced in real time
- **Game Loop** — turn-based drawing, configurable rounds and draw time
- **Scoring** — faster guesses earn more points; close guesses get a nudge
- **Hints** — letters reveal automatically as time runs out
- **Live Leaderboard** — scores update in real time after every round
- **Podium Screen** — winner announced at game end
- **OOP Backend** — Room, Game, Player, and SocketHandler classes (bonus)

---

## Architecture Overview

- **Drawing sync** — drawer's stroke is sent via Socket.io to server → server broadcasts to all players in room → each client renders it on HTML5 Canvas
- **Game logic** — lives entirely on the server inside `Game` and `Room` classes; controls turn order, scoring, hints, and round transitions. Clients only render what server sends
- **State management** — Zustand on frontend holds the latest game snapshot received from server
- **Word matching** — normalized (trimmed + lowercased); close-guess detection if guess is a substring of the word

---

## Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/Dora2213179/SkribbleClone.git
cd SkribbleClone
```

### 2. Start the backend
```bash
cd server
npm install
npm run dev
```

### 3. Start the frontend
```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` — open two browser tabs to test multiplayer.

---

## Project Structure
```
SkribbleClone/
├── client/
│   └── src/
│       ├── components/   # DrawingCanvas, ChatPanel, Lobby, etc.
│       ├── pages/        # Home, Room
│       ├── store/        # Zustand global state
│       ├── hooks/        # Socket event listeners
│       └── types/        # Shared TypeScript types
└── server/
    └── src/
        ├── classes/      # Game, Player, Room, RoomManager
        ├── socket/       # SocketHandler (all event logic)
        └── config/       # Environment config
```

---

## Deployment
- Frontend on **Vercel** — auto-deploys on every push to `main`
- Backend on **Render** — free tier (may take ~30s to wake up on first visit)

Environment variable on Vercel:
```
VITE_SERVER_URL=https://skribbleclone-sbuf.onrender.com
```

> This is a web application — no APK applicable.
