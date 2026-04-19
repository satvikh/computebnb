# Requester Sample Jobs

These payloads are safe demo jobs a requester can send to a provider through the Docker sandbox runner.

Run one directly against a local `worker-runner`:

```bash
curl -s http://localhost:4317/jobs/execute \
  -H 'content-type: application/json' \
  --data @worker-runner/samples/requester/csv-profile-job.json
```

The same payload shapes are also embedded in the requester dashboard at `/requester`.
