import {
  PublicClientApplication,
  Configuration,
  LogLevel,
  NavigationClient,
  NavigationOptions,
} from '@azure/msal-browser';
import type { B2CEnvConfig } from '../config/b2cApps';

/**
 * Suppresses MSAL's built-in post-redirect navigation so that AuthCallback
 * can drive all navigation after handleRedirectPromise() resolves.
 * Without this, MSAL calls window.location.replace to the loginRequestUrl,
 * which reloads the page and clears all JS state before AuthCallback can run.
 */
class NoInternalNavigationClient extends NavigationClient {
  async navigateInternal(_url: string, _options: NavigationOptions): Promise<boolean> {
    return false; // tell MSAL "we handle navigation"
  }
}

// Per-appId:env caches to avoid creating duplicate instances
const _instanceCache = new Map<string, PublicClientApplication>();
const _initCache     = new Map<string, Promise<void>>();

/**
 * Returns (or creates and caches) a PublicClientApplication for the given
 * appId + env combination. Safe to call multiple times with the same key.
 */
export function getMsalInstance(
  appId: string,
  env: string,
  config: B2CEnvConfig,
): PublicClientApplication {
  const key = `${appId}:${env}`;
  if (_instanceCache.has(key)) return _instanceCache.get(key)!;

  const tenantName = config.tenantDomain.replace('.onmicrosoft.com', '');
  const authority  = `https://${tenantName}.b2clogin.com/${config.tenantDomain}/${config.policy}`;

  const msalConfig: Configuration = {
    auth: {
      clientId:               config.clientId,
      authority,
      knownAuthorities:       [`${tenantName}.b2clogin.com`],
      redirectUri:            `${window.location.origin}/auth/callback`,
      postLogoutRedirectUri:  window.location.origin,
    },
    cache: {
      // sessionStorage keeps each browser tab isolated — ideal for a multi-app demo
      // where different tabs may be logged in to different apps/environments.
      cacheLocation: 'sessionStorage',
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Warning,
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return;
          const tag = `[MSAL ${key}]`;
          if      (level === LogLevel.Error)   console.error(tag, message);
          else if (level === LogLevel.Warning) console.warn(tag, message);
          else if (level === LogLevel.Info)    console.info(tag, message);
          else                                 console.debug(tag, message);
        },
      },
    },
  };

  const instance = new PublicClientApplication(msalConfig);
  instance.setNavigationClient(new NoInternalNavigationClient());
  _instanceCache.set(key, instance);
  return instance;
}

/**
 * Initializes the MSAL instance exactly once per appId:env.
 * Must be called before loginRedirect() or handleRedirectPromise().
 */
export async function initializeMsalInstance(
  appId: string,
  env: string,
  config: B2CEnvConfig,
): Promise<PublicClientApplication> {
  const key      = `${appId}:${env}`;
  const instance = getMsalInstance(appId, env, config);

  if (!_initCache.has(key)) {
    _initCache.set(key, instance.initialize());
  }
  await _initCache.get(key);
  return instance;
}

// ---------------------------------------------------------------------------
// Pending-auth persistence
// Stores which appId+env was selected before the B2C redirect so that
// AuthCallback can reconstruct the correct MSAL instance on the way back.
// ---------------------------------------------------------------------------

export const PENDING_KEY = 'b2c_demo_pending';

export interface PendingAuth {
  appId: string;
  env: string;
}

export function savePendingAuth(appId: string, env: string): void {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ appId, env }));
}

export function loadPendingAuth(): PendingAuth | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingAuth) : null;
  } catch {
    return null;
  }
}

export function clearPendingAuth(): void {
  sessionStorage.removeItem(PENDING_KEY);
}

/**
 * Remove any stale MSAL interaction.status entries left by an incomplete
 * redirect (e.g., user navigated away mid-flow). Without this, MSAL throws
 * interaction_in_progress on the next loginRedirect() call.
 */
export function clearStaleInteraction(): void {
  Object.keys(sessionStorage)
    .filter(k => k.includes('interaction.status') || k.includes('interaction_status'))
    .forEach(k => sessionStorage.removeItem(k));
}
