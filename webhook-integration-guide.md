# BotPass Webhook Integration Guide

This guide will help you set up and test webhooks with your BotPass application.

## Table of Contents
- [Setting Up the Webhook Server](#setting-up-the-webhook-server)
- [Testing Webhooks](#testing-webhooks)
- [Troubleshooting](#troubleshooting)
- [Integrating with Your Bot](#integrating-with-your-bot)

## Setting Up the Webhook Server

BotPass includes a standalone webhook server that can receive webhook calls from your bots.

### Starting the Server

You have two options for running the webhook server:

#### Option 1: ES Modules Version (Recommended for Node.js 14+)
```bash
npm run webhook-server
```

#### Option 2: CommonJS Version (Compatible with older Node.js versions)
```bash
npm run webhook-server:cjs
```

The server will start on port 3030 by default. If that port is already in use, it will automatically fall back to port 3031.

You should see output like:
```
🚀 BotPass Webhook server started on port 3030
📌 Ready to receive webhooks at: http://localhost:3030/api/webhook/incoming
```

## Testing Webhooks

You can test your webhook server using one of the provided test scripts.

### Option A: Using the Node.js Test Script (ES Modules)

```bash
npm run webhook-test [botId]
```

### Option B: Using the Node.js Test Script (CommonJS)

```bash
npm run webhook-test:cjs [botId]
```

### Option C: Using the Bash/Curl Test Script

```bash
npm run webhook-test:curl [botId]
# OR
bash webhook-test.sh [botId]
```

All these scripts will:
1. Generate a test payload with random content
2. Send it to the webhook server
3. Display the server's response
4. Try the fallback port (3031) if the primary port (3030) is not responding

If your test is successful, you'll see a message like:
```
✅ Success! Received status code: 200
📦 Response:
{ success: true, message: 'Webhook received and processed' }

✅ Webhook sent successfully! Check the "Recent Incoming Messages" section in BotPass
   at http://localhost:5173/bot/9U8JhxaBe8Fv8OtLq4KN/messages to see your message
```

## Troubleshooting

### Common Issues

1. **Server not running**
   - Error: `Failed to connect to port 3030. Is the webhook server running?`
   - Solution: Start the webhook server with `npm run webhook-server` or `npm run webhook-server:cjs`

2. **Port conflicts**
   - Symptom: Server fails to start with `EADDRINUSE` error
   - Solution: The server will automatically try port 3031. If both ports are occupied, close the application using those ports or change the `WEBHOOK_PORT` environment variable.

3. **Illegal byte sequence errors**
   - Symptom: `tr: Illegal byte sequence` in the curl script
   - Solution: Use the Node.js test script instead, or set `LC_ALL=C` before running the curl script

4. **Module not found errors**
   - Symptom: `Error: Cannot find module 'node-fetch'`
   - Solution: Run `npm install node-fetch` or use the CommonJS version of the script

## Integrating with Your Bot

To send webhook calls from your bot to BotPass:

1. **Construct a webhook payload**:
```json
{
  "botId": "YOUR_BOT_ID",
  "messageType": "message",
  "content": "Hello from your bot!",
  "timestamp": "2023-06-30T12:34:56.789Z",
  "data": {
    "source": "your-bot-name",
    "additionalInfo": "any relevant data"
  }
}
```

2. **Send an HTTP POST request** to your webhook endpoint:
```
http://localhost:3030/api/webhook/incoming
```

3. **Include the required headers**:
```
Content-Type: application/json
```

4. **Handle the response**:
- Success: Status 200 with `{ "success": true, "message": "Webhook received and processed" }`
- Error: Status 400 or 500 with error details

### Example HTTP Request (cURL)

```bash
curl -X POST http://localhost:3030/api/webhook/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "YOUR_BOT_ID",
    "messageType": "message",
    "content": "Hello from your bot!",
    "timestamp": "2023-06-30T12:34:56.789Z",
    "data": {
      "source": "your-bot-name"
    }
  }'
```

### Example in Node.js

```javascript
const fetch = require('node-fetch');  // or use import for ESM

const payload = {
  botId: "YOUR_BOT_ID",
  messageType: "message",
  content: "Hello from your bot!",
  timestamp: new Date().toISOString(),
  data: {
    source: "your-bot-name"
  }
};

fetch('http://localhost:3030/api/webhook/incoming', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload)
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

---

For more information about webhooks and the BotPass API, see the `webhook-api-docs.md` file. 