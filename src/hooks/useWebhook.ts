import { useState, useCallback } from 'react';

interface WebhookData {
  [key: string]: any;
}

interface WebhookResponse {
  success: boolean;
  message?: string;
}

const useWebhook = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const triggerWebhook = useCallback(async (
    eventType: string,
    data: WebhookData
  ): Promise<WebhookResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Replace this URL with your actual webhook endpoint
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, message: result.message };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    triggerWebhook,
    isLoading,
    error,
  };
};

export default useWebhook; 