import json
import pathlib
import time

payload = json.loads(pathlib.Path(__import__("sys").argv[1]).read_text())
iterations = int(payload.get("iterations", 75000))

print(f"benchmark iterations={iterations}")
start = time.perf_counter()
total = 0
for i in range(iterations):
    total += (i * i) % 97
duration = time.perf_counter() - start

artifact_dir = pathlib.Path("/workspace/artifacts")
artifact_dir.mkdir(exist_ok=True)
(artifact_dir / "benchmark.json").write_text(
    json.dumps({"iterations": iterations, "checksum": total, "duration_seconds": duration}, indent=2)
)

print(f"checksum={total}")
print(f"duration_seconds={duration:.6f}")
