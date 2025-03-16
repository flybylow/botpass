#!/bin/bash

# BotPass Webhook Test Script (curl version)
# This script sends a test webhook to your local BotPass instance.
# Usage: ./webhook-test.sh [botId]

# Configuration
PRIMARY_PORT=3030
FALLBACK_PORT=3031
BOT_ID=${1:-"9U8JhxaBe8Fv8OtLq4KN"}  # Use first argument or default
MESSAGE_TYPES=("message" "status" "error" "event")
MESSAGE_TYPE=${MESSAGE_TYPES[$RANDOM % ${#MESSAGE_TYPES[@]}]}
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
# Use a safer method to generate random values (avoid tr errors)
RANDOM_VALUE=$(LC_ALL=C < /dev/urandom tr -dc 'a-zA-Z0-9' | head -c 10)

# Create payload
PAYLOAD=$(cat << EOF
{
  "botId": "$BOT_ID",
  "messageType": "$MESSAGE_TYPE",
  "content": "Test webhook from curl script ($TIMESTAMP)",
  "timestamp": "$TIMESTAMP",
  "data": {
    "source": "webhook-test-curl",
    "randomValue": "$RANDOM_VALUE"
  }
}
EOF
)

# Function to test a webhook endpoint
test_webhook() {
  local port=$1
  local webhook_url="http://localhost:${port}/api/webhook/incoming"
  
  echo ""
  echo "📤 Trying webhook endpoint at $webhook_url"
  
  # Send the webhook and capture the status code
  local response=$(curl -s -w "\n%{http_code}" -X POST "$webhook_url" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")
  
  # Extract status code from the last line
  local status_code=$(echo "$response" | tail -n1)
  # Extract the actual response body (all but the last line)
  local body=$(echo "$response" | sed '$d')
  
  # Check if the request succeeded
  if [ "$status_code" -eq 200 ]; then
    echo "✅ Success! Received status code: $status_code"
    echo "📦 Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    echo "✅ Webhook sent successfully! Check the \"Recent Incoming Messages\" section in BotPass"
    echo "   at http://localhost:5173/bot/$BOT_ID/messages to see your message"
    return 0
  else
    if [ "$status_code" -eq 000 ]; then
      echo "❌ Failed to connect to port $port. Is the webhook server running?"
      return 1
    else
      echo "❌ Request failed with status code: $status_code"
      echo "📦 Response:"
      echo "$body" | jq '.' 2>/dev/null || echo "$body"
      return 1
    fi
  fi
}

# Print details
echo ""
echo "📦 Payload:"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""

# Try primary port first
if test_webhook $PRIMARY_PORT; then
  exit 0
else
  echo ""
  echo "🔄 Trying fallback port..."
  # Try fallback port
  if test_webhook $FALLBACK_PORT; then
    exit 0
  else
    echo ""
    echo "❌ Failed to connect to webhook server on both ports."
    echo "   Make sure the webhook server is running with:"
    echo "   npm run webhook-server:cjs"
    exit 1
  fi
fi 