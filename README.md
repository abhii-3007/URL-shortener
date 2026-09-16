# URL Shortener

A fresher-scoped implementation of a URL shortener, based on a principal-engineer-level
HLD design, deliberately simplified to a single service, single database, and Redis
cache. No sharding, no Kafka, no multi-region — those stay as documented "how I'd scale
this" talking points, not built infrastructure.

## Tech stack

- Node.js + Express — API server
- MySQL, via the `mysql2` driver (promise API, no ORM) — source of truth for `short_code -> long_url`
- Redis — cache-aside layer on the redirect path
- React (Vite) — minimal, dark-themed frontend calling the API
- Docker + Docker Compose — local MySQL/Redis without native installs
- PM2 (VPS) or Railway/Render — deployment

## Prerequisites

See the install checklist in the project setup conversation. Short version: Node.js LTS,
Git, Docker Desktop, and a REST client (Postman/Insomnia) for testing endpoints before
any frontend exists.

## Getting started

1. Clone the repo
2. `cp .env.example .env` and fill in the values
3. `docker compose up -d` — starts Postgres and Redis
4. `npm install`
5. `npm run dev`
6. In a second terminal: `cd client && npm install && npm run dev` for the frontend

## API

| Method | Path      | Description                          |
|--------|-----------|---------------------------------------|
| POST   | `/urls`   | Create a short URL from a long one    |
| GET    | `/:code`  | 302 redirect to the original long URL |

## Folder structure

```
client/
  src/
    App.jsx          # UrlShortener component (frontend)
  vite.config.js
src/
  app.js            # Express app entry point
  routes/           # route definitions
  controllers/       # request handlers
  db/                # database connection + queries
  lib/               # external clients (Redis, etc.)
  middleware/        # validation, rate limiting
  utils/             # base62 encoding, helpers
```

## Build status

- [ ] Project scaffold
- [ ] Database configuration
- [ ] `POST /urls`
- [ ] `GET /:code`
- [ ] Redis cache-aside
- [ ] Validation + rate limiting
- [x] Frontend component (`UrlShortener.jsx`) — built, not yet wired to a live API
- [ ] Deployment

## Scope notes

This intentionally excludes distributed ID generation, database sharding, Kafka-based
analytics, multi-region failover, and circuit breakers. Those are real concepts worth
knowing for an interview, not infrastructure this project's traffic ever needs.
