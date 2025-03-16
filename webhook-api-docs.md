# Webhook API Documentation

This document describes how to interact with the BotPass webhook system. BotPass supports both outgoing webhooks (from BotPass to your services) and incoming webhooks (from your bots to BotPass).

## Incoming Webhooks (Bot to BotPass)

Incoming webhooks allow your bots to send data and updates to BotPass, which will be displayed in the Webhook Manager and stored in the message database.

### Endpoint

```
POST https://your-botpass-domain.com/api/webhook/incoming
```

### Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "botId": "required-bot-id",
  "messageType": "message|status|error|event",
  "content": "Required message content",
  "timestamp": "2023-08-10T12:34:56Z", // Optional, ISO format
  "data": {
    // Optional additional data
    "key1": "value1",
    "key2": "value2"
  }
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| botId | string | Yes | The ID of your bot in BotPass |
| messageType | string | Yes | Type of message: "message", "status", "error", or "event" |
| content | string | Yes | The main message content |
| timestamp | string | No | ISO-formatted timestamp. If not provided, current time will be used |
| data | object | No | Additional structured data related to the message |

### Example Request

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "9U8JhxaBe8Fv8OtLq4KN",
    "messageType": "status",
    "content": "Bot starting up",
    "data": {
      "version": "1.0.5",
      "environment": "production"
    }
  }' \
  https://your-botpass-domain.com/api/webhook/incoming
```

### Response

```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### Error Responses

- **400 Bad Request** - Missing required fields or invalid data
  ```json
  {
    "success": false,
    "message": "Missing botId in webhook payload"
  }
  ```

- **500 Internal Error** - Server-side error
  ```json
  {
    "success": false,
    "message": "Failed to process webhook: Internal server error"
  }
  ```

## Outgoing Webhooks (BotPass to Your Service)

BotPass can send webhook notifications to your services about various events.

### Configure Outgoing Webhooks

1. Navigate to the Webhook Manager in BotPass
2. Enter your service's URL in the "Webhook URL" field
3. Select the events you want to subscribe to
4. Click "Save Webhook Configuration"

### Event Types

- `message.received` - Triggered when a message is received
- `message.sent` - Triggered when a message is sent
- `bot.status` - Triggered when a bot's status changes
- `bot.error` - Triggered when a bot encounters an error
- `bot.verification` - Triggered when a bot's verification status changes

### Webhook Payload Format

```json
{
  "id": "webhook-delivery-id",
  "type": "message.received",
  "timestamp": "2023-08-10T12:34:56Z",
  "data": {
    "agentId": "bot-id",
    // Event-specific data will be included here
  }
}
```

### Webhook Security

- Webhooks are delivered via HTTPS
- Each webhook includes a signature header for verification
- We include a unique ID for each webhook delivery for idempotency

### Testing Webhooks

You can test outgoing webhooks directly from the Webhook Manager interface:

1. Configure your webhook URL
2. Click the "Test Outgoing Webhook" button
3. Check your service's logs for the incoming webhook

## Best Practices

1. **Respond quickly** - Return a 200 response as soon as possible
2. **Process asynchronously** - Handle the webhook data after responding
3. **Implement retry logic** - Assume webhooks may be delivered more than once
4. **Verify webhooks** - Check the signature header to ensure authenticity
5. **Use HTTPS** - Always use secure endpoints for receiving webhooks

## Troubleshooting

If you're not receiving webhooks:

1. Check your webhook URL is correct and accessible from the internet
2. Verify any firewall rules that might block incoming requests
3. Look at the Webhook Manager for delivery status and errors
4. Use the test functionality to trigger test webhooks
5. Check your server logs for incoming requests

For further assistance, contact support at support@botpass.example.com. 