/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import { getRedirectResult, getFirebaseAuth } from './firebaseAuthUtils';
import { authDemoUser } from './api';
import UI from './ui';

export async function initializeAuth() {
  const initial_auth_result = await authDemoUser();

  // If the auth succeeds without an ID token from firebase
  // then the user is already logged in.
  if (initial_auth_result.success) {
    UI.isLoggedIn = true;
    return (UI.authInitialized = true), void 0;
  }

  // Otherwise we check whether there is a firebase token available
  const result = await getRedirectResult(getFirebaseAuth());

  if (result.success && result.result) {
    UI.idToken = await result.result.user.getIdToken();
  } else {
    return (UI.authInitialized = true), void 0;
  }

  const response = await authDemoUser(UI.idToken, UI.session);

  if (response.success) {
    UI.isLoggedIn = true;
  } else {
    UI.isLoggedIn = false;
  }

  UI.authInitialized = true;
}
