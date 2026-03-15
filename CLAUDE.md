# Lang Party

Real-time multiplayer language learning game. Players join a room, see phrases in a foreign language, and race to pick the correct translation.

## Commands

- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npm start` — Production server
- `npm run lint` — ESLint
- `npx tsc --noEmit` — Type check

## Architecture

**Custom server** (`server.ts`): wraps Next.js with Socket.io on a single HTTP server. The server must be restarted to pick up changes in `server.ts` and `game/` (no hot-reload for server code).

**Game engine** (`game/engine.ts`): in-memory state machine managing rooms, players, rounds, timers, and scoring. No database — all state lives in memory and is lost on restart.

**Client** uses a Socket.io singleton hook (`src/hooks/useSocket.ts`) and persistent `playerId` stored in `sessionStorage` for reconnect/refresh support.

### Key files

| Path | Purpose |
|------|---------|
| `server.ts` | Custom Next.js + Socket.io HTTP server |
| `game/engine.ts` | Game state machine, room logic, scoring |
| `game/types.ts` | Server-side types |
| `src/lib/types.ts` | Shared TypeScript types, Socket.io event interfaces |
| `src/data/questions.ts` | All question data (~400 questions) |
| `src/hooks/useSocket.ts` | Socket.io client singleton + React hook |
| `src/app/page.tsx` | Home page — enter name, create/join room |
| `src/app/room/[code]/page.tsx` | Game room — orchestrates all phases |
| `src/components/` | Lobby, Question, Reveal, Scoreboard, PlayerList |

### Game flow

```
LOBBY → QUESTION → REVEAL → ... (10 rounds) → GAME_OVER → (play again) → LOBBY
```

### Socket.io events

Client → Server: `join-room`, `start-game`, `answer`, `play-again`, `leave-room`
Server → Client: `room-state`, `question`, `tick`, `reveal`, `game-over`, `error`

## Important conventions

- **UI language**: Russian. All user-facing text must be in Russian.
- **Question directions**: both foreign→Russian and Russian→foreign topics.
- **Question complexity**: intermediate level — phrases, idioms, false friends. Not single basic words.
- **Player identity**: uses persistent `playerId` in sessionStorage (not socket.id) so refreshing a page reconnects to the same player slot.
- **Scoring**: correct answer = 80 pts (first 2 sec), linearly decreasing to 50 pts at timer end. Wrong = 0.
- **Reconnect**: server re-sends current question/reveal/game-over on rejoin so players resume where they left off.

## Deployment

- **Live**: https://lang-party.onrender.com/
- **Repo**: https://github.com/slyapustin/lang-party
- **Host**: Render.com free tier (auto-deploy on push to main)
- **Build**: `npm install && npm run build`
- **Start**: `npm start`
- Free tier sleeps after ~15min idle; first request after sleep takes ~30s.
