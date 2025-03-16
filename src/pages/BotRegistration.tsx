import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBot } from '@/contexts/BotContext';
import BotSideMenu from '@/components/common/BotSideMenu';

interface BotFormData {
  name: string;
  description: string;
  platforms: string;
  webhookUrl?: string;
}

const BotRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registerBot, updateBot, getBot } = useBot();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BotFormData>();

  useEffect(() => {
    if (id) {
      const fetchBot = async () => {
        try {
          const bot = await getBot(id);
          if (bot) {
            setValue('name', bot.name);
            setValue('description', bot.description);
            setValue('platforms', bot.platforms.join(', '));
            setValue('webhookUrl', bot.webhookUrl || '');
          }
        } catch (err) {
          console.error('Error fetching bot:', err);
          setError('Failed to fetch bot details');
        }
      };
      fetchBot();
    }
  }, [id, getBot, setValue]);

  const onSubmit = async (data: BotFormData) => {
    try {
      setError('');
      setIsLoading(true);

      const botData = {
        name: data.name,
        description: data.description,
        platforms: data.platforms.split(',').map(p => p.trim()),
        webhookUrl: data.webhookUrl || null,
        webhookEvents: [],
        userId: user?.id || '',
      };

      if (id) {
        await updateBot(id, botData);
      } else {
        await registerBot(botData);
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving bot:', err);
      setError('Failed to save bot');
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Bot Name
          </label>
          <input
            {...register('name', {
              required: 'Bot name is required',
              minLength: {
                value: 2,
                message: 'Bot name must be at least 2 characters',
              },
            })}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('description', {
              required: 'Description is required',
              minLength: {
                value: 10,
                message: 'Description must be at least 10 characters',
              },
            })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="platforms" className="block text-sm font-medium text-gray-700">
            Platforms (comma-separated)
          </label>
          <input
            {...register('platforms', {
              required: 'At least one platform is required',
            })}
            type="text"
            placeholder="e.g., Binance, Coinbase, Kraken"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
          {errors.platforms && (
            <p className="mt-1 text-sm text-red-600">{errors.platforms.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">
            Webhook URL (Optional)
          </label>
          <input
            {...register('webhookUrl')}
            type="url"
            placeholder="https://your-webhook-endpoint.com"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
          {errors.webhookUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.webhookUrl.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Provide a URL where your bot can receive webhook notifications
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : id ? 'Update Bot' : 'Register Bot'}
          </button>
        </div>
      </form>
    );
  };

  // If we're in create mode, render as before
  if (!id) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <h2 className="text-2xl font-semibold text-gray-900">Register New Bot</h2>
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        {renderForm()}
      </div>
    );
  }

  // If we're in edit mode, add the side menu
  return (
    <div className="flex gap-8">
      <BotSideMenu botId={id} activeMenu="settings" />
      
      <div className="flex-1 space-y-8">
        <h2 className="text-2xl font-semibold text-gray-900">Edit Bot</h2>
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        {renderForm()}
      </div>
    </div>
  );
};

export default BotRegistration; 