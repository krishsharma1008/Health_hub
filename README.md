# Health_hub

Production-ready AI health copilot web app with chat, voice, knowledge uploads, wearables analytics, and a secure backend.

## Tech Stack
- Frontend: React + Vite + Tailwind, Radix UI, Recharts, React Markdown
- Backend: Node + Express, OpenAI SDK (Chat, TTS, Whisper), WebSocket voice, multer uploads
- Data: SQLite (dev) or Postgres (prod) for users, profiles, memories, symptoms
- Vector: Local JS cosine similarity over stored embeddings

## Key Features
- AI chat with structured JSON responses, tool-calling, and citations
- Voice assistant: record in browser, server transcribes (Whisper) and replies with TTS
- Knowledge base uploads: docs or images, added to context with citations
- Wearables dashboard: simulated live data, predictions, risk assessment
- Security: JWT auth, bcrypt hashing, AES encryption for PHI, rate limiting, Helmet
- Theming & UX: dark mode, unified search, onboarding wizard, quick actions

## Develop
```bash
npm i
npm run dev:all
# Frontend: http://localhost:5173  Backend: http://localhost:3001
```

Create `.env` in project root:
```
# Backend
PORT=3001
OPENAI_API_KEY=sk-...
# Optional Postgres
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB
PG_SSL=true

# Frontend (optional for prod)
VITE_API_BASE_URL=http://localhost:3001
```

## Runtime Key Management
Set/validate the OpenAI key at runtime (no restart):
```bash
curl -s -X POST http://localhost:3001/api/admin/openai-key \
  -H 'Content-Type: application/json' \
  -d '{"apiKey":"sk-..."}'
```

## Auth API
- POST `/api/auth/register` { email, password, name }
- POST `/api/auth/login` { email, password }
Returns: `{ token, user }`

## Chat API
- POST `/api/ai/generate` { task, data, chatId? }
Returns structured JSON, tool results, citations.

## Voice API
- POST `/api/ai/voice-chat` (multipart form-data, `audio`)
Returns `{ transcription }`.

## Deploy
- Backend: Render/Heroku/Fly – set `OPENAI_API_KEY` and optionally `DATABASE_URL`
- Frontend: Vercel/Netlify – set `VITE_API_BASE_URL` to backend URL

## Safety
- Do not commit `.env`, db files, or uploads. A `.gitignore` is provided.

---
MIT © 2025
