# PRD — URL Shortener

## 1. Overview

A fresher-scoped URL shortener, derived from a principal-engineer-level HLD and
deliberately reduced to what a first backend/systems-design portfolio project should
actually be: one service, one database, one cache, built and understood end to end
rather than partially wired across five pieces of infrastructure.

## 2. Goals

- Demonstrate REST API design, implemented by hand
- Demonstrate database configuration and connection pooling, implemented by hand
- Demonstrate the cache-aside pattern with Redis
- Ship a working, deployed, end-to-end product — backend, frontend, and hosting

## 3. Non-goals

Explicitly out of scope for the build. These remain documented talking points for
interview follow-up questions, not implemented infrastructure:

- Database sharding
- Distributed ID generation (Snowflake, range allocation)
- Kafka-based async analytics pipeline
- Multi-region deployment / failover
- Circuit breakers, bulkheads, load shedding

## 4. Users

Primary: the project owner, using this as a resume/interview artifact.
Secondary: anyone testing a deployed link directly.

## 5. Functional requirements

- **FR1**: Submit a long URL (optionally with a custom alias) and receive a short URL.
- **FR2**: Visiting a short URL returns a 302 redirect to the original long URL.
- **FR3**: Invalid or missing URLs are rejected with a clear error message.
- **FR4**: Create requests are rate-limited per IP.
- **FR5**: Frequently visited short URLs are served from Redis, not the database, on
  redirect.

## 6. Non-functional requirements

- Runs fully locally via a single `docker compose up`
- Configuration (DB and Redis credentials) is environment-variable driven, never
  hardcoded
- No formal latency SLA — at this project's traffic, "feels instant" is sufficient

## 7. Tech stack (decided)

| Layer | Choice |
|---|---|
| Backend | Node.js + Express |
| Database | MySQL via `mysql2` (promise API, no ORM) |
| Cache | Redis (cache-aside) |
| Frontend | React + Vite |
| Local dev | Docker Compose |
| Deployment | PM2 on VPS, or Railway/Render |

## 8. Acceptance criteria

- [ ] `POST /urls` returns a working short code for a valid URL
- [ ] `GET /:code` redirects correctly, served from Redis on a cache hit
- [ ] Missing or invalid `longUrl` returns a 400 with a clear message
- [ ] The rate limiter blocks excessive create requests from one IP
- [ ] The frontend can create and display a short URL against the real API
- [ ] `docker compose up` brings up the full local stack in one command

## 9. Explicitly learner-owned (not AI-generated)

- Database connection/pool configuration (`src/db/`)
- REST endpoint logic (`POST /urls`, `GET /:code`)

Everything else may be scaffolded by an AI coding assistant, per AGENTS.md.

## 10. Decisions already made

- MySQL over PostgreSQL
- `mysql2` raw driver over an ORM (Prisma), specifically to learn connection
  configuration directly rather than have it abstracted away
- Frontend is in scope; async click-analytics (queue/Kafka) is explicitly not
