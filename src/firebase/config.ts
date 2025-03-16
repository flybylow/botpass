import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug Firebase config
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey?.substring(0, 8) + '...',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Validate required fields
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
for (const field of requiredFields) {
  if (!firebaseConfig[field]) {
    throw new Error(`Firebase ${field} is required but not provided`);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Set persistence to LOCAL and initialize auth
const initializeAuth = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log('Firebase Auth initialized successfully with local persistence');
    
    // Test auth state
    auth.onAuthStateChanged((user) => {
      console.log('Auth state initialized:', user ? 'User logged in' : 'No user');
    }, (error) => {
      console.error('Auth state error:', error);
    });

  } catch (error) {
    console.error('Error initializing Firebase Auth:', error);
  }
};

// Initialize auth
initializeAuth().catch(console.error);

export default app; 