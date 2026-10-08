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

Whenever the user asks to preview changes on their iPhone, test a new UI flow, or verify updates:

1. **Activate Skill**: Use the **`mobile-dev-preview`** skill.
2. **Launch Preview Session (Cloud Service or Script)**:
   - **Option A (Instant Cloud Service - Recommended)**:
     ```bash
     curl -s -X POST http://127.0.0.1:8006/preview/start | jq .
     ```
     *This triggers the background `volc-preview.service` systemd daemon on Cano, binds Metro with Cloudflare Quick Tunnel, dispatches the Telegram card to the user's phone, and sets a 30-minute auto-expiry watchdog.*
   - **Option B (Interactive Script)**:
     ```bash
     ./scripts/mobile_preview.sh
     ```
     *(Run as a background task with `WaitMsBeforeAsync: 10000`).*
3. **Capture & Provide Handoff**:
   - The launcher dispatches an interactive card directly to the user's iPhone via Telegram (`@Airwavbot`) with:
     - `[ 📱 Open in Volc ]` (Safari trampoline: `https://volc.mileshillary.com/preview?url=...`)
     - `[ 🛑 Stop Preview ]` (One-tap instant session teardown)
   - Present the deep link (`exp+volc://...`) and trampoline URL in chat.
   - Explain that all code edits made by the agent will **hot-reload in sub-second real-time** on their phone.
4. **Clean Teardown**:
   - The tunnel is strictly ephemeral and guarded by a 30-minute auto-teardown watchdog.
   - To stop manually:
     ```bash
     curl -s -X POST http://127.0.0.1:8006/preview/stop
     ```
     Or the user can tap `[ 🛑 Stop Preview ]` in Telegram or type `/preview stop`.

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
