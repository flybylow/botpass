import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import {
  WebhookSubscription,
  CreateWebhookSubscriptionDto,
  WebhookDeliveryStatus,
  WebhookEventType
} from '../types/webhook';
import { webhookService } from '../services/WebhookService';

interface WebhookContextType {
  subscriptions: WebhookSubscription[];
  deliveryHistory: WebhookDeliveryStatus[];
  createSubscription: (dto: CreateWebhookSubscriptionDto) => Promise<WebhookSubscription>;
  deleteSubscription: (id: string) => Promise<boolean>;
  getSubscription: (id: string) => Promise<WebhookSubscription | undefined>;
  triggerWebhook: (eventType: WebhookEventType, data: any) => Promise<void>;
  getDeliveryHistory: (webhookId?: string) => Promise<WebhookDeliveryStatus[]>;
  isLoading: boolean;
  error: string | null;
}

const WebhookContext = createContext<WebhookContextType | undefined>(undefined);

export const useWebhook = () => {
  const context = useContext(WebhookContext);
  if (!context) {
    throw new Error('useWebhook must be used within a WebhookProvider');
  }
  return context;
};

export const WebhookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<WebhookDeliveryStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const subs = await webhookService.listSubscriptions();
      setSubscriptions(subs);
      setError(null);
    } catch (err) {
      setError('Failed to load webhook subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const createSubscription = useCallback(async (dto: CreateWebhookSubscriptionDto) => {
    try {
      setIsLoading(true);
      const newSubscription = await webhookService.createSubscription(dto);
      setSubscriptions(prev => [...prev, newSubscription]);
      setError(null);
      return newSubscription;
    } catch (err) {
      setError('Failed to create webhook subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSubscription = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const success = await webhookService.deleteSubscription(id);
      if (success) {
        setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      }
      setError(null);
      return success;
    } catch (err) {
      setError('Failed to delete webhook subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSubscription = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const subscription = await webhookService.getSubscription(id);
      setError(null);
      return subscription;
    } catch (err) {
      setError('Failed to get webhook subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerWebhook = useCallback(async (eventType: WebhookEventType, data: any) => {
    try {
      setIsLoading(true);
      await webhookService.triggerWebhook(eventType, data);
      setError(null);
    } catch (err) {
      setError('Failed to trigger webhook');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDeliveryHistory = useCallback(async (webhookId?: string) => {
    try {
      setIsLoading(true);
      const history = await webhookService.getDeliveryHistory(webhookId);
      setDeliveryHistory(history);
      setError(null);
      return history;
    } catch (err) {
      setError('Failed to get webhook delivery history');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    subscriptions,
    deliveryHistory,
    createSubscription,
    deleteSubscription,
    getSubscription,
    triggerWebhook,
    getDeliveryHistory,
    isLoading,
    error
  };

  return (
    <WebhookContext.Provider value={value}>
      {children}
    </WebhookContext.Provider>
  );
}; 