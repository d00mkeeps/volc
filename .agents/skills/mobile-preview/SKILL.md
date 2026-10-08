---
name: mobile-preview
description: "Launches and manages an ephemeral mobile dev preview session with Expo Dev Client and tunnel for real-time testing on an iPhone. ACTIVATE whenever the user wants to test, preview, hot-reload, or QA mobile app changes on their physical phone."
---

# 📱 Mobile Dev Preview Skill (`mobile-preview`)

This skill enables autonomous agents to launch, manage, and cleanly hand off an ephemeral **Expo Dev Client** preview session with **sub-second Hot Reloading** directly to the user's iPhone.

---

## 🔒 Security & Architecture Guarantees

1. **Strictly Ephemeral**: The tunnel exists **only** while the background task is running. Terminating the task instantly closes the tunnel.
2. **Zero Ingress Risk**: The tunnel exclusively forwards to port `8081` (Metro JavaScript Bundler). It cannot execute shell commands, access the host filesystem, or reach database ports.
3. **Isolated Dev Backend**: The dev build routes API and WebSocket requests to `https://api.mileshillary.com/volc/dev` (`volc-backend-dev` on port `8102`), isolating all test workouts from production data.

---

## 🚀 Step-by-Step Procedure for Agents

> [!IMPORTANT]
> **ZERO MANUAL USER WORK MANDATE**:
> **NEVER ask the user to start servers, run terminal commands, or manage tunnels.**
> Agents must autonomously trigger and manage the preview lifecycle.

### Step 1: Pre-Flight Backend Check
Verify that `volc-backend-dev` is running and healthy on port `8102`:
```bash
curl -sf http://127.0.0.1:8102/health
```
If unhealthy or offline, start it with:
```bash
docker compose -f docker-compose.dev.yml up -d volc-backend-dev
```

### Step 2: Trigger the Cloud Preview Service
As an autonomous agent, invoke the preview service via the Observer Operator API:
```bash
curl -s -X POST http://127.0.0.1:8006/preview/start | jq .
```
This automatically:
1. Spawns the ephemeral Cloudflare Quick Tunnel on Cano (`https://*.trycloudflare.com`).
2. Starts Metro bundler proxying to the tunnel with Hermes bytecode support.
3. Dispatches the interactive Telegram notification card directly to the user's iPhone (`@Airwavbot`) with `[ 📱 Open in Volc ]` and `[ 🛑 Stop Preview ]`.
4. Sets an automatic 30-minute teardown watchdog.

### Step 3: Present Handoff to User
Deliver a clean, clickable handoff message to the user:
- Provide the **Safari trampoline link** (`https://volc.mileshillary.com/preview?url=...`).
- Provide the **`exp+volc://...` deep link**.
- Inform the user:
  1. An interactive card is waiting on their iPhone in Telegram (`@Airwavbot`).
  2. Tap `[ 📱 Open in Volc ]` to connect.
  3. Any code edits you make will **hot-reload in real-time**.

### Step 4: Autonomous Teardown
When testing is complete or the user signals they are done:
```bash
curl -s -X POST http://127.0.0.1:8006/preview/stop
```
*(The user can also tap `[ 🛑 Stop Preview ]` in Telegram at any time).*
