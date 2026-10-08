#!/usr/bin/env bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Volc Mobile Dev Preview & Ephemeral Tunnel Pipeline
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. Launches Metro with Expo Dev Client and ngrok tunnel
# 2. Automatically extracts the custom scheme exp+volc:// URL
# 3. Dispatches an interactive Telegram push notification to iPhone
# 4. Sets a 30-minute auto-teardown watchdog timer
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

echo "========================================================================"
echo "📱 VOLC MOBILE DEV PREVIEW LAUNCHER"
echo "========================================================================"

# 1. Check Dev Backend health
echo "🔍 Checking Volc dev backend (port 8102)..."
if curl -sf http://127.0.0.1:8102/health > /dev/null 2>&1; then
    echo "✅ Dev backend is healthy on port 8102"
else
    echo "⚠️ Dev backend not responding. Starting volc-backend-dev..."
    if [ -f "docker-compose.dev.yml" ]; then
        docker compose -f docker-compose.dev.yml up -d
        sleep 3
    else
        echo "❌ docker-compose.dev.yml not found."
    fi
fi

# 2. Check Observer Operator notification service
echo "🔍 Checking Observer Operator preview service (port 8006)..."
OBSERVER_ONLINE=0
if curl -sf http://127.0.0.1:8006/health > /dev/null 2>&1; then
    echo "✅ Observer Operator is online (Telegram notifications active)"
    OBSERVER_ONLINE=1
else
    echo "⚠️ Observer Operator not detected on port 8006. Push notifications will be skipped."
fi

# 3. Set up log and process trapping
CF_LOG=$(mktemp /tmp/volc-cf-XXXXXX.log)
METRO_LOG=$(mktemp /tmp/volc-metro-XXXXXX.log)
CF_PID=""
METRO_PID=""

cleanup() {
    echo ""
    echo "🛑 Shutting down Mobile Dev Preview..."
    if [ -n "${METRO_PID}" ]; then
        kill -TERM "${METRO_PID}" 2>/dev/null || true
    fi
    if [ -n "${CF_PID}" ]; then
        kill -TERM "${CF_PID}" 2>/dev/null || true
    fi
    # Also clean up any orphan cloudflared processes on 8081
    pkill -f "cloudflared.*8081" 2>/dev/null || true

    if [ "${OBSERVER_ONLINE}" -eq 1 ]; then
        curl -s -X POST http://127.0.0.1:8006/preview/stop \
            -H "Content-Type: application/json" \
            -d '{"project": "volc", "reason": "Mobile preview process was terminated."}' > /dev/null 2>&1 || true
    fi
    rm -f "${CF_LOG}" "${METRO_LOG}"
    echo "✅ Preview tunnel closed and session cleaned up."
}
trap cleanup EXIT INT TERM

# Ensure port 8081 is clean before starting
fuser -k 8081/tcp >/dev/null 2>&1 || true
pkill -f "cloudflared.*8081" 2>/dev/null || true
sleep 1

# 4. Start Cloudflare Quick Tunnel
echo "🚀 Initializing Cloudflare Quick Tunnel on port 8081..."
cloudflared tunnel --url http://127.0.0.1:8081 > "${CF_LOG}" 2>&1 &
CF_PID=$!

CF_URL=""
for i in {1..20}; do
    CF_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" "${CF_LOG}" | head -n 1 || true)
    if [ -n "${CF_URL}" ]; then
        break
    fi
    sleep 1
done

if [ -z "${CF_URL}" ]; then
    echo "❌ Failed to obtain Cloudflare Tunnel URL. Tunnel logs:"
    cat "${CF_LOG}"
    exit 1
fi

echo "🌐 Cloudflare Tunnel Established:"
echo "   ${CF_URL}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 5. Start Expo Metro Bundler with Cloudflare Proxy
echo "🚀 Starting Metro with Dev Client proxying to Cloudflare..."
export EXPO_PACKAGER_PROXY_URL="${CF_URL}"

npx expo start --dev-client --localhost > >(tee "${METRO_LOG}") 2>&1 &
METRO_PID=$!

# Build deep link
ENCODED_CF_URL=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "${CF_URL}")
DEEP_LINK="exp+volc://expo-development-client/?url=${ENCODED_CF_URL}"
TRAMPOLINE_URL="https://volc.mileshillary.com/preview?url=${ENCODED_CF_URL}"

# Wait for Metro to initialize
sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ VOLC MOBILE DEV PREVIEW READY:"
echo "   Custom Scheme: ${DEEP_LINK}"
echo "   Public Trampoline: ${TRAMPOLINE_URL}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "${OBSERVER_ONLINE}" -eq 1 ]; then
    echo "📲 Sending interactive card to your iPhone via Telegram (@Airwavbot)..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8006/preview/notify \
        -H "Content-Type: application/json" \
        -d "{\"project\": \"volc\", \"tunnel_url\": \"${DEEP_LINK}\", \"timeout_minutes\": 30, \"pid\": ${METRO_PID}}" || echo "000")

    if [ "${HTTP_CODE}" = "200" ]; then
        echo "✅ Notification dispatched to iPhone!"
        echo "👉 Tap '[ 📱 Open in Volc ]' in Telegram to launch immediately."
        echo "👉 Or open in Safari: ${TRAMPOLINE_URL}"
        echo "🛑 Watchdog: 30-minute auto-teardown active."
    else
        echo "⚠️ Failed to dispatch Telegram notification (HTTP ${HTTP_CODE})."
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

# Keep script running and wait on Metro
wait "${METRO_PID}" 2>/dev/null || true
