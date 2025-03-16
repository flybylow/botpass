import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  AuthError,
  AuthErrorCodes,
  Auth
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async <T,>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0 || (error as AuthError).code !== 'auth/network-request-failed') {
      throw error;
    }
    console.log(`Retrying operation, ${retries} attempts remaining...`);
    await sleep(delay);
    return retryOperation(operation, retries - 1, delay);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const firebaseAuth: Auth = auth;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
        });
      } else {
        setUser(null);
      }
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, [firebaseAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('Login successful:', userCredential.user.email);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/user-not-found':
          throw new Error('No account exists with this email.');
        case 'auth/wrong-password':
          throw new Error('Incorrect password.');
        case 'auth/invalid-email':
          throw new Error('Invalid email address.');
        case 'auth/user-disabled':
          throw new Error('This account has been disabled.');
        default:
          throw new Error('Failed to sign in. Please check your credentials.');
      }
    }
  }, [navigate, firebaseAuth]);

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    if (!email || !password || !displayName) {
      throw new Error('All fields are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    try {
      console.log('Starting signup process...');
      
      const userCredential = await retryOperation(async () => {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        console.log('User created successfully:', cred.user.uid);
        return cred;
      });

      try {
        await retryOperation(async () => {
          await updateProfile(userCredential.user, { displayName });
          console.log('Profile updated successfully');
        });
      } catch (profileError) {
        console.error('Error updating profile:', profileError);
        // Continue even if profile update fails
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      const authError = error as AuthError;
      
      switch (authError.code) {
        case AuthErrorCodes.EMAIL_EXISTS:
          throw new Error('An account already exists with this email');
        case AuthErrorCodes.INVALID_EMAIL:
          throw new Error('The email address is not valid');
        case AuthErrorCodes.OPERATION_NOT_ALLOWED:
          throw new Error('Password sign-up is disabled for this project');
        case AuthErrorCodes.WEAK_PASSWORD:
          throw new Error('The password must be at least 6 characters long');
        case 'auth/network-request-failed':
          throw new Error('Network error. Please check your internet connection and try again');
        case 'auth/too-many-requests':
          throw new Error('Too many attempts. Please try again later');
        default:
          console.error('Detailed error:', authError);
          throw new Error(`Signup failed: ${authError.message || 'Unknown error occurred'}`);
      }
    }
  }, [navigate, firebaseAuth]);

  const logout = useCallback(async () => {
    try {
      await signOut(firebaseAuth);
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to log out.');
    }
  }, [navigate, firebaseAuth]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error) {
      console.error('Reset password error:', error);
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/invalid-email':
          throw new Error('Invalid email address.');
        case 'auth/user-not-found':
          throw new Error('No account exists with this email.');
        default:
          throw new Error('Failed to send password reset email.');
      }
    }
  }, [firebaseAuth]);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 