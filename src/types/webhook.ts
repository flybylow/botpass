export type WebhookEventType = 
  | 'agent.update'
  | 'agent.call'
  | 'agent.response'
  | 'agent.error';

export interface WebhookPayload {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  data: {
    agentId: string;
    [key: string]: any;
  };
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEventType[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateWebhookSubscriptionDto {
  url: string;
  events: WebhookEventType[];
}

export interface WebhookDeliveryStatus {
  id: string;
  webhookId: string;
  payload: WebhookPayload;
  status: 'success' | 'failed';
  statusCode?: number;
  error?: string;
  timestamp: string;
  retries: number;
} 