# GPUbnb

**Airbnb for idle compute.**  
GPUbnb is a lightweight marketplace that lets people lend out spare laptop or desktop compute for AI jobs, while users submit workloads and pay only for what gets executed.

For the MVP, provider nodes are simple local CLI agents running on laptops. The platform handles registration, heartbeats, job assignment, execution tracking, results, and earnings.

---

## Problem

AI workloads are expensive to run, and a huge amount of local compute sits idle.

At the same time:
- builders need cheap access to compute for small AI jobs
- students and developers have underused laptops and machines
- existing cloud GPU platforms are centralized, expensive, and overkill for lightweight workloads

GPUbnb turns spare compute into a marketplace.

---

## Solution

GPUbnb lets anyone:
- **list their machine** as a compute provider
- **receive jobs** through a lightweight local agent
- **execute tasks locally**
- **earn money** when their machine completes work

Users can:
- submit AI jobs through a web app
- get matched to available provider nodes
- monitor progress in real time
- receive outputs, runtime info, and pricing

---

## MVP Scope

This MVP is **not** a decentralized training protocol.

It is a **marketplace + orchestration layer** for lightweight AI workloads.

### What the MVP proves
- machines can register with the network
- provider nodes can advertise availability
- users can submit jobs
- the platform can assign jobs to providers
- providers can execute jobs locally
- results can be returned and validated
- providers can accumulate earnings

### What the MVP does not try to solve
- trustless distributed training
- blockchain settlement
- true production-grade verification
- high-performance GPU clustering
- peer-to-peer networking

---

## Core Features

### User-side
- submit an AI job
- set budget and workload type
- view job status
- inspect results
- see final cost

### Provider-side
- run a local CLI agent
- register laptop/machine
- send heartbeats
- receive assigned jobs
- execute work locally
- see earnings update

### Platform
- provider registry
- scheduler / matcher
- job queue
- status tracking
- lightweight validation
- payout accounting

---

## Architecture

### 1. Web App
The web app is the main control plane.

It handles:
- provider onboarding
- job submission
- job status dashboards
- marketplace/scheduler visibility
- result pages
- provider earnings

### 2. Local Agent
Each provider machine runs a lightweight CLI worker.

The agent:
- registers the machine
- sends periodic heartbeats
- polls for assigned jobs
- executes jobs locally
- reports progress
- uploads results
- receives earnings credit

### 3. Backend / Scheduler
The backend handles:
- provider registry
- job queue
- provider eligibility checks
- assignment logic
- failure detection
- cost calculation

### 4. Storage
Stores:
- job inputs
- job outputs
- logs
- proof hashes
- provider metadata
- earnings records

---

## System Flow

```text
User submits job
    ->
Web app / API receives job
    ->
Scheduler finds eligible provider
    ->
Provider agent polls and receives assignment
    ->
Agent executes task locally
    ->
Agent uploads result + logs
    ->
Platform marks job complete
    ->
Provider earnings are updated