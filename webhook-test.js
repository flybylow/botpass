#!/usr/bin/env node

/**
 * BotPass Webhook Test Script
 * 
 * This script sends a test webhook to your local BotPass instance.
 * Run it with: `node webhook-test.js [botId]`
 */

import fetch from 'node-fetch';

// Configuration
const PRIMARY_PORT = 3030;
const FALLBACK_PORT = 3031;
const BOT_ID = process.argv[2] || '9U8JhxaBe8Fv8OtLq4KN'; // Use CLI argument or default
const MESSAGE_TYPES = ['message', 'status', 'error', 'event'];
const MESSAGE_TYPE = MESSAGE_TYPES[Math.floor(Math.random() * MESSAGE_TYPES.length)];
const TIMESTAMP = new Date().toISOString();
const RANDOM_VALUE = Math.random().toString(36).substring(2, 12);

// Create payload
const payload = {
  botId: BOT_ID,
  messageType: MESSAGE_TYPE,
  content: `Test webhook from Node.js script (${TIMESTAMP})`,
  timestamp: TIMESTAMP,
  data: {
    source: 'webhook-test-nodejs',
    randomValue: RANDOM_VALUE
  }
};

// Request options
const requestOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload)
};

// Function to test a webhook endpoint
async function testWebhook(port) {
  const webhookUrl = `http://localhost:${port}/api/webhook/incoming`;
  
  console.log(`\n📤 Trying webhook endpoint at ${webhookUrl}`);
  
  try {
    const response = await fetch(webhookUrl, requestOptions);
    const responseData = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success! Received status code: ${response.status}`);
      console.log('📦 Response:');
      console.log(responseData);
      console.log(`\n✅ Webhook sent successfully! Check the "Recent Incoming Messages" section in BotPass`);
      console.log(`   at http://localhost:5173/bot/${BOT_ID}/messages to see your message`);
      return true;
    } else {
      console.log(`❌ Request failed with status code: ${response.status}`);
      console.log('📦 Response:');
      console.log(responseData);
      return false;
    }
  } catch (error) {
    console.log(`❌ Failed to connect to port ${port}. Is the webhook server running?`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Print details
console.log('\n📦 Payload:');
console.log(payload);

// Try primary port first, then fallback
(async () => {
  if (await testWebhook(PRIMARY_PORT)) {
    process.exit(0);
  } else {
    console.log('\n🔄 Trying fallback port...');
    if (await testWebhook(FALLBACK_PORT)) {
      process.exit(0);
    } else {
      console.log('\n❌ Failed to connect to webhook server on both ports.');
      console.log('   Make sure the webhook server is running with:');
      console.log('   npm run webhook-server');
      process.exit(1);
    }
  }
})(); 