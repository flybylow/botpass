export type MessageType = 'status' | 'message' | 'error' | 'event';

export interface BotMessage {
  id: string;
  botId: string;
  messageType: MessageType;
  content: string;
  timestamp: string;
  receivedAt: string;
  data?: Record<string, any>;
  processed: boolean;
}

export interface CreateMessageDto {
  botId: string;
  messageType: MessageType;
  content: string;
  timestamp?: string;
  data?: Record<string, any>;
} 