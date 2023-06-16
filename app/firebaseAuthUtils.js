/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import { initializeApp } from 'firebase/app';
import {
  signOut,
  getAuth,
  getRedirectResult as getFirebaseRedirectResult,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
} from 'firebase/auth';
import { togglePreventNavigationEvent } from './prevent-navigation';

const APP_ID = process.env.APP_ID;
const API_KEY = process.env.API_KEY;
const PROJ_ID = process.env.PROJ_ID;
const AUTH_DOMAIN = process.env.AUTH_DOMAIN;
const MESSAGING_SENDER_ID = process.env.MESSAGING_SENDER_ID;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET;

const firebaseApp = {
  current: null,
};

export function getFirebaseAuth() {
  if (!firebaseApp.current) {
    const firebaseConfigs = {
      appId: APP_ID,
      apiKey: API_KEY,
      projectId: PROJ_ID,
      authDomain: AUTH_DOMAIN,
      messagingSenderId: MESSAGING_SENDER_ID,
      storageBucket: STORAGE_BUCKET,
    };
    firebaseApp.current = initializeApp(firebaseConfigs);
  }

  return getAuth(firebaseApp.current);
}

export function initializeFirebase(UI) {
  const auth = getFirebaseAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user == null) {
      return;
    }

    const idToken = await user.getIdToken();

    console.log('>>>>>>>>>> idToken <<<<<<<<<<');
    console.log(idToken);
    console.log('----------------------------------');

    UI.idToken = idToken;
  });
}

export async function getRedirectResult() {
  try {
    const result = await getFirebaseRedirectResult(getFirebaseAuth());
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const auth = getFirebaseAuth();

  try {
    togglePreventNavigationEvent(false);
    await signInWithRedirect(auth, provider);
  } catch (error) {
    togglePreventNavigationEvent(true);
    return `error: ${error.code}`;
  }
}

export function logoutUserFromFirebase() {
  const auth = getFirebaseAuth();

  return signOut(auth);
}
