import { v4 as uuidv4 } from 'uuid';
import {
  WebhookEventType,
  WebhookPayload,
  WebhookSubscription,
  CreateWebhookSubscriptionDto,
  WebhookDeliveryStatus
} from '../types/webhook';

class WebhookService {
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private deliveryHistory: WebhookDeliveryStatus[] = [];
  private readonly MAX_RETRIES = 3;

  async createSubscription(dto: CreateWebhookSubscriptionDto): Promise<WebhookSubscription> {
    const subscription: WebhookSubscription = {
      id: uuidv4(),
      url: dto.url,
      events: dto.events,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  async deleteSubscription(id: string): Promise<boolean> {
    return this.subscriptions.delete(id);
  }

  async getSubscription(id: string): Promise<WebhookSubscription | undefined> {
    return this.subscriptions.get(id);
  }

  async listSubscriptions(): Promise<WebhookSubscription[]> {
    return Array.from(this.subscriptions.values());
  }

  async triggerWebhook(eventType: WebhookEventType, data: any): Promise<void> {
    const payload: WebhookPayload = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    };

    const relevantSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive && sub.events.includes(eventType));

    await Promise.all(
      relevantSubscriptions.map(subscription =>
        this.deliverWebhook(subscription, payload)
      )
    );
  }

  private async deliverWebhook(
    subscription: WebhookSubscription,
    payload: WebhookPayload,
    retryCount = 0
  ): Promise<void> {
    try {
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': payload.id,
          'X-Webhook-Signature': this.generateSignature(payload)
        },
        body: JSON.stringify(payload)
      });

      const deliveryStatus: WebhookDeliveryStatus = {
        id: uuidv4(),
        webhookId: subscription.id,
        payload,
        status: response.ok ? 'success' : 'failed',
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        retries: retryCount
      };

      if (!response.ok && retryCount < this.MAX_RETRIES) {
        await this.retryDelivery(subscription, payload, retryCount);
      }

      this.deliveryHistory.push(deliveryStatus);
    } catch (error: any) {
      const deliveryStatus: WebhookDeliveryStatus = {
        id: uuidv4(),
        webhookId: subscription.id,
        payload,
        status: 'failed',
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        retries: retryCount
      };

      if (retryCount < this.MAX_RETRIES) {
        await this.retryDelivery(subscription, payload, retryCount);
      }

      this.deliveryHistory.push(deliveryStatus);
    }
  }

  private async retryDelivery(
    subscription: WebhookSubscription,
    payload: WebhookPayload,
    retryCount: number
  ): Promise<void> {
    const backoffDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    await this.deliverWebhook(subscription, payload, retryCount + 1);
  }

  private generateSignature(payload: WebhookPayload): string {
    // In a real implementation, you would use a secret key to sign the payload
    // This is a placeholder implementation
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  async getDeliveryHistory(webhookId?: string): Promise<WebhookDeliveryStatus[]> {
    if (webhookId) {
      return this.deliveryHistory.filter(status => status.webhookId === webhookId);
    }
    return this.deliveryHistory;
  }
}

export const webhookService = new WebhookService(); 