# AGENTS.md — project context for AI coding tools

This file gives context to any AI coding assistant (Cursor, Antigravity, Claude Code,
or similar) working in this repo. Read this before generating code.

## What this project is

A deliberately scoped-down URL shortener: one Express service, one relational
database, one Redis cache. See README.md for the full API and folder layout.

## Do NOT generate code for these — leave them alone

The project owner is implementing these by hand as a learning exercise. If asked to
scaffold, complete, or fix something in these areas, stop and suggest they write it
themselves instead, with guidance if asked:

- **Database configuration**: anything under `src/db/` — the connection setup,
  connection pooling, environment-variable wiring for `DB_HOST`/`DB_PORT`/`DB_USER`/
  `DB_PASSWORD`/`DB_NAME`, and the schema/migration for the `urls` table.
- **REST API endpoint logic**: the `POST /urls` and `GET /:code` route handlers/
  controllers — the actual create and redirect logic, including Base62 lookup and
  cache-aside calls.

Everything else in this repo is fair game to scaffold normally.

## Conventions

- Async/await throughout — no callback-style code.
- One JSON error shape across the API: `{ "error": "message" }`.
- Environment variables (see `.env.example`): `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`,
  `DB_PASSWORD`, `DB_NAME`, `REDIS_URL`.
- Database: MySQL via the `mysql2` driver (promise API) — deliberately not an ORM,
  since the project owner is learning connection configuration directly.
- Sentence-case commit messages, no trailing periods.
- Keep the MVP scope — no sharding, distributed ID generation, Kafka, multi-region,
  or circuit breakers. Those are documented as future extensions in README.md only.

## Data model

```
short_code   (PK)
long_url
created_at
expires_at   (nullable)
```

## Frontend

A dark-themed React component (`UrlShortener.jsx`) has already been built and should
be placed at `client/src/App.jsx` when the Vite scaffold is created. Its create-URL
call is currently a local placeholder — wire it to the real `POST /urls` endpoint
(via a `VITE_API_BASE_URL` env var) once that endpoint exists. This area is NOT
restricted — scaffold and wire it normally.
