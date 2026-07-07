# Citizen Fraud Shield

A full-stack web app that helps citizens in India identify "digital arrest" scams, impersonators, and financial fraud in real time.

## Stack

- **Frontend** (`artifacts/citizen-fraud-shield`): React 19 + Vite + Tailwind CSS v4 + shadcn/ui + Wouter routing
- **API server** (`artifacts/api-server`): Express 5 + TypeScript, uses Groq (Llama 3.1) for fraud analysis
- **Shared libraries** (`lib/`): `api-spec` (OpenAPI), `api-client-react` (generated React Query hooks), `api-zod` (Zod schemas), `db` (Drizzle ORM + PostgreSQL)
- **Package manager**: pnpm workspaces

## How to run

Both services start automatically via Replit workflows:

- **Web** (`artifacts/citizen-fraud-shield: web`): `pnpm --filter @workspace/citizen-fraud-shield run dev`
- **API** (`artifacts/api-server: API Server`): `pnpm --filter @workspace/api-server run dev`

## Required secrets

| Secret | Purpose |
|---|---|
| `GROQ_API_KEY` | Powers the fraud analysis endpoint (`POST /api/analyze`) via Llama 3.1 |

## Key routes

- `/` — Landing page
- `/check` — Submit a message or call description for fraud analysis
- `/result/:id` — Analysis result page
- `/history` — Past checks (stored locally)
- `GET /api/healthz` — API health check
- `POST /api/analyze` — Fraud analysis (requires `GROQ_API_KEY`)

## User preferences

(none yet)
