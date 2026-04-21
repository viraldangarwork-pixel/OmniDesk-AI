# OmniDesk AI — OmniChannel AI Conversation Platform

Enterprise SaaS platform unifying WhatsApp, Messenger, Instagram, Telegram, Live
Chat, and Email into a single AI-augmented inbox with CRM, knowledge base,
workflow automation, and analytics.

## Stack

- **Frontend**: Vue 3 · TypeScript · Pinia · Vue Router · Tailwind · Axios · Socket.io
- **Backend**: FastAPI · SQLAlchemy (async) · Alembic · Pydantic · Celery · Redis · WebSockets
- **Database**: PostgreSQL + pgvector
- **Infra**: Docker · Nginx · AWS / DigitalOcean
- **AI**: Anthropic Claude (Opus / Sonnet / Haiku)

## Repository Layout

```
.
├── backend/              FastAPI service
├── frontend/             Vue 3 SPA
├── nginx/                Reverse proxy config
├── docker-compose.yml    Local dev + prod-ish stack
└── .env.example          Environment template
```

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000/docs
- Postgres: localhost:5432
- Redis: localhost:6379

## Services

| Service  | Purpose                                      |
|----------|----------------------------------------------|
| frontend | Vue 3 SPA served via Vite (dev) / Nginx (prod) |
| backend  | FastAPI REST + WebSocket API                 |
| worker   | Celery worker for async jobs                 |
| postgres | Primary datastore with pgvector              |
| redis    | Cache + broker + pub/sub                     |
| nginx    | Edge reverse proxy                           |

## Module Build Order

1. Backend foundation (auth, tenants, users, RBAC)
2. Database models + migrations
3. Inbox (conversations, messages, websocket)
4. CRM (contacts, leads)
5. AI (reply, summarize, route, RAG)
6. Knowledge base + workflows
7. Frontend shell + modules
8. Deployment

## License

Proprietary — OmniDesk AI.
