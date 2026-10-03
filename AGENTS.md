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

1. **Activate Skill**: Use the **`mobile-preview`** skill.
2. **Launch Preview Tunnel**:
   Execute the background launcher:
   ```bash
   ./scripts/mobile_preview.sh
   ```
   *(Run as a background task with `WaitMsBeforeAsync: 10000`).*
3. **Capture & Provide Handoff**:
   - Extract the generated **`exp://...`** URL and QR code from the command output.
   - Present the deep link directly to the user so they can tap or paste it into the **Volc Dev Build** app on their iPhone.
   - Explain that all code edits made by the agent will **hot-reload in sub-second real-time** on their phone.
4. **Clean Teardown**:
   - The tunnel is strictly ephemeral.
   - Once testing/handoff is complete, use `manage_task` to kill the background task so no dangling processes remain on the host.

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
