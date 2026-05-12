# 🎨 Skribbl.io Clone

A full-stack, real-time multiplayer drawing and guessing game inspired by Skribbl.io. Built with React (Vite), Tailwind CSS v4, Zustand, Node.js, and Socket.io.

## Features
- **Real-Time Multiplayer**: Create private rooms and invite friends with links/codes.
- **Synchronized Drawing Canvas**: Tools include Brush, Eraser, Fill (Bucket), Undo, Clear, and color palette.
- **Game Mechanics**: Turn-based drawing, time-based scoring, close-guess detection, and automatic hints.
- **Dynamic UI**: Popups for word choice, real-time leaderboards, and podium at game over.

## Live Deployment
Live Frontend URL: `[Insert Your Render/Vercel URL Here]`
Live Backend URL: `[Insert Your Render Backend URL Here]`

## Local Setup

### 1. Start the Backend Server
```bash
cd server
npm install
npm run dev
```

### 2. Start the Frontend Client
```bash
cd client
npm install
npm run dev
```
Then visit `http://localhost:5174/`

## Deployment Instructions (Render.com)

This repository includes a `render.yaml` file to make deployment to Render extremely easy via Blueprint.

1. **Push your code to GitHub.**
2. Go to [Render.com](https://render.com/) and create a new account / log in.
3. Click on **"Blueprints"** (or New > Blueprint).
4. Connect your GitHub account and select this repository.
5. Render will automatically detect the `render.yaml` file and create two services: `skribbl-backend` and `skribbl-frontend`.
6. **IMPORTANT STEP**: 
   - Once the deployment starts, go to your **Render Dashboard**.
   - Find the URL for the `skribbl-backend` service (e.g., `https://skribbl-backend-xxxx.onrender.com`).
   - Go to your `skribbl-frontend` service settings -> **Environment**.
   - Edit the `VITE_SERVER_URL` variable to be your actual backend URL.
   - Click "Save" and then **"Manual Deploy > Clear build cache & deploy"** on the frontend service.

Now your game is fully accessible online!
