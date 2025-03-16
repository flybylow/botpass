import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBot } from '@/contexts/BotContext';
import { useMessage } from '@/contexts/MessageContext';
import { BotMessage } from '@/types/message';
import { MessageForm } from '@/components/MessageForm';
import { MessageHistory } from '@/components/MessageHistory';

const Messages = () => {
  const { id } = useParams<{ id: string }>();
  const { getBot } = useBot();
  const {
    botMessages,
    loadMessages,
    isLoading: messagesLoading
  } = useMessage();
  const [botName, setBotName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [messageRefreshTrigger, setMessageRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadBot = async () => {
      if (!id) return;
      try {
        const bot = await getBot(id);
        if (bot) {
          setBotName(bot.name);
        } else {
          setError('Bot not found');
        }
        
        // Load messages for this bot
        await loadMessages(id);
      } catch (err) {
        console.error('Error loading bot:', err);
        setError('Failed to load bot details');
      }
    };

    loadBot();
  }, [id, getBot, loadMessages]);

  // Refresh messages if the refresh trigger changes
  useEffect(() => {
    if (id && messageRefreshTrigger > 0) {
      loadMessages(id).catch(console.error);
    }
  }, [id, messageRefreshTrigger, loadMessages]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
        <div className="mt-4">
          <Link
            to="/dashboard"
            className="text-primary-600 hover:text-primary-900"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
          No bot ID provided
        </div>
        <div className="mt-4">
          <Link
            to="/dashboard"
            className="text-primary-600 hover:text-primary-900"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const botMessagesForCurrentBot = botMessages[id] || [];

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Messages {botName && `- ${botName}`}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Send messages and view message history
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            to={`/bot/${id}/webhooks`}
            className="text-primary-600 hover:text-primary-900 text-sm"
          >
            Webhook Manager
          </Link>
          <Link
            to="/dashboard"
            className="text-primary-600 hover:text-primary-900 text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Send Message</h2>
          <MessageForm 
            botId={id} 
            onMessageSent={() => setMessageRefreshTrigger(prev => prev + 1)} 
          />
        </div>
        
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Incoming Messages</h2>
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
        
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Messages</h2>
          <MessageHistory 
            botId={id} 
            refreshTrigger={messageRefreshTrigger} 
          />
        </div>
      </div>
    </div>
  );
};

export default Messages; 