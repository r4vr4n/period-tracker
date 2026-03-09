import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './config';

export async function signInWithEmail(email: string, password: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (err: unknown) {
    // If user doesn't exist, create the account automatically
    if (err instanceof Error && 'code' in err) {
      const code = (err as { code: string }).code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
      }
    }
    throw err;
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback);
}
