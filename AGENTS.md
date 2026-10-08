# Volc Agent Instructions (`AGENTS.md`)

Welcome to the **Volc** codebase. This document outlines critical rules, conventions, and procedures for autonomous agents working in this repository.

---

## 🏗️ Architecture & Environments

- **Mobile Client**: Expo SDK 54, React Native 0.81, Expo Router, Tamagui, Zustand.
- **Backend API**: FastAPI (Python), PostgreSQL / Supabase, LangChain.
- **Environments**:
  - **Dev Environment (`dev/`)**:
    - Backend runs in Docker container `volc-backend-dev` on port **`8102`**.
    - Routed via Cloudflare / Caddy at `https://api.mileshillary.com/volc/dev` (WebSocket: `wss://api.mileshillary.com/volc/dev/llm`).
  - **Production Environment (`prod/`)**:
    - Backend runs in Docker container `supreme-octo-doodle-api` on port **`8002`**.
    - Routed via Cloudflare / Caddy at `https://api.mileshillary.com/volc`.
    - **RULE**: Agents work strictly in `dev/`. Deploys to `prod/` are handled via GitHub Actions upon pushing to `origin/main`.

---

## 📱 Mobile Preview & In-App Testing Protocol

> [!IMPORTANT]
> **ZERO MANUAL USER WORK MANDATE**:
> **NEVER ask, prompt, or expect the user to start servers, run terminal commands, manage tunnels, or launch Metro manually.**
> You are an autonomous agent. When mobile changes need testing or the user asks to preview:
> 1. You automatically trigger the cloud preview service via API.
> 2. You notify the user with the direct links (a Telegram card also automatically pops up on their phone).
> 3. You tear down the preview service via API when testing is complete.

### Autonomous Agent Workflow:

1. **Trigger Preview Service**:
   Run:
   ```bash
   curl -s -X POST http://127.0.0.1:8006/preview/start | jq .
   ```
   *This contacts the persistent `volc-preview.service` daemon on Cano, binds Metro with Cloudflare Quick Tunnel, dispatches the Telegram card with action buttons to the user's iPhone (`@Airwavbot`), and activates the 30-minute watchdog.*

2. **Present Handoff to User**:
   Deliver a clean handoff message with the clickable URLs:
   - **Safari Trampoline**: `https://volc.mileshillary.com/preview?url=<CF_TUNNEL_URL>`
   - **Deep Link**: `exp+volc://expo-development-client/?url=<CF_TUNNEL_URL>`
   - Inform the user: *"An interactive card was dispatched to your iPhone in Telegram (@Airwavbot). Tap **[ 📱 Open in Volc ]** to view live with sub-second hot reloading."*

3. **Autonomous Teardown**:
   When testing is complete or the user signals they are done:
   ```bash
   curl -s -X POST http://127.0.0.1:8006/preview/stop
   ```
   *(The user can also tap `[ 🛑 Stop Preview ]` in Telegram or type `/preview stop` at any time).*

---

## 🧪 Testing & Verification Gates

- Always verify TypeScript and component integrity:
  ```bash
  npx tsc --noEmit
  ```
- Backend tests:
  ```bash
  cd backend && pytest
  ```
