# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SharedPad is a real-time collaborative drawing application with room-based collaboration. Users can join rooms via shared links and draw together in real-time with synchronized canvas state.

**Tech Stack:**
- Backend: Node.js + Express + Socket.IO
- Frontend: uni-app (Vue 3 + Vite) - compiles to H5 and WeChat mini-program
- Real-time: Socket.IO with room-based architecture

## Development Commands

### Server (Backend)
```bash
cd server
npm install
npm start          # Production mode
npm run dev        # Development mode with auto-reload (--watch)
```

Server runs on `http://localhost:3030` (configurable via PORT env var).

### Client (Frontend)
```bash
cd client
npm install
npm run dev:h5              # H5 development (browser)
npm run build:h5            # H5 production build
npm run dev:mp-weixin       # WeChat mini-program development
npm run build:mp-weixin     # WeChat mini-program production build
```

For WeChat mini-program: Open `client/dist/dev/mp-weixin` in WeChat DevTools.

## Architecture

### Socket.IO Room System
- **Room Management**: Each drawing session has a unique room ID (passed via `?room=xxx` URL param)
- **Drawing History**: Server stores drawing history per room in memory (`rooms` Map in `server/index.js`)
- **User Tracking**: Each room tracks connected users via socket IDs
- **Auto-cleanup**: Empty rooms with no history are automatically deleted

### Key Socket Events
- `join-room`: User joins a room, receives history
- `draw`: Broadcast drawing data to room members
- `clear`: Clear canvas for all users in room
- `user-count`: Real-time online user count updates
- `history`: Send existing drawings to newly joined users

### Client Architecture
- **Socket Wrapper**: `client/src/utils/socket.js` - Singleton Socket.IO client with auto-reconnect
- **Main Canvas**: `client/src/pages/index/index.vue` - Drawing logic, touch/mouse events, toolbar
- **Canvas API**: Uses uni-app's canvas component (compatible with H5 and mini-programs)

## Important Files

- `server/index.js` - Socket.IO server, room management, drawing history
- `client/src/utils/socket.js` - Socket.IO client wrapper with event handlers
- `client/src/pages/index/index.vue` - Main drawing page with canvas and toolbar
- `client/src/manifest.json` - uni-app configuration (app name, permissions, etc.)
- `client/src/pages.json` - Page routing configuration

## Configuration Notes

### Server URL
Update `SERVER_URL` in `client/src/utils/socket.js` when deploying:
- Development: `http://localhost:3030`
- Production: Your deployed server URL
- WeChat mini-program: Must be HTTPS and whitelisted in mini-program backend

### WeChat Mini-Program Deployment
1. Configure server domain in WeChat mini-program backend (must be HTTPS)
2. Update `SERVER_URL` in `client/src/utils/socket.js`
3. Build with `npm run build:mp-weixin`
4. Upload via WeChat DevTools

## Room Sharing Flow
1. User opens app → auto-generates or uses URL param room ID
2. Click "Share" → copies URL with `?room=xxx` parameter
3. Other users open shared URL → join same room
4. All users see synchronized drawing in real-time
