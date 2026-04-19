import json
import pathlib
import time

input_path = pathlib.Path(__import__("sys").argv[1])
payload = json.loads(input_path.read_text())

print("loading tiny demo model")
time.sleep(0.3)
print("running inference")

text = str(payload.get("text", "ComputeBNB demo input"))
result = {
    "label": "demo_result",
    "score": round(min(len(text) / 100, 1), 3),
    "input_preview": text[:80],
}

artifact_dir = pathlib.Path("/workspace/artifacts")
artifact_dir.mkdir(exist_ok=True)
(artifact_dir / "result.json").write_text(json.dumps(result, indent=2))

print(json.dumps(result))
