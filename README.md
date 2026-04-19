# GPUbnb

ComputeBNB/GPUbnb is a hackathon marketplace for routing lightweight AI and batch jobs onto spare provider machines.

The project now has one clear web story:

- the stylized marketplace web app is the main product surface
- the Mongo-backed backend is the source of truth for jobs, providers, assignments, payouts, and event history
- the desktop/Tauri provider runtime and Docker sandbox runner are wired in as provider-side execution surfaces

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
- Provider bearer tokens for worker heartbeat, poll, start, progress, complete, and fail routes

### Provider Runtime

- Tauri desktop shell for provider controls and runtime status
- Node worker CLI for provider registration, heartbeat, polling, and mocked execution
- `worker-runner` Docker sandbox service for approved demo workloads
- Sandbox runner controls exposed through the Tauri command layer

## Current Scope

This pass is intentionally limited to:

- text-first inputs and outputs, plus approved Docker demo workloads
- basic scheduling and retries
- backend truth for marketplace pages
- lightweight provider token auth for worker routes

Out of scope for now:

- real user auth
- production user authentication and authorization
- object/file storage
- heavy artifact processing
- hostile-code sandboxing guarantees
- production infra hardening

## Project Structure

- `app/`: Next.js App Router pages and API routes
- `app/_components/`: stylized marketplace UI primitives and shell components
- `lib/models/`: Mongo/Mongoose schemas
- `lib/marketplace.ts`: shared formatting and dashboard/provider/job query helpers
- `lib/scheduling.ts`: assignment and stale-job logic
- `src/`: provider desktop UI components, hooks, reducers, and Tauri clients
- `src-tauri/`: Tauri v2 provider desktop shell and worker manager
- `worker/`: lightweight CLI worker used for the current execution loop
- `worker-runner/`: Docker sandbox execution service

## Environment

Create `.env.local` from `.env.example`.

Important values:

```bash
MONGODB_URI=...
MONGODB_DB_NAME=gpubnb
GPUBNB_API_URL=http://localhost:3000
GPUBNB_PROVIDER_ID=
GPUBNB_PROVIDER_TOKEN=
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

Optional: run the Tauri provider app:

```bash
npm run tauri
```

Optional: run the Docker sandbox runner from `worker-runner/`:

```bash
npm install
cp .env.example .env
docker build -t computebnb/python-runner:local samples/images/python-runner
npm run dev
```

The runner listens on `http://localhost:4317`. See `worker-runner/README.md` for endpoint and payload examples.

## Demo Flow

1. Start the web app.
2. Register or heartbeat at least one provider through the Tauri or worker flow.
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

## Basic End-to-End Docker Flow

This is the simplest requester-to-provider path:

1. Configure `.env.local` with `MONGODB_URI`.
2. Start the web app:

```bash
npm run dev
```

3. Start the Tauri provider app:

```bash
npm run tauri
```

4. In the provider app, open Jobs and start the Docker sandbox runner.
   - The runner starts with polling enabled.
   - If `PROVIDER_ID` and `PROVIDER_TOKEN` are not set, it self-registers as a Docker-capable provider.
5. Open the requester dashboard:

```text
http://localhost:3000/requester
```

6. Queue one of the sample jobs.
7. The runner polls `/api/worker/poll`, receives the job, runs the `runnerPayload` in Docker, and reports completion or failure back to the API.
8. Open the job result page from `/requester` or `/jobs` to see the stored result and event trail.

Requester sample payloads also live in `worker-runner/samples/requester/`.

## Quality Checks

- `npm run lint`
- `npm run build`

Both should pass before demoing.
