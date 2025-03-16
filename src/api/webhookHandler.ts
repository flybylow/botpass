import { messageService } from '../services/MessageService';
import { CreateMessageDto } from '../types/message';

// This would typically be in your backend, but we're simulating it here
export async function handleIncomingWebhook(payload: any): Promise<{ success: boolean; message: string }> {
  try {
    // Validate the payload
    if (!payload.botId) {
      return { success: false, message: 'Missing botId in webhook payload' };
    }
    
    if (!payload.messageType || !['status', 'message', 'error', 'event'].includes(payload.messageType)) {
      return { success: false, message: 'Invalid or missing messageType in webhook payload' };
    }
    
    if (!payload.content) {
      return { success: false, message: 'Missing content in webhook payload' };
    }

    // Create the message DTO
    const messageDto: CreateMessageDto = {
      botId: payload.botId,
      messageType: payload.messageType,
      content: payload.content,
      timestamp: payload.timestamp || new Date().toISOString(),
      data: payload.data || {}
    };

    // Save the message to the database
    await messageService.createMessage(messageDto);

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return { 
      success: false, 
      message: `Failed to process webhook: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 