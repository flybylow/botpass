import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Message {
  id: string;
  message: string;
  createdAt: Timestamp | null;
}

interface MessageHistoryProps {
  botId: string;
  refreshTrigger?: number;
}

const formatTimestamp = (timestamp: Timestamp | null): string => {
  if (!timestamp) return 'Just now';
  try {
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    
    return date.toLocaleString();
  } catch (err) {
    console.error('Error formatting timestamp:', err);
    return 'Recently';
  }
};

export const MessageHistory: React.FC<MessageHistoryProps> = ({ botId, refreshTrigger = 0 }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const messagesRef = collection(db, 'messages');
        const q = query(
          messagesRef,
          where('botId', '==', botId),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        
        const querySnapshot = await getDocs(q);
        const loadedMessages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            message: data.message,
            createdAt: data.createdAt
          };
        }) as Message[];
        
        setMessages(loadedMessages);
        setRetryCount(0); // Reset retry count on success
      } catch (err: any) {
        console.error('Error loading messages:', err);
        
        if (err?.message?.includes('requires an index')) {
          setError('Message history is being prepared. This may take a few minutes...');
        } else if (err?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
          setError('Connection blocked. Please check your browser extensions or ad blocker settings.');
        } else if (retryCount < 3) {
          // Retry up to 3 times with exponential backoff
          const timeout = Math.pow(2, retryCount) * 1000;
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, timeout);
          setError('Retrying connection...');
        } else {
          setError('Failed to load message history. Please try refreshing the page.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [botId, refreshTrigger, retryCount]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading messages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-600">{error}</p>
        {error.includes('being prepared') && (
          <p className="text-xs text-gray-500 mt-2">
            First-time setup: Firebase is creating necessary indexes for message retrieval.
          </p>
        )}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <p className="text-sm text-gray-900">{message.message}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatTimestamp(message.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}; 