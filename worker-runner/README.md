# ComputeBNB Worker Runner

`worker-runner` is the MVP execution layer for provider machines. It runs approved job types in short-lived Docker containers, captures logs, stores structured results, and exposes a small REST API for local demos.

This is intentionally a constrained sandbox, not a hostile-code isolation system. The demo safety model is:

- only approved images are accepted
- each job gets a fresh container
- containers run as a non-root user
- no privileged mode, all Linux capabilities dropped, and `no-new-privileges`
- no network inside job containers
- read-only root filesystem with a small `/tmp` tmpfs
- CPU, memory, pids, log, and timeout limits
- only one isolated host workspace is mounted per job
- labeled containers are removed after completion and by a periodic cleanup loop

## Folder Structure

```text
worker-runner/
  src/
    api/                 Express REST routes
    execution/           Sandbox executor abstraction and Docker CLI backend
    jobs/                Job validation, in-memory store, poller, runner service
    utils/               Log buffer and filesystem helpers
    config.ts            Environment config
    index.ts             Service entrypoint
  samples/
    images/python-runner Sample approved Docker image
    payloads/            Demo job payloads
  artifacts/             Per-job copied artifacts
  workspaces/            Temporary per-job bind mounts
```

## Setup

From this folder:

```bash
npm install
cp .env.example .env
docker build -t computebnb/python-runner:local samples/images/python-runner
npm run dev
```

The service listens on `http://localhost:4317` by default.

Check Docker health:

```bash
curl http://localhost:4317/health
```

## Run Demo Jobs

Submit a Python script job:

```bash
curl -s -X POST http://localhost:4317/jobs/execute \
  -H 'content-type: application/json' \
  --data @samples/payloads/python-script.json
```

The response includes a job id. Poll it:

```bash
curl -s http://localhost:4317/jobs/<job-id>
```

Run the inference demo:

```bash
curl -s -X POST http://localhost:4317/jobs/execute \
  -H 'content-type: application/json' \
  --data @samples/payloads/inference.json
```

Run the benchmark demo:

```bash
curl -s -X POST http://localhost:4317/jobs/execute \
  -H 'content-type: application/json' \
  --data @samples/payloads/benchmark.json
```

Test timeout enforcement:

```bash
curl -s -X POST http://localhost:4317/jobs/execute \
  -H 'content-type: application/json' \
  --data @samples/payloads/timeout.json
```

Cancel a running job:

```bash
curl -s -X POST http://localhost:4317/jobs/<job-id>/cancel
```

## Polling A Real Or Mock API

For local REST demos, leave polling off:

```env
POLL_ENABLED=false
```

To poll the existing ComputeBNB app API:

```env
POLL_ENABLED=true
API_BASE_URL=http://localhost:3000
PROVIDER_ID=
PROVIDER_TOKEN=
```

If `PROVIDER_ID` and `PROVIDER_TOKEN` are blank, the poller self-registers as a Docker-capable provider and uses the returned token for heartbeat/poll/start/complete/fail calls.

The poller calls `POST /api/worker/poll`. If the remote job includes a `runnerPayload`, it is used directly as a worker-runner payload. Otherwise the poller maps the current app's free-form job shape into a `benchmark_demo` job so the MVP can still execute something real.

## REST API

### `POST /jobs/execute`

Starts a job asynchronously and returns `202`.

Supported job types:

- `python_script`
- `inference`
- `benchmark_demo`

Accepted limits:

- `timeoutMs`
- `cpus`
- `memoryMb`
- `pidsLimit`
- `logLimitBytes`

### `GET /jobs/:id`

Returns the job state, live truncated logs, and final execution result once complete.

States:

- `queued`
- `pulling_image`
- `running`
- `completed`
- `failed`
- `timed_out`

### `POST /jobs/:id/cancel`

Kills the running container for the job. The final state will usually become `failed` with Docker's killed exit code.

### `GET /health`

Checks whether the Docker daemon is available.

## Approved Images

The allow-list is in `src/jobs/registry.ts`.

Current images:

- `computebnb/python-runner:local`
- `python:3.12-slim`

For the smoothest demo, build and use `computebnb/python-runner:local`; it includes the inference and benchmark helper scripts.

## Notes

- This runner uses the Docker CLI rather than Dockerode to keep the MVP easy to inspect and debug.
- The executor is hidden behind `Executor`/`SandboxExecutor`, so a future Firecracker or gVisor backend can implement the same methods.
- Results are stored in memory for fast iteration. Persisting results to MongoDB or the marketplace API can be added without changing the Docker backend.
- Artifacts are copied from `/workspace/artifacts` into `worker-runner/artifacts/<job-id>`.
