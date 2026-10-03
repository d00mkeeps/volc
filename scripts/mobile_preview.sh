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
METRO_LOG=$(mktemp /tmp/volc-metro-XXXXXX.log)
METRO_PID=""

cleanup() {
    echo ""
    echo "🛑 Shutting down Mobile Dev Preview..."
    if [ -n "${METRO_PID}" ]; then
        kill -TERM "${METRO_PID}" 2>/dev/null || true
    fi
    if [ "${OBSERVER_ONLINE}" -eq 1 ]; then
        curl -s -X POST http://127.0.0.1:8006/preview/stop \
            -H "Content-Type: application/json" \
            -d '{"project": "volc", "reason": "Terminal preview process was terminated."}' > /dev/null 2>&1 || true
    fi
    rm -f "${METRO_LOG}"
    echo "✅ Preview tunnel closed and session cleaned up."
}
trap cleanup EXIT INT TERM

# 4. Start Expo Metro Bundler with Tunnel in background
echo "🚀 Starting Metro with Dev Client + Tunnel..."
echo "⏳ Initializing Metro & Ngrok tunnel (takes 10-15s)..."
echo "========================================================================"

npx expo start --dev-client --tunnel > >(tee "${METRO_LOG}") 2>&1 &
METRO_PID=$!

NOTIFIED=0

# 5. Monitor log stream for tunnel URL
while kill -0 "${METRO_PID}" 2>/dev/null; do
    if [ "${NOTIFIED}" -eq 0 ] && grep -E "exp\+volc://|exp://" "${METRO_LOG}" > /dev/null 2>&1; then
        TUNNEL_URL=$(grep -oE "exp\+volc://[^[:space:]]+" "${METRO_LOG}" | head -n 1 || true)
        if [ -z "${TUNNEL_URL}" ]; then
            TUNNEL_URL=$(grep -oE "exp://[^[:space:]]+" "${METRO_LOG}" | head -n 1 || true)
        fi

        if [ -n "${TUNNEL_URL}" ]; then
            NOTIFIED=1
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "✨ TUNNEL READY:"
            echo "   ${TUNNEL_URL}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

            if [ "${OBSERVER_ONLINE}" -eq 1 ]; then
                echo "📲 Sending interactive card to your iPhone via Telegram (@Airwavbot)..."
                HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8006/preview/notify \
                    -H "Content-Type: application/json" \
                    -d "{\"project\": \"volc\", \"tunnel_url\": \"${TUNNEL_URL}\", \"timeout_minutes\": 30, \"pid\": ${METRO_PID}}" || echo "000")

                if [ "${HTTP_CODE}" = "200" ]; then
                    ENCODED_URL=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "${TUNNEL_URL}")
                    TRAMPOLINE_URL="https://volc.mileshillary.com/preview?url=${ENCODED_URL}"

                    echo "✅ Notification dispatched to iPhone!"
                    echo "👉 Tap '[ 📱 Open in Volc ]' in Telegram to launch immediately."
                    echo "👉 Or open in Safari: ${TRAMPOLINE_URL}"
                    echo "🛑 Watchdog: 30-minute auto-teardown active."
                else
                    echo "⚠️ Failed to dispatch Telegram notification (HTTP ${HTTP_CODE})."
                fi
            fi
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        fi
    fi
    sleep 1
done

wait "${METRO_PID}" 2>/dev/null || true
