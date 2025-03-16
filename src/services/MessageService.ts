import { 
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { BotMessage, CreateMessageDto } from '../types/message';

class MessageService {
  private readonly COLLECTION_NAME = 'messages';

  async createMessage(dto: CreateMessageDto): Promise<BotMessage> {
    try {
      const now = new Date();
      const messageData = {
        botId: dto.botId,
        messageType: dto.messageType,
        content: dto.content,
        timestamp: dto.timestamp || now.toISOString(),
        receivedAt: serverTimestamp(),
        data: dto.data || {},
        processed: true
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), messageData);
      
      return {
        id: docRef.id,
        ...messageData,
        receivedAt: now.toISOString()
      };
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getMessagesByBotId(botId: string, limitCount = 50): Promise<BotMessage[]> {
    try {
      const messagesRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        messagesRef, 
        where('botId', '==', botId),
        orderBy('receivedAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          receivedAt: data.receivedAt instanceof Timestamp 
            ? data.receivedAt.toDate().toISOString() 
            : data.receivedAt,
        } as BotMessage;
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async getAllMessages(limitCount = 100): Promise<BotMessage[]> {
    try {
      const messagesRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        messagesRef,
        orderBy('receivedAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          receivedAt: data.receivedAt instanceof Timestamp 
            ? data.receivedAt.toDate().toISOString() 
            : data.receivedAt,
        } as BotMessage;
      });
    } catch (error) {
      console.error('Error getting all messages:', error);
      throw error;
    }
  }
}

export const messageService = new MessageService(); 