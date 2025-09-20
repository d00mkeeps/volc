#!/bin/bash

# Get local IP address
LOCAL_IP=$(ifconfig en0 inet | grep 'inet ' | awk '{print $2}')

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not get local IP address"
    exit 1
fi

echo "🔍 Found local IP: $LOCAL_IP"

# Update network utility file
# Adjust the path based on where your @ alias points to:
NETWORK_FILE="utils/network.ts"  # or "src/utils/network.ts" if @ points to src

if [ -f "$NETWORK_FILE" ]; then
    # Replace the hardcoded IP in the return statement
    sed -i.bak "s/return \"[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\"/return \"$LOCAL_IP\"/" "$NETWORK_FILE"
    echo "✅ Updated network file with IP: $LOCAL_IP"
else
    echo "⚠️  Network file not found at: $NETWORK_FILE"
    echo "   Please update the NETWORK_FILE path in this script"
fi

# Start backend
echo "🚀 Starting backend server..."
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload