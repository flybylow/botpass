// BotPass Webhook Server (CommonJS version)
// This is a standalone server that receives webhook calls for the BotPass application
// Usage: node webhook-server-cjs.cjs

const express = require('express');
const cors = require('cors');
const http = require('http');

// Configuration
const PRIMARY_PORT = process.env.WEBHOOK_PORT || 3030;
const FALLBACK_PORT = 3031;
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Webhook endpoint
app.post('/api/webhook/incoming', async (req, res) => {
  try {
    console.log('\n📥 Received webhook call:', req.body);
    
    // Validate required fields
    const { botId, messageType, content } = req.body;
    
    if (!botId || !messageType || !content) {
      console.log('❌ Missing required fields in webhook payload');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: botId, messageType, and content are required'
      });
    }
    
    // Process the webhook (in a real app, this would save to database, etc.)
    console.log('✅ Processing webhook for botId:', botId);
    console.log(`📝 Message (${messageType}): ${content}`);
    
    // Try to forward to React app if it's running (optional)
    try {
      await forwardToReactApp(req.body);
    } catch (error) {
      // If forwarding fails, just log the error but don't fail the webhook
      console.log('⚠️ Note: Could not forward to React app:', error.message);
      console.log('   This is expected if only the webhook server is running');
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Webhook received and processed',
      receivedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing webhook',
      error: error.message
    });
  }
});

// Function to try to forward the webhook to the React app
// This is optional - only works if the React app is running
async function forwardToReactApp(payload) {
  // We'll use dynamic import for node-fetch to avoid CommonJS/ESM issues
  try {
    // Use dynamic import to load node-fetch
    const importDynamic = new Function('modulePath', 'return import(modulePath)');
    const { default: fetch } = await importDynamic('node-fetch');
    
    // Forward to React app
    const reactAppUrl = 'http://localhost:5173/api/webhook/incoming';
    const response = await fetch(reactAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log('✅ Successfully forwarded to React app');
    } else {
      console.log(`❌ Failed to forward to React app: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(`Failed to forward to React app: ${error.message}`);
  }
}

// Default route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>BotPass Webhook Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>🤖 BotPass Webhook Server</h1>
        <p>This server is running and ready to receive webhook calls.</p>
        
        <h2>Endpoint:</h2>
        <code>POST /api/webhook/incoming</code>
        
        <h2>Test with curl:</h2>
        <pre>curl -X POST http://localhost:${server.address().port}/api/webhook/incoming \\
  -H "Content-Type: application/json" \\
  -d '{
    "botId": "YOUR_BOT_ID",
    "messageType": "message",
    "content": "Hello from curl!",
    "timestamp": "${new Date().toISOString()}",
    "data": {
      "source": "webhook-test"
    }
  }'</pre>
        
        <p>See the server console for logs of received webhooks.</p>
        <p><a href="webhook-api-docs.md">View webhook documentation</a></p>
      </body>
    </html>
  `);
});

// Create HTTP server
const server = http.createServer(app);

// Start server with port fallback
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && server.address()?.port === PRIMARY_PORT) {
    console.log(`⚠️ Port ${PRIMARY_PORT} is already in use. Trying fallback port ${FALLBACK_PORT}...`);
    server.close();
    server.listen(FALLBACK_PORT);
  } else {
    console.error('❌ Server error:', error);
  }
});

server.listen(PRIMARY_PORT, () => {
  const port = server.address().port;
  console.log(`\n🚀 BotPass Webhook server started on port ${port}`);
  console.log(`📌 Ready to receive webhooks at: http://localhost:${port}/api/webhook/incoming`);
  console.log('\n📋 Test with curl:');
  console.log(`curl -X POST http://localhost:${port}/api/webhook/incoming \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{`);
  console.log(`    "botId": "9U8JhxaBe8Fv8OtLq4KN",`);
  console.log(`    "messageType": "message",`);
  console.log(`    "content": "Test webhook",`);
  console.log(`    "data": {"source": "curl-test"}`);
  console.log(`  }'`);
  console.log('\n📋 Or use the test scripts:');
  console.log('npm run webhook-test:cjs');
  console.log('npm run webhook-test:curl');
}); 