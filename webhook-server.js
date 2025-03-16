// BotPass Webhook Server (ES Modules version)
// This is a standalone server that receives webhook calls for the BotPass application
// Usage: node webhook-server.js

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration
const PRIMARY_PORT = process.env.WEBHOOK_PORT || 3030;
const FALLBACK_PORT = 3031;
const app = express();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug Firebase config
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey?.substring(0, 5) + '...',
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// For backward compatibility and fallback
const FALLBACK_VALID_BOT_IDS = [
  '9U8JhxaBe8Fv8OtLq4KN',  // Example from the test curl command
  'test-bot-from-n8n',     // From our scheduled n8n test workflow
  'test-bot-from-curl',    // From our manual curl test
  'test-bot-2',            // Additional test bots from our manual n8n workflow
  'test-bot-3'
];

// Storage for recent messages (in-memory)
const RECENT_MESSAGES = [];
const MAX_RECENT_MESSAGES = 100; // Limit number of stored messages

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// API endpoint to get recent messages
app.get('/api/messages', (req, res) => {
  console.log(`[${new Date().toISOString()}] 📋 GET /api/messages - Returning ${RECENT_MESSAGES.length} messages`);
  
  res.json({
    success: true,
    messages: RECENT_MESSAGES,
    count: RECENT_MESSAGES.length
  });
});

// Function to validate botId against the database
async function isValidBotId(botId) {
  try {
    // First check if it's in our fallback list (for testing)
    if (FALLBACK_VALID_BOT_IDS.includes(botId)) {
      return true;
    }
    
    // Then check the actual database
    const botsRef = collection(db, 'bots');
    // Check for both document ID and botId field to be safe
    const docIdQuery = query(botsRef, where('__name__', '==', botId));
    const docIdSnapshot = await getDocs(docIdQuery);
    
    if (!docIdSnapshot.empty) {
      return true;
    }
    
    // If we didn't find a direct ID match, see if any bot has this as a custom ID
    const customIdQuery = query(botsRef, where('botId', '==', botId));
    const customIdSnapshot = await getDocs(customIdQuery);
    
    return !customIdSnapshot.empty;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error validating botId:`, error);
    // Fallback to the hardcoded list in case of Firebase errors
    return FALLBACK_VALID_BOT_IDS.includes(botId);
  }
}

// Webhook endpoint
app.post('/api/webhook/incoming', async (req, res) => {
  const requestId = uuidv4();
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${requestId}] 🔔 Received webhook payload:`, req.body);

  // Check required fields
  const { botId, messageType, content } = req.body;
  
  if (!botId || !messageType || !content) {
    const errorMessage = `Missing required fields: ${!botId ? 'botId' : ''} ${!messageType ? 'messageType' : ''} ${!content ? 'content' : ''}`;
    console.log(`[${timestamp}] [${requestId}] ❌ ${errorMessage}`);
    return res.status(400).json({
      success: false,
      error: errorMessage
    });
  }

  // Enhanced logging for specific botId
  if (botId === '9U8JhxaBe8Fv8OtLq4KN') {
    console.log(`[${timestamp}] [${requestId}] 🔎 TRACKING SPECIAL BOT ID: 9U8JhxaBe8Fv8OtLq4KN`);
  }

  // Validate botId against the database
  const isValid = await isValidBotId(botId);
  if (!isValid) {
    console.log(`[${timestamp}] [${requestId}] ❌ Invalid botId: ${botId}`);
    return res.status(400).json({
      success: false,
      error: `Invalid botId: ${botId}`
    });
  }

  // Process webhook
  console.log(`[${timestamp}] [${requestId}] ✅ Valid webhook from bot ${botId}`);
  
  // Create a messageId 
  const messageId = uuidv4();
  
  // Store message in recent messages
  const message = {
    id: messageId,
    botId,
    messageType,
    content,
    timestamp: req.body.timestamp || timestamp,
    data: req.body.data || {},
    receivedAt: timestamp,
    requestId
  };
  
  // Add to recent messages and trim if needed
  RECENT_MESSAGES.unshift(message);
  if (RECENT_MESSAGES.length > MAX_RECENT_MESSAGES) {
    RECENT_MESSAGES.length = MAX_RECENT_MESSAGES;
  }
  
  // Enhanced logging for 9U8JhxaBe8Fv8OtLq4KN
  if (botId === '9U8JhxaBe8Fv8OtLq4KN') {
    console.log(`[${timestamp}] [${requestId}] 💾 Stored message in memory for 9U8JhxaBe8Fv8OtLq4KN with messageId ${messageId}`);
  }
  
  // Try to forward message to React app
  try {
    const io = req.app.get('io');
    console.log(`[${timestamp}] [${requestId}] 📤 Forwarding message to React app...`);
    
    if (io) {
      // Emit to everyone
      io.emit('webhook_message', message);
      console.log(`[${timestamp}] [${requestId}] ✅ Message forwarded to React app via Socket.IO (global)`);
      
      // Emit to room specific to this bot
      io.to(`bot:${botId}`).emit('webhook_message', message);
      console.log(`[${timestamp}] [${requestId}] ✅ Message forwarded to bot-specific room: bot:${botId}`);
      
      // Enhanced logging for 9U8JhxaBe8Fv8OtLq4KN
      if (botId === '9U8JhxaBe8Fv8OtLq4KN') {
        console.log(`[${timestamp}] [${requestId}] 🔔 Socket.IO events emitted for 9U8JhxaBe8Fv8OtLq4KN`);
        
        // Also emit a test event that the client might be listening for
        io.emit('message_received', {
          botId,
          messageId,
          timestamp: new Date().toISOString(),
          note: 'This is a test event for diagnostics'
        });
      }
    } else {
      console.log(`[${timestamp}] [${requestId}] ⚠️ Socket.IO not initialized, message not forwarded`);
    }
  } catch (err) {
    console.error(`[${timestamp}] [${requestId}] ❌ Error forwarding message:`, err);
  }
  
  // Try to store in Firestore for persistent storage
  try {
    // If this is for our tracked botId, add extra debug info
    if (botId === '9U8JhxaBe8Fv8OtLq4KN') {
      console.log(`[${timestamp}] [${requestId}] 🔄 Attempting to save to Firestore directly...`);
    }
    
    const messagesRef = collection(db, 'messages');
    const firestoreMessage = {
      botId,
      messageType,
      content,
      timestamp: req.body.timestamp || timestamp,
      receivedAt: new Date(),
      data: req.body.data || {},
      processed: true
    };
    
    // Add to Firestore
    await addDoc(messagesRef, firestoreMessage);
    
    if (botId === '9U8JhxaBe8Fv8OtLq4KN') {
      console.log(`[${timestamp}] [${requestId}] ✅ Successfully saved message to Firestore for 9U8JhxaBe8Fv8OtLq4KN`);
    }
  } catch (firestoreErr) {
    console.error(`[${timestamp}] [${requestId}] ❌ Error saving to Firestore:`, firestoreErr);
  }
  
  // Return success response
  res.json({
    success: true,
    messageId,
    message: 'Webhook received and processed'
  });
});

// Function to try to forward the webhook to the React app
// This is optional - only works if the React app is running
async function forwardToReactApp(payload) {
  // Try multiple common development ports
  const possibleReactAppUrls = [
    'http://localhost:5173/api/webhook/incoming', // Vite default
    'http://localhost:3000/api/webhook/incoming', // CRA default
    'http://localhost:3000/webhook/incoming',     // Alternative path
    'http://localhost:8000/api/webhook/incoming', // Another common port
    'http://localhost:5000/api/webhook/incoming'  // Another common port
  ];
  
  console.log('🔄 Attempting to forward webhook to React app...');
  
  let succeeded = false;
  const errors = [];
  
  // Try each possible URL
  for (const reactAppUrl of possibleReactAppUrls) {
    try {
      console.log(`🔄 Trying to forward to ${reactAppUrl}...`);
      
      const response = await fetch(reactAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        // Set a shorter timeout to avoid hanging
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        console.log(`✅ Successfully forwarded to React app at ${reactAppUrl}`);
        
        // Get the response body if possible
        try {
          const responseBody = await response.json();
          console.log('📦 React app response:', responseBody);
        } catch (parseError) {
          console.log('⚠️ Could not parse response body');
        }
        
        succeeded = true;
        break; // Stop trying other URLs
      } else {
        const errorText = `Failed with status ${response.status}: ${response.statusText}`;
        console.log(`❌ ${errorText}`);
        errors.push(`${reactAppUrl} - ${errorText}`);
      }
    } catch (error) {
      console.log(`⚠️ Error trying ${reactAppUrl}: ${error.message}`);
      errors.push(`${reactAppUrl} - ${error.message}`);
    }
  }
  
  if (!succeeded) {
    console.log('❌ Could not forward to any React app URLs');
    console.log('🧪 Attempted URLs and errors:');
    errors.forEach(error => console.log(`  - ${error}`));
    
    throw new Error(`Failed to forward to React app. Tried ${possibleReactAppUrls.length} URLs.`);
  }
}

// Default route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>BotPass Webhook Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
          code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
          .message { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
          .message:hover { background-color: #f9f9f9; }
          .timestamp { color: #666; font-size: 0.8em; }
          .content { margin: 10px 0; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; color: white; }
          .badge.message { background-color: #4caf50; }
          .badge.notification { background-color: #2196f3; }
          .badge.event { background-color: #ff9800; }
          .tabs { display: flex; margin-bottom: 10px; }
          .tab { padding: 10px 15px; cursor: pointer; border: 1px solid #ddd; background: #f4f4f4; }
          .tab.active { background: #fff; border-bottom: 1px solid #fff; }
          .tab-content { display: none; padding: 15px; border: 1px solid #ddd; margin-top: -1px; }
          .tab-content.active { display: block; }
          .auto-refresh { margin: 10px 0; }
          #status { margin: 10px 0; padding: 10px; border-radius: 3px; }
          .success { background-color: #dff0d8; color: #3c763d; }
          .error { background-color: #f2dede; color: #a94442; }
        </style>
      </head>
      <body>
        <h1>🤖 BotPass Webhook Server</h1>
        <p>This server is running and ready to receive webhook calls.</p>
        
        <div class="tabs">
          <div class="tab active" onclick="openTab(event, 'tab-messages')">Recent Messages</div>
          <div class="tab" onclick="openTab(event, 'tab-docs')">Documentation</div>
          <div class="tab" onclick="openTab(event, 'tab-test')">Test Tools</div>
        </div>
        
        <div id="tab-messages" class="tab-content active">
          <h2>Recent Incoming Messages</h2>
          <p>This section displays messages received from bots via webhook calls. Messages are stored and displayed in real-time.</p>
          
          <div class="auto-refresh">
            <label>
              <input type="checkbox" id="auto-refresh" checked> 
              Auto-refresh every 5 seconds
            </label>
            <button onclick="loadMessages()">Refresh Now</button>
          </div>
          
          <div id="status"></div>
          <div id="messages-container"></div>
        </div>
        
        <div id="tab-docs" class="tab-content">
          <h2>Webhook Endpoint:</h2>
          <code>POST /api/webhook/incoming</code>
          
          <h2>Valid Bot IDs for Testing:</h2>
          <pre>${JSON.stringify(FALLBACK_VALID_BOT_IDS, null, 2)}</pre>
          
          <p>See the server console for logs of received webhooks.</p>
          <p><a href="webhook-api-docs.md">View webhook documentation</a></p>
        </div>
        
        <div id="tab-test" class="tab-content">
          <h2>Test with curl:</h2>
          <pre>curl -X POST http://localhost:${server.address().port}/api/webhook/incoming \\
  -H "Content-Type: application/json" \\
  -d '{
    "botId": "9U8JhxaBe8Fv8OtLq4KN",
    "messageType": "message",
    "content": "Hello from curl!",
    "timestamp": "${new Date().toISOString()}",
    "data": {
      "source": "webhook-test"
    }
  }'</pre>
          
          <h2>Test Form</h2>
          <form id="webhook-form">
            <div>
              <label for="botId">Bot ID:</label>
              <select id="botId">
                ${FALLBACK_VALID_BOT_IDS.map(id => `<option value="${id}">${id}</option>`).join('')}
              </select>
            </div>
            <div>
              <label for="messageType">Message Type:</label>
              <select id="messageType">
                <option value="message">message</option>
                <option value="notification">notification</option>
                <option value="event">event</option>
              </select>
            </div>
            <div>
              <label for="content">Content:</label>
              <textarea id="content" rows="3" style="width: 100%">Hello from the test form!</textarea>
            </div>
            <div>
              <button type="button" onclick="sendTestWebhook()">Send Test Webhook</button>
            </div>
          </form>
          <div id="test-result"></div>
        </div>
        
        <script>
          // Tab functionality
          function openTab(evt, tabName) {
            const tabs = document.getElementsByClassName("tab");
            for (let i = 0; i < tabs.length; i++) {
              tabs[i].className = tabs[i].className.replace(" active", "");
            }
            
            const tabContents = document.getElementsByClassName("tab-content");
            for (let i = 0; i < tabContents.length; i++) {
              tabContents[i].className = tabContents[i].className.replace(" active", "");
            }
            
            document.getElementById(tabName).className += " active";
            evt.currentTarget.className += " active";
          }
          
          // Load messages
          function loadMessages() {
            const statusEl = document.getElementById('status');
            const messagesContainer = document.getElementById('messages-container');
            
            fetch('/api/messages')
              .then(response => response.json())
              .then(data => {
                statusEl.className = 'success';
                statusEl.textContent = \`Loaded \${data.count} messages (\${new Date().toLocaleString()})\`;
                
                if (data.count === 0) {
                  messagesContainer.innerHTML = '<p>No messages received yet. Try sending a test webhook!</p>';
                  return;
                }
                
                let html = '';
                data.messages.forEach(msg => {
                  const date = new Date(msg.timestamp).toLocaleString();
                  html += \`
                    <div class="message">
                      <div>
                        <span class="badge \${msg.messageType}">\${msg.messageType}</span>
                        <span class="timestamp">\${date}</span>
                        <strong>From: \${msg.botId}</strong>
                      </div>
                      <div class="content">\${msg.content}</div>
                      <details>
                        <summary>Details</summary>
                        <pre>\${JSON.stringify(msg, null, 2)}</pre>
                      </details>
                    </div>
                  \`;
                });
                
                messagesContainer.innerHTML = html;
              })
              .catch(error => {
                statusEl.className = 'error';
                statusEl.textContent = \`Error loading messages: \${error.message}\`;
              });
          }
          
          // Auto-refresh functionality
          let refreshInterval;
          
          function setupAutoRefresh() {
            const checkbox = document.getElementById('auto-refresh');
            
            if (checkbox.checked) {
              refreshInterval = setInterval(loadMessages, 5000);
            } else {
              clearInterval(refreshInterval);
            }
          }
          
          document.getElementById('auto-refresh').addEventListener('change', setupAutoRefresh);
          
          // Send test webhook
          function sendTestWebhook() {
            const botId = document.getElementById('botId').value;
            const messageType = document.getElementById('messageType').value;
            const content = document.getElementById('content').value;
            const resultEl = document.getElementById('test-result');
            
            const payload = {
              botId,
              messageType,
              content,
              timestamp: new Date().toISOString(),
              data: {
                source: "webhook-test-form"
              }
            };
            
            resultEl.innerHTML = 'Sending...';
            
            fetch('/api/webhook/incoming', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
              resultEl.innerHTML = \`<div class="success">
                Success! Message ID: \${data.messageId}<br>
                <pre>\${JSON.stringify(data, null, 2)}</pre>
              </div>\`;
              
              // Reload messages
              loadMessages();
            })
            .catch(error => {
              resultEl.innerHTML = \`<div class="error">
                Error: \${error.message}
              </div>\`;
            });
          }
          
          // Initialize
          loadMessages();
          setupAutoRefresh();
        </script>
      </body>
    </html>
  `);
});

// Create HTTP server instance
const server = http.createServer(app);

// Create Socket.IO instance for real-time communication
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store the io instance on the app for use in routes
app.set('io', io);

// Socket.IO connection handler
io.on('connection', (socket) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔌 Socket.IO: Client connected: ${socket.id}`);
  
  // Log connection details
  console.log(`[${timestamp}] 🔌 Connection details:`, {
    id: socket.id,
    address: socket.handshake.address,
    url: socket.handshake.url,
    headers: socket.handshake.headers,
    query: socket.handshake.query
  });
  
  // Setup message event listener for bidirectional communication
  socket.on('message', (data) => {
    console.log(`[${timestamp}] 📩 Received message from client ${socket.id}:`, data);
    // Echo back the message
    socket.emit('message_echo', {
      ...data,
      receivedAt: new Date().toISOString(),
      echo: true
    });
  });
  
  // Setup specific listeners for the React app
  socket.on('subscribe_to_bot', (botId) => {
    console.log(`[${timestamp}] 📌 Client ${socket.id} subscribed to bot: ${botId}`);
    socket.join(`bot:${botId}`);
    
    // Send welcome message to just this client
    socket.emit('bot_subscription', {
      status: 'subscribed',
      botId,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] 🔌 Socket.IO: Client disconnected: ${socket.id}`);
  });
});

// Start the server with error handling for address in use
let isStarting = false;
let hasFallbackBeenTried = false;

function startServer(port, isFallback = false) {
  if (isStarting) return; // Prevent multiple simultaneous start attempts
  isStarting = true;
  
  if (isFallback) {
    hasFallbackBeenTried = true;
  }
  
  try {
    server.listen(port, () => {
      isStarting = false; // Reset flag
      console.log(`\n🚀 Webhook server running on port ${port} ${isFallback ? '(fallback)' : ''}`);
      console.log(`📡 Socket.IO server running on same port`);
      console.log(`\n✅ Webhook URL: http://localhost:${port}/api/webhook/incoming`);
      console.log(`📋 API: http://localhost:${port}/api/messages`);
      console.log(`🌐 UI: http://localhost:${port}/`);
      console.log(`\n🧪 Test webhook with:`);
      console.log(`curl -X POST http://localhost:${port}/api/webhook/incoming \\`);
      console.log('  -H "Content-Type: application/json" \\');
      console.log('  -d \'{"botId":"test-bot-from-curl","messageType":"message","content":"Hello from curl"}\'');
      console.log('\nOr run the test scripts:');
      console.log('npm run webhook-test');
      console.log('npm run webhook-test:curl');
      console.log('\n📋 Valid Bot IDs:');
      console.log(FALLBACK_VALID_BOT_IDS.join(', '));
    });
  } catch (err) {
    isStarting = false;
    console.error(`\n❌ Error starting server on port ${port}:`, err);
  }
}

// Configure server error handling
server.on('error', (error) => {
  isStarting = false;
  
  if (error.code === 'EADDRINUSE') {
    if (!hasFallbackBeenTried) {
      console.log(`\n⚠️ Port ${PRIMARY_PORT} is already in use, trying fallback port ${FALLBACK_PORT}...`);
      startServer(FALLBACK_PORT, true);
    } else {
      console.error(`\n❌ Both primary port ${PRIMARY_PORT} and fallback port ${FALLBACK_PORT} are in use.`);
      console.log(`\n⚠️ Please specify a different port with the WEBHOOK_PORT environment variable.`);
      console.log(`Example: WEBHOOK_PORT=3032 node webhook-server.js`);
      process.exit(1);
    }
  } else {
    console.error(`\n❌ Server error:`, error);
    process.exit(1);
  }
});

// Start on primary port first
startServer(PRIMARY_PORT); 