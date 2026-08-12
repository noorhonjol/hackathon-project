# AGENTS.md

Guidance for anyone (human or AI agent) working in this repo.

## What this is

A hello-world scaffold for a hackathon full-stack app. The goal is to prove out the
stack end-to-end so features can be built on top of it. Not production-hardened.

## Stack

- **Frontend:** React 18, TypeScript, Vite, Chakra UI v2, React Router v6, TanStack Query v5
- **Backend:** FastAPI, Python 3.12, SQLModel, PostgreSQL, boto3 (S3-compatible / DigitalOcean Spaces)
- **Infra:** Docker Compose (Postgres + backend + frontend + Caddy reverse proxy). No Redis. No local MinIO (S3 is cloud-only).

## Layout

```
frontend/src/{pages,components,hooks,services,utils,types}   # feature-sliced frontend
backend/app/{api/routes,models,services,db,core}              # layered backend
backend/app/api/routes/                                       # empty (.gitkeep) — add route modules here
backend/app/api/router.py                                     # import & include each route module
```

## Conventions

- **Adding a backend route:** create `backend/app/api/routes/<name>.py` exporting an
  `APIRouter`, then `include_router` it in `backend/app/api/router.py`. Endpoints are
  mounted under the `/api` prefix. A `/api/hello` route is wired as the example.
- **Entry point:** Caddy (`Caddyfile`) is the **only** host-exposed service, on port 80 by
  default (`WEB_PORT`). It serves the frontend and proxies `/api/*`, `/docs`, `/redoc`,
  `/openapi.json` to the backend. The backend and frontend containers are internal-only
  (`expose`), not published to the host.
- **Frontend data fetching:** add a hook in `src/hooks/` using `apiFetch` from
  `src/services/api.ts` (base path `/api`, proxied to the backend by Vite). API shapes
  go in `src/types/api.ts`.
- **Config** comes from env vars — see `.env.example` at the repo root and in each
  service. Never commit `.env` (gitignored).

## Commands

```bash
# one-time
cp .env.example .env           # fill in DigitalOcean Spaces creds when ready

# run everything (app + API via Caddy http://localhost, port 80)
docker compose up --build

# backend only (needs a reachable DATABASE_URL, e.g. compose db on localhost:5432)
cd backend && pip install -e . && uvicorn app.main:app --reload

# frontend only (needs the backend reachable at /api)
cd frontend && npm install && npm run dev
```

## Notes

- DB schema is created via `SQLModel.metadata.create_all` on startup (no Alembic yet).
- `/api/hello` is the one wired example route. The S3/Spaces service
  (`app/services/storage.py`) exists as infrastructure but has no route yet.