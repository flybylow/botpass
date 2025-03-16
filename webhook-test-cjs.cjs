// BotPass Webhook Test Script (CommonJS version)
// This script sends a test webhook to your local BotPass instance.
// Usage: node webhook-test-cjs.cjs [botId]

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
  content: `Test webhook from Node.js CJS script (${TIMESTAMP})`,
  timestamp: TIMESTAMP,
  data: {
    source: 'webhook-test-nodejs-cjs',
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

// Function to test a webhook endpoint using http module
async function testWebhook(port) {
  const http = require('http');
  const url = require('url');
  
  const webhookUrl = `http://localhost:${port}/api/webhook/incoming`;
  console.log(`\n📤 Trying webhook endpoint at ${webhookUrl}`);
  
  return new Promise((resolve) => {
    // Parse URL
    const parsedUrl = new URL(webhookUrl);
    
    // Setup request options
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(payload))
      }
    };
    
    // Send the request
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          
          if (res.statusCode === 200) {
            console.log(`✅ Success! Received status code: ${res.statusCode}`);
            console.log('📦 Response:');
            console.log(parsedData);
            console.log(`\n✅ Webhook sent successfully! Check the "Recent Incoming Messages" section in BotPass`);
            console.log(`   at http://localhost:5173/bot/${BOT_ID}/messages to see your message`);
            resolve(true);
          } else {
            console.log(`❌ Request failed with status code: ${res.statusCode}`);
            console.log('📦 Response:');
            console.log(parsedData);
            resolve(false);
          }
        } catch (e) {
          console.log(`❌ Failed to parse response from port ${port}:`);
          console.log(responseData);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Failed to connect to port ${port}. Is the webhook server running?`);
      console.log(`   Error: ${error.message}`);
      resolve(false);
    });
    
    // Write the data and end the request
    req.write(JSON.stringify(payload));
    req.end();
  });
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
      console.log('   npm run webhook-server:cjs');
      process.exit(1);
    }
  }
})(); 