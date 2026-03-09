import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  type User,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

const EMAIL_LINK_KEY = 'emailForSignIn';

const actionCodeSettings = {
  url: window.location.origin + '/auth/callback',
  handleCodeInApp: true,
};

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function sendSignInLink(email: string): Promise<void> {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem(EMAIL_LINK_KEY, email);
}

export async function completeSignInWithLink(url: string): Promise<User | null> {
  if (!isSignInWithEmailLink(auth, url)) return null;

  let email = window.localStorage.getItem(EMAIL_LINK_KEY);
  if (!email) {
    email = window.prompt('Please provide your email for confirmation');
  }
  if (!email) return null;

  const result = await signInWithEmailLink(auth, email, url);
  window.localStorage.removeItem(EMAIL_LINK_KEY);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback);
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
