# Skribbl.io Clone

A real-time multiplayer drawing and guessing game — built from scratch, fully deployed, and playable right now.

**Live Demo → [skribble-clone-two.vercel.app](https://skribble-clone-two.vercel.app)**

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

Visit `http://localhost:5173` — you'll need two browser tabs to test multiplayer.

---

## Project Structure

```
SkribbleClone/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/   # DrawingCanvas, ChatPanel, Lobby, etc.
│   │   ├── pages/        # Home, Room
│   │   ├── store/        # Zustand global state
│   │   ├── hooks/        # Socket event listeners
│   │   └── types/        # Shared TypeScript types
└── server/          # Node.js backend
    └── src/
        ├── classes/      # Game, Player, Room logic
        ├── socket/       # Socket.io event handlers
        └── config/       # Environment config
```

---

## Deployment

- Frontend deployed on **Vercel** — auto-deploys on every push to `main`
- Backend deployed on **Render** — free tier (may take ~30s to wake up on first visit)

Environment variable required on Vercel:
```
VITE_SERVER_URL=https://skribbleclone-sbuf.onrender.com
```
