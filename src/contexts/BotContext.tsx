import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  getDoc,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Bot {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  userId: string;
  webhookUrl: string | null;
  webhookEvents: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface BotContextType {
  bots: Bot[];
  getBot: (id: string) => Promise<Bot | null>;
  getUserBots: (userId: string) => Promise<Bot[]>;
  registerBot: (bot: Omit<Bot, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBot: (id: string, bot: Partial<Bot>) => Promise<void>;
  deleteBot: (id: string) => Promise<void>;
  getBotMessageCount: (botId: string) => Promise<number>;
}

const BotContext = createContext<BotContextType | null>(null);

export const useBot = () => {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error('useBot must be used within a BotProvider');
  }
  return context;
};

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bots, setBots] = useState<Bot[]>([]);

  // Load bots from Firestore and migrate ownerId to userId if needed
  useEffect(() => {
    const loadBots = async () => {
      try {
        console.log('Loading bots from Firestore...');
        const botsRef = collection(db, 'bots');
        const querySnapshot = await getDocs(botsRef);
        console.log('Bots loaded:', querySnapshot.size, 'documents found');
        
        // Process and migrate bots if needed
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          
          // Migrate ownerId to userId if needed
          if (data.ownerId && !data.userId) {
            console.log(`Migrating bot ${docSnapshot.id} from ownerId to userId`);
            await updateDoc(doc(db, 'bots', docSnapshot.id), {
              userId: data.ownerId,
              updatedAt: new Date()
            });
            // Remove ownerId after migration
            await updateDoc(doc(db, 'bots', docSnapshot.id), {
              ownerId: null
            });
          }
        }

        // Load bots with updated data
        const loadedBots = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Processing bot document:', doc.id, data);
          return {
            id: doc.id,
            ...data,
            userId: data.userId || data.ownerId, // Fallback during transition
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          };
        }) as Bot[];
        
        console.log('Processed bots:', loadedBots);
        setBots(loadedBots);
      } catch (error) {
        console.error('Error loading bots:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message, error.stack);
        }
      }
    };

    loadBots();
  }, []);

  const getBot = async (id: string): Promise<Bot | null> => {
    try {
      const botDoc = await getDoc(doc(db, 'bots', id));
      if (!botDoc.exists()) return null;
      return { id: botDoc.id, ...botDoc.data() } as Bot;
    } catch (error) {
      console.error('Error fetching bot:', error);
      throw error;
    }
  };

  const getUserBots = async (userId: string): Promise<Bot[]> => {
    try {
      console.log('Fetching bots for user:', userId);
      const q = query(collection(db, 'bots'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const userBots = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      }) as Bot[];
      
      console.log('Total bots found:', userBots.length);
      console.log('Processed user bots:', userBots);
      
      return userBots;
    } catch (error) {
      console.error('Error fetching user bots:', error);
      throw error;
    }
  };

  const registerBot = async (bot: Omit<Bot, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      const now = new Date();
      await addDoc(collection(db, 'bots'), {
        ...bot,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error('Error registering bot:', error);
      throw error;
    }
  };

  const updateBot = async (id: string, bot: Partial<Bot>): Promise<void> => {
    try {
      const botRef = doc(db, 'bots', id);
      await updateDoc(botRef, {
        ...bot,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating bot:', error);
      throw error;
    }
  };

  const deleteBot = async (id: string): Promise<void> => {
    try {
      await updateDoc(doc(db, 'bots', id), {
        deleted: true,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error deleting bot:', error);
      throw error;
    }
  };

  const getBotMessageCount = async (botId: string): Promise<number> => {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('botId', '==', botId));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting message count:', error);
      return 0;
    }
  };

  const value = {
    bots,
    getBot,
    getUserBots,
    registerBot,
    updateBot,
    deleteBot,
    getBotMessageCount
  };

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>;
};

export default BotContext; 