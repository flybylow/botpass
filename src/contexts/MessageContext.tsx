import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit as firestoreLimit, 
  onSnapshot,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { BotMessage } from '../types/message';
import { messageService } from '../services/MessageService';

interface MessageContextType {
  messages: BotMessage[];
  botMessages: Record<string, BotMessage[]>;
  loadMessages: (botId?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [botMessages, setBotMessages] = useState<Record<string, BotMessage[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up real-time listener for all messages
  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      orderBy('receivedAt', 'desc'),
      firestoreLimit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const updatedMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            receivedAt: data.receivedAt instanceof Timestamp
              ? data.receivedAt.toDate().toISOString()
              : data.receivedAt
          } as BotMessage;
        });
        
        setMessages(updatedMessages);
        
        // Group messages by botId for easy access
        const groupedByBot: Record<string, BotMessage[]> = {};
        updatedMessages.forEach(message => {
          if (!groupedByBot[message.botId]) {
            groupedByBot[message.botId] = [];
          }
          groupedByBot[message.botId].push(message);
        });
        
        setBotMessages(groupedByBot);
        setError(null);
      } catch (err) {
        console.error('Error processing messages:', err);
        setError('Failed to process messages data');
      }
    }, (err) => {
      console.error('Firestore listener error:', err);
      setError('Failed to listen for message updates');
    });

    return () => unsubscribe();
  }, []);

  const loadMessages = useCallback(async (botId?: string) => {
    setIsLoading(true);
    try {
      let loadedMessages: BotMessage[];
      
      if (botId) {
        loadedMessages = await messageService.getMessagesByBotId(botId);
      } else {
        loadedMessages = await messageService.getAllMessages();
      }
      
      // Only update state if the snapshot listener hasn't already done so
      if (!messages.some(m => loadedMessages.find(lm => lm.id === m.id))) {
        setMessages(loadedMessages);
        
        // Group messages by botId
        const groupedByBot: Record<string, BotMessage[]> = {};
        loadedMessages.forEach(message => {
          if (!groupedByBot[message.botId]) {
            groupedByBot[message.botId] = [];
          }
          groupedByBot[message.botId].push(message);
        });
        
        setBotMessages(groupedByBot);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const value = {
    messages,
    botMessages,
    loadMessages,
    isLoading,
    error
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}; 