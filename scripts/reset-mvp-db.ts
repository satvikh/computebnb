import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

function readEnvFileValue(name: string) {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return null;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const [key, ...rest] = trimmed.split("=");
    if (key === name) {
      return rest.join("=").trim().replace(/^"|"$/g, "");
    }
  }

  return null;
}

async function main() {
  const uri = process.env.MONGODB_URI ?? readEnvFileValue("MONGODB_URI");
  const dbName = process.env.MONGODB_DB_NAME ?? readEnvFileValue("MONGODB_DB_NAME") ?? "gpubnb";

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const existingCollections = await db.listCollections({}, { nameOnly: true }).toArray();
    const names = new Set(existingCollections.map((collection) => collection.name));

    const collectionsToDrop = [
      "consumers",
      "ledgerentries",
      "jobevents",
      "assignments",
      "users",
      "machines",
      "jobs",
    ];

    for (const name of collectionsToDrop) {
      if (names.has(name)) {
        await db.collection(name).drop();
        console.log(`Dropped collection: ${name}`);
      }
    }

    await db.createCollection("users");
    await db.createCollection("machines");
    await db.createCollection("jobs");
    await db.createCollection("ledgerentries");

    await db.collection("users").createIndexes([
      { key: { email: 1 }, name: "email_unique", unique: true, sparse: true },
      { key: { username: 1 }, name: "username_unique", unique: true, sparse: true },
      { key: { walletAddress: 1 }, name: "wallet_address_unique", unique: true, sparse: true },
    ]);

    await db.collection("machines").createIndexes([
      { key: { producerUserId: 1 }, name: "producer_user_id" },
      { key: { status: 1 }, name: "status" },
      { key: { walletAddress: 1 }, name: "wallet_address_unique", unique: true, sparse: true },
    ]);

    await db.collection("jobs").createIndexes([
      { key: { machineId: 1, status: 1, createdAt: 1 }, name: "machine_status_created_at" },
      { key: { consumerUserId: 1, createdAt: -1 }, name: "consumer_created_at_desc" },
    ]);

    await db.collection("ledgerentries").createIndexes([
      { key: { jobId: 1, type: 1 }, name: "job_type_unique", unique: true },
      { key: { machineId: 1, createdAt: -1 }, name: "machine_created_at_desc" },
      { key: { consumerUserId: 1, createdAt: -1 }, name: "consumer_created_at_desc" },
    ]);

    console.log(`Reset complete for database: ${dbName}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
