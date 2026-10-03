# Technical Specification: Tap-to-Launch Mobile Dev Preview & Notification Pipeline

- **Feature ID**: `feat-mobile-preview-notification`
- **Target Repositories**: [`volc`](file:///home/ubuntu/dev/volc) & [`observer`](file:///home/ubuntu/dev/observer)
- **Status**: `PROPOSED` (Awaiting Human Approval)
- **Authors**: Antigravity & Miles
- **Created**: 2026-10-03

---

## 1. Objective & Problem Statement

### The Problem
During development, verifying UI changes on a physical iPhone requires either:
1. Scanning an ASCII QR code from a workstation terminal (impossible when working remotely or via mobile AI chat).
2. Manually copy-pasting complex `exp+volc://expo-development-client/?url=...` URLs into Safari or the Dev Client.

Furthermore, running Metro with tunnels (`--tunnel`) on a server carries the risk of abandoned background processes remaining active if the engineer forgets to kill them.

### The Objective
Deliver a **zero-friction, tap-to-launch mobile preview pipeline**:
1. When an agent or user initiates a mobile preview, the server launches Metro with an ephemeral tunnel.
2. The user's iPhone immediately receives a **Telegram push notification** with:
   - An **inline action button**: `[ 📱 Open in Volc ]`
   - An **inline teardown button**: `[ 🛑 Stop Preview ]`
3. Tapping `[ 📱 Open in Volc ]` loads an HTTPS trampoline on Observer (`https://observer.mileshillary.com/preview/launch`) that immediately triggers the iOS custom scheme prompt (*"Open in 'Volc'?"*) and launches the app with sub-second hot reloading.
4. Tapping `[ 🛑 Stop Preview ]` (or hitting a 30-minute timeout) shuts down Metro, tears down the tunnel, and updates the Telegram card to `⏹️ Closed`.

---

## 2. Assumptions & Pre-Conditions

1. **Telegram Client**: The user has the Telegram mobile app installed with push notifications enabled for `@Airwavbot`.
2. **Volc Dev Build**: The user has the Volc Development Client app installed on their iPhone (registered with the custom scheme `volc://` / `exp+volc://`).
3. **Observer Ingress**: `https://observer.mileshillary.com` is publicly reachable via Cloudflare Tunnel on port `8006`.
4. **Dev Backend**: `volc-backend-dev` is running and healthy on port `8102` (`https://api.mileshillary.com/volc/dev`).
5. **Security Separation**: The Metro tunnel exclusively forwards port `8081` (JavaScript bundles and Hot Reloading deltas). It has zero access to host shell execution or database ports.

---

## 3. Capability Map & Module Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Capability Architecture                         │
│                                                                        │
│  [volc-preview-cli]                 [observer-preview-bridge]          │
│   • Metro runner with tunnel         • /preview/notify                 │
│   • Extracts exp+volc:// URL         • /preview/launch (HTML redirect) │
│   • Sends POST /preview/notify       • /preview/stop                   │
│             │                                    │                     │
│             └──────────────────┬─────────────────┘                     │
│                                │                                       │
│                                ▼                                       │
│                     [telegram-interactive-card]                        │
│                      • [ 📱 Open in Volc ] (HTTPS)                     │
│                      • [ 🛑 Stop Preview ] (Callback)                  │
│                      • 30m Auto-teardown watchdog                      │
└────────────────────────────────────────────────────────────────────────┘
```

| Module ID | Primary Location | Responsibility | Dependencies |
| :--- | :--- | :--- | :--- |
| `observer-preview-bridge` | `observer/operator/` | HTTP redirect trampoline, Telegram interactive card dispatch, callback query handling, session state tracking | None |
| `volc-preview-cli` | `volc/scripts/` | Health check for port 8102, Metro process supervisor, URL parser & dispatcher | `observer-preview-bridge` |
| `agent-preview-skill` | `volc/.agents/skills/` | Agent governance, CLI invocation rules, lifecycle cleanup instructions | `volc-preview-cli` |

---

## 4. API & Interface Specifications

### 4.1. Observer Operator Endpoints (`observer/operator/app.py`)

#### `POST /preview/notify`
Dispatches the interactive Telegram notification to the authorized user.
- **Request Body**:
  ```json
  {
    "project": "volc",
    "tunnel_url": "exp+volc://expo-development-client/?url=https%3A%2F%2Foqlfd8y-anonymous-8081.exp.direct",
    "timeout_minutes": 30,
    "pid": 3267123
  }
  ```
- **Response**: `200 OK`
  ```json
  { "ok": true, "session_id": "prev-volc-1790954", "expires_at": "2026-10-03T15:36:00Z" }
  ```
- **Behavior**:
  - Stores the active session in an in-memory dictionary `_active_previews[project]`.
  - Dispatches Telegram message with an `InlineKeyboardMarkup`:
    - Row 1: `InlineKeyboardButton(text="📱 Open in Volc", url="https://observer.mileshillary.com/preview/launch?p=volc")`
    - Row 2: `InlineKeyboardButton(text="🛑 Stop Preview", callback_data="preview_stop:volc")`
  - Schedules an asynchronous auto-close timer for `timeout_minutes`.

#### `GET /preview/launch`
HTTPS trampoline page that redirects iOS Safari into the custom scheme.
- **Query Parameter**: `p` (project slug, e.g. `volc`).
- **Response**: `text/html` (200 OK or 410 Gone).
- **HTML Payload**:
  ```html
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Launching Volc...</title>
    <meta http-equiv="refresh" content="0; url={{ TUNNEL_URL }}">
    <script>
      window.location.href = "{{ TUNNEL_URL }}";
    </script>
    <style>
      body { font-family: -apple-system, sans-serif; background: #000; color: #fff; text-align: center; padding: 60px 20px; }
      .card { max-width: 400px; margin: 0 auto; background: #1c1c1e; padding: 32px 24px; border-radius: 20px; }
      .btn { display: inline-block; background: #ff3b30; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>🌋 Launching Volc Dev Build</h2>
      <p style="color: #8e8e93; font-size: 15px;">Opening your development client with hot reloading enabled...</p>
      <a class="btn" href="{{ TUNNEL_URL }}">Tap to Open Directly</a>
    </div>
  </body>
  </html>
  ```
- If the session does not exist or expired, returns a clean card: `Preview session has ended.`

#### `POST /preview/stop`
Programmatic termination endpoint.
- **Request Body**: `{ "project": "volc" }`
- **Behavior**: Kills the associated Metro PID (if on host), clears the active preview state, and edits the Telegram message to indicate it has stopped.

---

### 4.2. Telegram Callback Query Handler (`observer/operator/telegram_handler.py`)

- Intercepts callback queries matching `preview_stop:<project>`.
- Answers the Telegram callback query popup: `"Preview stopped."`
- Terminates the Metro process via SIGTERM.
- Edits the original message in Telegram to:
  ```html
  ⏹️ <b>Volc Dev Preview Closed</b>
  The ephemeral tunnel and Metro server have been shut down.
  ```

---

### 4.3. Volc Runner Script (`volc/scripts/mobile_preview.sh`)

Enhanced pipeline:
1. Verify `volc-backend-dev` health on port `8102`.
2. Start Metro in background with `--dev-client --tunnel`.
3. Pipe stdout through an extractor:
   - When line matching `exp+volc://expo-development-client/?url=` appears:
   - Extract URL.
   - Run curl:
     ```bash
     curl -s -X POST http://127.0.0.1:8006/preview/notify \
       -H "Content-Type: application/json" \
       -d "{\"project\": \"volc\", \"tunnel_url\": \"$URL\", \"pid\": $$}"
     ```
4. Output ASCII QR code to terminal for local backup, then wait.

---

## 5. Security & Lifecycle Rules

1. **Strict Lifetime**: Max preview session duration = **30 minutes**. A watchdog timer terminates the process if not explicitly closed.
2. **Access Control**: `/preview/notify` is accessible locally (`127.0.0.1:8006`). The public `/preview/launch` endpoint only serves the redirect if a session is currently active.
3. **No Direct Custom URIs in Telegram**: Telegram rejects `exp+volc://` URLs on buttons. Using `https://observer.mileshillary.com/preview/launch` guarantees 100% compliance with Telegram Bot API specifications while providing a polished iOS Safari handoff.

---

## 6. Incremental Implementation Plan

To ensure testability at every stage without breaking running services:

### Slice 1: Observer Redirect & State Engine
- Implement session store and `GET /preview/launch` in `observer/operator/app.py`.
- Add unit tests verifying HTML generation, redirect URLs, and 410 expired responses.
- Verify slice with `python3 -m unittest`.

### Slice 2: Telegram Card & Teardown Callback
- Implement `POST /preview/notify` and `POST /preview/stop` in `observer/operator/app.py`.
- Implement `callback_query` handling in `observer/operator/telegram_handler.py` for `preview_stop:volc`.
- Test message dispatch and button callbacks.

### Slice 3: Volc Script Integration & Auto-Notifier
- Update `volc/scripts/mobile_preview.sh` to extract the `exp+volc://` URL and automatically POST to `http://127.0.0.1:8006/preview/notify`.
- Test running the script and confirm the push notification arrives on iPhone with the working button.

### Slice 4: Agent Skill & Protocol Documentation
- Update `volc/.agents/skills/mobile-preview/SKILL.md` and `volc/AGENTS.md`.
- Commit, push, and verify through GitHub Actions CI/CD to production.

---

## 7. Success Criteria

- [ ] Starting `./scripts/mobile_preview.sh` sends an `@Airwavbot` push notification to the user's iPhone within 5 seconds.
- [ ] Notification contains `[ 📱 Open in Volc ]` (URL button) and `[ 🛑 Stop Preview ]` (Callback button).
- [ ] Tapping `[ 📱 Open in Volc ]` opens Safari and prompts *"Open in 'Volc'?"*, booting the Dev Client into the live hot-reloading workspace.
- [ ] Tapping `[ 🛑 Stop Preview ]` in Telegram terminates the Metro process, closes the tunnel, and updates the Telegram card to `⏹️ Closed`.
- [ ] If left unattended for 30 minutes, the watchdog automatically shuts down the tunnel.
