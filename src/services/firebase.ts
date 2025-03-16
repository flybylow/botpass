import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const sendMessage = async (message: string, botId: string): Promise<void> => {
  try {
    const messagesRef = collection(db, 'messages');
    await addDoc(messagesRef, {
      message,
      botId,
      timestamp: new Date().toISOString(),
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}; 