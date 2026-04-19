// Run in mongosh after selecting the GPUbnb database:
// use gpubnb
// load("mongodb/indexes.js")

db.machines.createIndex({ status: 1, lastHeartbeatAt: -1 });
db.machines.createIndex({ createdAt: -1 });
db.jobs.createIndex({ machineId: 1, status: 1, createdAt: 1 });
db.jobs.createIndex({ status: 1, createdAt: -1 });
db.jobs.createIndex({ createdAt: -1 });
db.jobevents.createIndex({ jobId: 1, createdAt: -1 });
db.jobevents.createIndex({ machineId: 1, createdAt: -1 });
db.jobevents.createIndex({ createdAt: -1 });
db.ledgerentries.createIndex({ jobId: 1, type: 1 }, { unique: true });
db.ledgerentries.createIndex({ machineId: 1, createdAt: -1 });
