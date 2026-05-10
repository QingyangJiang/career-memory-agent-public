# Demo Deployment Guide

This document describes a demo-safe deployment for the Career Memory Agent portfolio
project. The online demo is not a production SaaS product, not a resume generator, not
an auto-apply bot, and not evidence of ART training or model-quality improvement.

The demo should preserve the project positioning:

- memory-first;
- evidence-grounded;
- evaluation-driven;
- ART bridge as an optional research interface only.

Public demo users should not enter private personal information. Demo data may be
reset periodically.

## Demo Mode Environment

Recommended first deployment values:

```bash
DEMO_MODE=true
DEMO_PROVIDER=mock
DEMO_ALLOW_DEEPSEEK=false
DEMO_RESET_ENABLED=false
DEMO_MAX_INPUT_CHARS=4000
DEMO_REQUEST_LIMIT_PER_SESSION=20
```

Optional reset values:

```bash
DEMO_RESET_ENABLED=true
DEMO_RESET_TOKEN=replace-with-long-random-token
```

Do not expose `DEMO_RESET_TOKEN` or any provider API key to the browser.

The committed `/api/demo/config` endpoint returns only public demo fields:

- demo mode status;
- selected demo provider;
- DeepSeek allow/deny flag;
- input length limit;
- per-session request limit.

It must not return `DEMO_RESET_TOKEN` or provider API keys.

## Route A: Render / Railway + SQLite Volume

This is the recommended first route because the app is currently local-first and uses
SQLite through Prisma. Use a persistent disk or volume so demo data survives restarts.

Example `DATABASE_URL` values:

```bash
# Render persistent disk
DATABASE_URL=file:/var/data/demo.db

# Railway mounted volume
DATABASE_URL=file:/app/data/demo.db
```

Build command:

```bash
npm ci && npx prisma generate && npm run build
```

Start command:

```bash
npx prisma db push && npm run start
```

Seeded demo data can be created manually after deploy:

```bash
npm run seed
```

For reset, prefer a protected one-off job or admin-only shell command against the same
persistent database. The committed `/api/demo/reset` endpoint is a protected placeholder:
it is gated by `DEMO_MODE`, `DEMO_RESET_ENABLED`, and optional `DEMO_RESET_TOKEN`, but
it currently returns `resetPerformed=false` and does not automatically clear or reseed
data.

Persistent storage notes:

- confirm the SQLite path points to a mounted disk, not an ephemeral build directory;
- run Prisma commands against the same `DATABASE_URL` used by the server;
- keep demo reset manual until the deployment platform and seed process are verified;
- do not run reset automatically on normal user traffic.

## Reset Endpoint Status

The first public deployment should treat reset as an operator workflow, not a normal
user action. Use one-off jobs, a platform shell, or a manual `npm run seed` against the
persistent demo database after schema setup.

Do not show reset controls to ordinary demo users.

A future real reset implementation should require all of the following:

- `DEMO_MODE=true`;
- `DEMO_RESET_ENABLED=true`;
- a long random token supplied through `Authorization: Bearer ...` or
  `x-demo-reset-token`;
- explicit clearing of mutable demo tables only;
- reseeding through the same seed path used for deployment;
- an audit log or clear warning in the JSON response.

## Route B: Vercel + Postgres / Neon / Supabase

Vercel is a good long-term frontend host, but it is not a good fit for directly running
SQLite as the primary writable database. Serverless file systems are ephemeral and do
not provide the persistent writable SQLite path this project expects.

To deploy on Vercel, migrate the Prisma datasource to Postgres and provision a managed
database such as Neon or Supabase. That route should be treated as future work, not the
first demo target.

Postgres deployment would require:

- updating the Prisma datasource provider;
- running migrations against the managed database;
- validating seed/reset behavior in a non-local database;
- rechecking eval and trace paths against the hosted database.

## Demo Boundaries

- The public demo defaults to Mock provider.
- DeepSeek should stay disabled unless explicitly configured with
  `DEMO_ALLOW_DEEPSEEK=true`.
- The demo should never expose API keys or reset tokens to the client.
- The demo should show seeded memory, evidence grounding, AgentRun traces, eval
  reports, and example-only ART-ready export.
- The demo should not claim ART training, trained model ids, before/after ART eval
  deltas, or production SaaS readiness.

## Launch Checklist

Before sharing the public demo URL:

- CI badge is green.
- `.env.example` includes the complete demo mode variable set.
- `DATABASE_URL` points to a persistent volume for durable demo data.
- `npx prisma db push` has completed against the deployed database.
- Seed data has been loaded.
- `DEMO_MODE=true`.
- `DEMO_PROVIDER=mock`.
- `DEMO_ALLOW_DEEPSEEK=false`.
- `/demo` opens successfully.
- Demo scenario cards open a prefilled chat through `/chat?prefill=...`.
- Memory safety prompt creates a pending `MemorySuggestion`, not a direct `Memory`.
- Weak JD guardrail prompt does not create Evidence, Opportunity, or Decision objects.
- Opportunity-light prompt creates the expected inspectable artifacts.
- AgentRun trace is visible for meaningful work.
- Seed data contains no private personal information.
- Reset strategy is decided and not exposed to ordinary users.
- README demo URL is updated after deployment.

## Manual QA Checklist

Run these checks before sending the demo link to reviewers:

- `/demo` opens.
- `DemoBanner` is visible in demo mode.
- Chat provider selector shows `Demo locked`.
- Memory Safety scenario opens `/chat?prefill=...` with the prompt prefilled.
- Memory Safety prompt sends successfully and only creates pending
  `MemorySuggestion`, not direct durable `Memory`.
- Weak JD scenario does not create Evidence, Opportunity, or Decision objects.
- Opportunity-light scenario creates Evidence, Opportunity, and Decision objects.
- AgentRun trace can be opened after meaningful work.
- Latest eval report link opens.
- Latest report manifest link opens.
- Weak-JD example trajectory link opens.
- DeepSeek is disabled in the public demo unless explicitly enabled for a controlled
  deployment.
- Input longer than `DEMO_MAX_INPUT_CHARS` is rejected by the UI and server guard.
- Request limit is rejected after `DEMO_REQUEST_LIMIT_PER_SESSION`.
- Reset endpoint is unavailable when disabled or when token validation fails.
- Service restart or redeploy leaves database state consistent with the selected
  storage route.
