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

### Step 1: Pre-Flight Backend Check
Verify that `volc-backend-dev` is running and healthy on port `8102`:
```bash
curl -sf http://127.0.0.1:8102/health
```
If unhealthy or offline, start it with:
```bash
docker compose -f docker-compose.dev.yml up -d volc-backend-dev
```

### Step 2: Launch the Ephemeral Metro Tunnel
Run the launcher script as a background process using `run_command`:
```bash
./scripts/mobile_preview.sh
```
*Set `WaitMsBeforeAsync` to `10000` (10 seconds) so Metro has enough time to initialize the tunnel before moving to the background.*

### Step 3: Extract the Handoff Link & QR Code
Check the output or task logs for:
1. The **`exp://`** URL (e.g. `exp://u8q7-xxx.anonymous.8081.exp.direct`)
2. The ASCII QR code block.

### Step 4: Present Handoff to User
Deliver a clean, actionable handoff message to the user:
- State clearly that the **ephemeral tunnel is live**.
- Provide the **`exp://...` deep link**.
- Instruct the user:
  1. Open the **Volc Dev Build** app on their iPhone.
  2. Tap the link or scan the QR code to connect.
  3. Confirm that updates made by the agent will **hot-reload in real-time**.

### Step 5: Teardown & Lifecycle Management
When the user indicates they are finished testing or the session ends:
- Use `manage_task` with action `'kill'` on the Metro task ID.
- Confirm the tunnel is closed and resources are released.
