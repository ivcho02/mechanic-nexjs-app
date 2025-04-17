import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, AuthError, updateProfile } from 'firebase/auth';
import { createClientFromAuth } from '@/helpers/firebaseHelpers';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Authentication helper functions
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: unknown) {
    const firebaseError = error as { message: string };
    return { user: null, error: firebaseError.message };
  }
};

export const registerWithEmail = async (
  email: string,
  password: string,
  name?: string,
  phone?: string
): Promise<{ user?: User; error?: string }> => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // If name is provided, update the user profile
    if (name) {
      await updateProfile(user, {
        displayName: name
      });
    }

    // Create a client record
    await createClientFromAuth(user, phone);

    return { user: userCredential.user };
  } catch (error) {
    const errorCode = (error as AuthError).code;
    const errorMessage = (error as AuthError).message;
    console.error('Error registering user:', errorCode, errorMessage);

    // Handle specific error cases
    if (errorCode === 'auth/email-already-in-use') {
      return { error: 'This email is already registered.' };
    } else if (errorCode === 'auth/invalid-email') {
      return { error: 'Invalid email address.' };
    } else if (errorCode === 'auth/weak-password') {
      return { error: 'Password is too weak.' };
    }

    return { error: errorMessage };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error: unknown) {
    const firebaseError = error as { message: string };
    return { success: false, error: firebaseError.message };
  }
};

// Admin emails (add the mechanic's email here)
const ADMIN_EMAILS = ['admin@mechanic.com', 'mechanic@example.com'];

// Check if user is admin
export const isAdmin = (user: User | null) => {
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email || '');
}

// Check if an email is already an admin
export const isEmailAdmin = (email: string) => {
  return ADMIN_EMAILS.includes(email);
}

// Add a new admin email
export const addAdminEmail = (email: string) => {
  if (!isEmailAdmin(email)) {
    ADMIN_EMAILS.push(email);
    return true;
  }
  return false;
}