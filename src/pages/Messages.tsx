import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBot } from '@/contexts/BotContext';
import { MessageForm } from '@/components/MessageForm';
import { MessageHistory } from '@/components/MessageHistory';

const Messages = () => {
  const { id } = useParams<{ id: string }>();
  const { getBot } = useBot();
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
      } catch (err) {
        console.error('Error loading bot:', err);
        setError('Failed to load bot details');
      }
    };

    loadBot();
  }, [id, getBot]);

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
        <Link
          to="/dashboard"
          className="text-primary-600 hover:text-primary-900 text-sm"
        >
          ← Back to Dashboard
        </Link>
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