/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

const DEMO_URL = process.env.API_ORIGIN ?? 'https://malware.rip';

export async function logoutUserFromSquareX() {
  await fetch(`${DEMO_URL}/logout`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

async function checkSessionRequest(url, signal) {
  try {
    const response = await fetch(`https://${url}-sc/`, {
      signal,
    });

    return {
      success: true,
      response,
    };
  } catch (ex) {
    return {
      success: false,
      error: ex,
    };
  }
}

/**
 * The amount of time to wait before aborting the request and retrying
 * it again.
 */
const ABORT_TIMEOUT = 500;
/**
 * The amount of time to wait before sending another request after
 * a 425 response has been received
 */
const SESSION_425_WAIT_TIMEOUT = 1000;

export async function checkBoxStatusRecursively(
  url,
  UI,
  maxSeconds = Infinity
) {
  let stop_after = new Date().getTime() + maxSeconds * 1000;
  let is_session_starting = false;
  while (new Date().getTime() < stop_after || is_session_starting) {
    const abort_controller = new AbortController();
    const timer = setTimeout(
      () => abort_controller.abort('timeout'),
      ABORT_TIMEOUT
    );
    const result = await checkSessionRequest(url, abort_controller.signal);

    if (!result.success && abort_controller.signal.aborted) {
      console.log(
        'Aborted check status request. Will retry for',
        ...(stop_after === Infinity
          ? ['ever']
          : [stop_after - new Date().getTime(), 'more milliseconds'])
      );
      continue;
    }

    clearTimeout(timer);

    if (!result.success) {
      return {
        success: false,
        message: 'Network Error',
      };
    }

    const { response } = result;

    if (!response) {
      return {
        success: false,
        message: 'Missing response',
      };
    }

    if (response.status === 200) {
      try {
        const body = await response.json();

        if (body?.status === 'success') {
          return {
            success: true,
          };
        } else {
          return {
            success: false,
            message: 'Unexpected response',
          };
        }
      } catch (ex) {
        console.error('Session returned unexpected response', ex);
        return {
          success: false,
          message: 'Unexpected response',
        };
      }
    }

    if (response.status === 425) {
      UI.updateVisualState(
        'connecting',
        'We are experiencing high usage, Please wait while we prepare your session'
      );
      console.log('425 received, polling indefinite');
      is_session_starting = true;
      await new Promise((r) => setTimeout(r, SESSION_425_WAIT_TIMEOUT));
      continue;
    }

    if (response.status === 410) {
      // Clean out session information.
      localStorage.setItem('boxSession', '');
      localStorage.setItem('boxSessionTerminationToken', '');
      return {
        success: false,
        message: 'Session Disposed',
      };
    }

    return {
      success: false,
    };
  }
}

export async function launchSandbox() {
  const gResponseToken = localStorage.getItem('gResponseToken');

  const payload = {
    gResponseToken,
  };

  try {
    const apiDomain = process.env.API_ORIGIN ?? 'https://malware.rip';
    const apiUrl = `${apiDomain}/try`;
    const response = await fetch(apiUrl, {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    });
    const body = await response.json();

    if (!body?.session) {
      throw new Error('Please try after some time');
    }

    return {
      success: true,
      result: body,
    };
  } catch (error) {
    return {
      success: false,
    };
  }
}

export async function terminateSession(UI) {
  const payload = {
    session: UI.session,
    termination_token: UI.terminationToken,
  };

  try {
    const response = await fetch(`${DEMO_URL}/terminate`, {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    });
    const body = await response.json();

    if (!body?.status === 'success') {
      throw new Error('Please try after some time');
    }

    UI.session = undefined;
    UI.sessionDisposed = true;

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
    };
  }
}

export async function authDemoUser(token, session) {
  const payload = {
    token,
    session,
  };

  try {
    const response = await fetch(`${DEMO_URL}/auth`, {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(token ? payload : {}),
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    });

    await response.json();

    if (response.status === 401) {
      return {
        success: false,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.log('>>>>>>>>>> error <<<<<<<<<<');
    console.log(error);
    console.log('----------------------------------');

    return {
      success: false,
    };
  }
}
