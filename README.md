# Hackathon Hello World

Full-stack scaffold: **React + TypeScript + Vite + Chakra UI + React Router + TanStack Query**
on the frontend, **FastAPI + SQLModel + PostgreSQL + S3-compatible storage** on the backend,
all wired up with **Docker Compose**.

> Redis and a local S3/MinIO are intentionally **not** included. Object storage points at
> **DigitalOcean Spaces** (cloud) and is configured purely via environment variables.

## Prerequisites

- Docker + Docker Compose

## Quick start

```bash
cp .env.example .env          # edit .env to add DigitalOcean Spaces creds (optional for dev)
docker compose up --build
```

- App (via Caddy reverse proxy): http://localhost:8080
- API docs (Swagger): http://localhost:8080/docs
- Postgres: `localhost:5432` (user/pass/db from `.env`, defaults `hackathon`/`hackathon`/`hackathon`)

Caddy is the **only** host-exposed service. The backend and frontend containers are
internal-only (`expose`) and are reached solely through Caddy: `/api/*`, `/docs`,
`/redoc`, `/openapi.json` → backend; everything else → frontend. To use a real domain
with auto-HTTPS, swap `:80` in the `Caddyfile` for your domain.

## Configure object storage (DigitalOcean Spaces)

In `.env`, set:

```
S3_ENDPOINT_URL=https://<your-space>.<region>.digitaloceanspaces.com
S3_REGION=<region>              # e.g. nyc3
S3_ACCESS_KEY_ID=<spaces key>
S3_SECRET_ACCESS_KEY=<spaces secret>
S3_BUCKET=<your-space-name>
```

Leave the S3 fields blank to disable storage checks (the backend reports `configured: false`).

## Project structure

```
frontend/src/{pages,components,hooks,services,utils,types}   React feature-sliced UI
backend/app/{api/routes,models,services,db,core}             FastAPI layered backend
backend/app/api/routes/                                       empty — add your route modules here
backend/app/api/router.py                                     mount route modules under /api
docker-compose.yml                                            db + backend + frontend
```

See [`AGENTS.md`](./AGENTS.md) for conventions and commands.

## Local dev (without Docker)

```bash
# backend (with the compose db running on localhost:5432)
cd backend && pip install -e . && uvicorn app.main:app --reload

# frontend
cd frontend && npm install && npm run dev
```

## Status

This is a starter scaffold. A single `/api/hello` route is wired (it seeds and returns a
`Message`, proving the React → Caddy → FastAPI → Postgres path). The `routes/` folder is where
you add more endpoints — include each in `backend/app/api/router.py`. The S3/Spaces service
(`backend/app/services/storage.py`) is available as infrastructure but has no route yet.