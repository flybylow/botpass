import { handleIncomingWebhook } from './webhookHandler';

// Mock API route handler for local development
// In a real environment, this would be a server-side endpoint
export async function setupMockRoutes() {
  // Register a mock route handler for incoming webhooks
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    
    window.fetch = async function(input, init) {
      // Get the URL as a string regardless of whether input is a Request, URL, or string
      let urlString: string;
      if (typeof input === 'string') {
        urlString = input;
      } else if (input instanceof Request) {
        urlString = input.url;
      } else if (input instanceof URL) {
        urlString = input.toString();
      } else {
        // Fall back to original fetch if we can't determine the URL
        return originalFetch(input, init);
      }
      
      // Handle webhook endpoint
      if (urlString.endsWith('/api/webhook/incoming')) {
        try {
          // Log raw request for debugging
          console.log('Incoming webhook request:', {
            url: urlString,
            method: init?.method || 'GET',
            headers: init?.headers || {},
            bodySize: init?.body ? init.body.toString().length : 0
          });
          
          // Parse the payload
          let payload;
          try {
            payload = init?.body ? JSON.parse(init.body.toString()) : {};
            console.log('Received webhook call:', payload);
          } catch (parseError) {
            console.error('Failed to parse webhook payload:', parseError);
            return new Response(JSON.stringify({ 
              success: false, 
              message: 'Invalid JSON payload' 
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Process the webhook
          const result = await handleIncomingWebhook(payload);
          console.log('Webhook processing result:', result);
          
          // Return the response
          return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          });
        } catch (error) {
          console.error('Error in webhook mock route:', error);
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: 500,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          });
        }
      }
      
      // Handle CORS preflight for the webhook endpoint
      if (urlString.endsWith('/api/webhook/incoming') && init?.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }
      
      // Fall back to the original fetch for all other requests
      return originalFetch(input, init);
    };
    
    console.log('Mock API routes set up successfully');
    
    // Log some helpful information about the webhook endpoint
    console.log(`
    ========================================================
    WEBHOOK ENDPOINT AVAILABLE AT:
    http://localhost:5173/api/webhook/incoming
    
    Test with curl:
    curl -X POST http://localhost:5173/api/webhook/incoming \\
      -H "Content-Type: application/json" \\
      -d '{
        "botId": "9U8JhxaBe8Fv8OtLq4KN",
        "messageType": "message",
        "content": "Hello from external bot",
        "data": {"key": "value"}
      }'
    ========================================================
    `);
  }
}

// This function simulates making a POST request to the webhook endpoint
// It can be used for testing from the client side
export async function testWebhookEndpoint(payload: any) {
  try {
    const response = await fetch('/api/webhook/incoming', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error testing webhook endpoint:', error);
    throw error;
  }
} 