import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBot } from '@/contexts/BotContext';
import { useWebhook } from '@/contexts/WebhookContext';
import { useMessage } from '@/contexts/MessageContext';
import { WebhookSubscription, WebhookEventType } from '@/types/webhook';
import { BotMessage, MessageType } from '@/types/message';
import { testWebhookEndpoint } from '@/api/routes';
import BotSideMenu from '@/components/common/BotSideMenu';

export const WebhookManager: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getBot, updateBot } = useBot();
  const { 
    subscriptions, 
    createSubscription, 
    deleteSubscription,
    getDeliveryHistory,
    isLoading: webhookLoading,
    triggerWebhook
  } = useWebhook();
  const {
    botMessages,
    loadMessages,
    isLoading: messagesLoading
  } = useMessage();
  
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Test webhook form state
  const [testMessageType, setTestMessageType] = useState<MessageType>('message');
  const [testMessageContent, setTestMessageContent] = useState('');
  const [testData, setTestData] = useState('{}');

  const eventTypes = [
    'message.received',
    'message.sent',
    'bot.status',
    'bot.error',
    'bot.verification'
  ];

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const bot = await getBot(id);
      if (bot?.webhookUrl) {
        setUrl(bot.webhookUrl);
        setSelectedEvents(bot.webhookEvents || []);
      }
      
      // Load webhook delivery history if needed
      await getDeliveryHistory();
      
      // Load messages for this bot
      await loadMessages(id);
      
      setError(null);
    } catch (err) {
      console.error('Error loading webhook data:', err);
      setError('Failed to load webhook configuration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, getBot]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEventToggle = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const handleNewWebhookEventToggle = (event: string) => {
    setNewWebhookEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      await updateBot(id, {
        webhookUrl: url,
        webhookEvents: selectedEvents
      });
      setError('Webhook configuration saved successfully');
    } catch (err) {
      console.error('Error saving webhook:', err);
      setError('Failed to save webhook configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateIncomingWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWebhookEvents.length === 0 || !newWebhookUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      await createSubscription({
        url: newWebhookUrl,
        events: newWebhookEvents as any[], // Type assertion needed since the event types differ slightly
      });
      setNewWebhookUrl('');
      setNewWebhookEvents([]);
      setError('Incoming webhook created successfully');
    } catch (err) {
      console.error('Error creating incoming webhook:', err);
      setError('Failed to create incoming webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteSubscription(id);
      setError('Webhook deleted successfully');
    } catch (err) {
      console.error('Error deleting webhook:', err);
      setError('Failed to delete webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const testOutgoingWebhook = async () => {
    try {
      setIsLoading(true);
      await triggerWebhook('agent.update' as WebhookEventType, {
        agentId: id,
        message: 'Test message from BotPass',
        timestamp: new Date().toISOString(),
      });
      console.log('Webhook triggered successfully');
      setError('Outgoing webhook test executed successfully');
      await getDeliveryHistory();
    } catch (error) {
      console.error('Failed to trigger webhook:', error);
      setError('Failed to trigger outgoing webhook');
    } finally {
      setIsLoading(false);
    }
  };
  
  const testIncomingWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !testMessageContent) {
      setError('Bot ID and message content are required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare test data
      let parsedData = {};
      if (testData) {
        try {
          parsedData = JSON.parse(testData);
        } catch (err) {
          setError('Invalid JSON in test data field');
          setIsLoading(false);
          return;
        }
      }
      
      // Make the webhook call
      const result = await testWebhookEndpoint({
        botId: id,
        messageType: testMessageType,
        content: testMessageContent,
        timestamp: new Date().toISOString(),
        data: parsedData
      });
      
      if (result.success) {
        setError('Message sent successfully! ✨');
        // Refresh messages
        await loadMessages(id);
      } else {
        setError(`Failed to send message: ${result.message}`);
      }
    } catch (err) {
      console.error('Error testing incoming webhook:', err);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  if (!id) {
    return <div>Bot ID is required to manage webhooks</div>;
  }

  const botMessagesForCurrentBot = botMessages[id] || [];

  return (
    <div className="flex gap-8">
      <BotSideMenu botId={id} activeMenu="webhooks" />
      
      <div className="flex-1">
        <div className="p-6 max-w-4xl space-y-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Webhook Manager</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-md ${
              error.includes('success')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {error}
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Recent Incoming Messages</h3>
            <p className="text-gray-600 mb-4">
              This section displays messages received from bots via webhook calls. Messages are stored and displayed in real-time.
            </p>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              {messagesLoading ? (
                <div className="text-center py-4">
                  <svg className="animate-spin h-5 w-5 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Loading messages...</p>
                </div>
              ) : botMessagesForCurrentBot.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No messages received yet for this bot.</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {botMessagesForCurrentBot.map((message: BotMessage) => (
                    <div key={message.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          message.messageType === 'error' 
                            ? 'bg-red-100 text-red-800' 
                            : message.messageType === 'status'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {message.messageType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.receivedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{message.content}</p>
                      {message.data && Object.keys(message.data).length > 0 && (
                        <div className="mt-2 bg-gray-50 p-2 rounded text-xs font-mono overflow-x-auto">
                          {JSON.stringify(message.data, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Send a Message</h3>
            <p className="text-gray-600 mb-4">
              Use this form to send a test message to this bot.
              Messages sent here will appear in the "Recent Incoming Messages" section above.
            </p>
            <form onSubmit={testIncomingWebhook} className="space-y-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Type
                </label>
                <select
                  value={testMessageType}
                  onChange={e => setTestMessageType(e.target.value as MessageType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="message">Message</option>
                  <option value="status">Status</option>
                  <option value="error">Error</option>
                  <option value="event">Event</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Content
                </label>
                <input
                  type="text"
                  value={testMessageContent}
                  onChange={e => setTestMessageContent(e.target.value)}
                  placeholder="Enter your message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Data (JSON)
                </label>
                <textarea
                  value={testData}
                  onChange={e => setTestData(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder='{"key": "value"}'
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optional JSON data to include with the message
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !testMessageContent}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Outgoing Webhooks</h3>
            <p className="text-gray-600 mb-4">
              Configure where BotPass should send notifications when events occur. This lets your bot receive updates from BotPass.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://your-webhook-endpoint.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  The URL where your bot will receive webhook notifications
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events to Subscribe
                </label>
                <div className="space-y-2">
                  {eventTypes.map(event => (
                    <label key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !url || selectedEvents.length === 0}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Webhook Configuration'}
                </button>
                
                <button
                  type="button"
                  onClick={testOutgoingWebhook}
                  disabled={isLoading || !url}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Test Outgoing Webhook
                </button>
              </div>
            </form>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Incoming Webhooks</h3>
            <p className="text-gray-600 mb-4">
              Manage multiple webhook endpoints that can receive messages from external services. Use this to configure advanced integrations.
            </p>
            
            <div className="mb-6">
              <form onSubmit={handleCreateIncomingWebhook} className="space-y-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={newWebhookUrl}
                    onChange={e => setNewWebhookUrl(e.target.value)}
                    placeholder="https://your-webhook-endpoint.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    The URL where webhook requests will be sent
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Events to Subscribe
                  </label>
                  <div className="space-y-2">
                    {eventTypes.map(event => (
                      <label key={event} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newWebhookEvents.includes(event)}
                          onChange={() => handleNewWebhookEventToggle(event)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !newWebhookUrl || newWebhookEvents.length === 0}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Incoming Webhook'}
                </button>
              </form>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h4 className="font-medium mb-3">Active Incoming Webhooks</h4>
              
              {webhookLoading ? (
                <div className="text-center py-4">
                  <svg className="animate-spin h-5 w-5 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Loading webhooks...</p>
                </div>
              ) : subscriptions.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No incoming webhooks configured yet.</p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subscriptions.map((webhook: WebhookSubscription) => (
                        <tr key={webhook.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">
                            {webhook.url}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {webhook.events.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {webhook.events.map(event => (
                                  <span key={event} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {event}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No events</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              webhook.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {webhook.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleDeleteWebhook(webhook.id)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 