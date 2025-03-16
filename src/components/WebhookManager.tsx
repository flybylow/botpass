import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBot } from '@/contexts/BotContext';

export const WebhookManager: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getBot, updateBot } = useBot();
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventTypes = [
    'message.received',
    'message.sent',
    'bot.status',
    'bot.error',
    'bot.verification'
  ];

  useEffect(() => {
    const loadBotWebhook = async () => {
      if (!id) return;
      try {
        const bot = await getBot(id);
        if (bot?.webhookUrl) {
          setUrl(bot.webhookUrl);
          setSelectedEvents(bot.webhookEvents || []);
        }
      } catch (err) {
        console.error('Error loading bot webhook:', err);
        setError('Failed to load webhook configuration');
      }
    };
    loadBotWebhook();
  }, [id, getBot]);

  const handleEventToggle = (event: string) => {
    setSelectedEvents(prev =>
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

  if (!id) {
    return <div>Bot ID is required to manage webhooks</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Webhook Manager</h2>

      {error && (
        <div className={`mb-4 p-3 rounded-md ${
          error.includes('success')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <button
          type="submit"
          disabled={isLoading || !url || selectedEvents.length === 0}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Webhook Configuration'}
        </button>
      </form>
    </div>
  );
}; 