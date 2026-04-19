# GPUbnb

GPUbnb is a hackathon marketplace for routing lightweight text-first AI jobs onto spare provider machines.

The project now has one clear web story:

- the stylized marketplace web app is the main product surface
- the Mongo-backed backend is the source of truth for jobs, providers, assignments, payouts, and event history
- the desktop/Tauri provider runtime is in progress separately

This repo intentionally does **not** try to claim production-grade sandboxing, decentralized verification, or a global GPU cloud. It focuses on a truthful, legible marketplace loop:

```text
submit text job
  -> backend creates queued job
  -> scheduler assigns a recent online provider
  -> provider worker starts and reports progress
  -> backend records runtime, proof hash, payout, fee, and events
  -> stylized web dashboard reflects the result
```

## What’s Implemented

### Web

- Stylized landing page and marketplace-themed dashboard
- Backend-driven marketplace dashboard at `/dashboard`
- Backend-driven providers view at `/providers`
- Backend-driven jobs board at `/jobs`
- Styled job submission flow at `/jobs/new`
- Styled results/ledger view at `/jobs/[id]/results`
- Temporary frontend-only demo session shortcut with `Ctrl+K`

### Backend

- Mongo/Mongoose models for providers, jobs, assignments, and job events
- Provider registration and heartbeat APIs
- Job creation and lookup APIs
- Worker poll/start/progress/complete/fail APIs
- Simple scheduler with basic stale-assignment cleanup
- Runtime-based pricing with budget cap
- 80/20 provider payout / platform fee split
- Basic trust signals:
  - provider completed jobs
  - provider failed jobs
  - provider success rate
  - last heartbeat
  - job runtime
  - proof hash
  - event timeline

## Current Scope

This pass is intentionally limited to:

- text-only inputs and outputs
- basic scheduling and retries
- backend truth for marketplace pages
- lightweight demo-mode auth bypass

Out of scope for now:

- real user auth
- secure provider token enforcement everywhere
- object/file storage
- desktop/Tauri native integration
- heavy artifact processing
- production infra hardening

## Project Structure

- `app/`: Next.js App Router pages and API routes
- `app/_components/`: stylized marketplace UI primitives and shell components
- `lib/models/`: Mongo/Mongoose schemas
- `lib/marketplace.ts`: shared formatting and dashboard/provider/job query helpers
- `lib/scheduling.ts`: assignment and stale-job logic
- `worker/`: lightweight CLI worker used for the current execution loop
- `src-tauri/`: provider desktop shell in progress

## Environment

Create `.env.local` from `.env.example`.

Important values:

```bash
MONGODB_URI=...
MONGODB_DB_NAME=gpubnb
GPUBNB_API_URL=http://localhost:3000
```

The app now builds cleanly even when Mongo is not configured, but backend-powered marketplace pages and APIs will show database-unavailable behavior until `MONGODB_URI` is set.

## Local Development

Install dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run dev
```

Optional: run the lightweight worker loop in another terminal:

```bash
npm run worker
```

## Demo Flow

1. Start the web app.
2. Register or heartbeat at least one provider through the worker flow.
3. Open `/dashboard` to show live marketplace summary.
4. Submit a text job from `/jobs/new`.
5. Let the worker pick it up and complete it.
6. Open `/jobs/[id]/results` to show:
   - assigned provider
   - runtime
   - final job cost
   - provider payout
   - platform fee
   - proof hash
   - event trail

## Quality Checks

- `npm run lint`
- `npm run build`

Both should pass before demoing.
