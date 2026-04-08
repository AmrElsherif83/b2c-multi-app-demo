import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useAppConfig } from './AppConfigContext';
import { initializeMsalInstance, clearStaleInteraction, clearPendingAuth } from '../lib/msalFactory';
import { getEnvConfig } from '../config/b2cApps';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  email: string;
  name?: string;
}

interface AuthContextType {
  user:            AuthUser | null;
  accessToken:     string | null;
  idToken:         string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  error:           string | null;
  /** Called by AuthCallback after a successful redirect result. */
  setSession:      (user: AuthUser, accessToken: string, idToken: string) => void;
  login:           () => Promise<void>;
  logout:          () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { app, env, msal } = useAppConfig();

  const [user,        setUser]        = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [idToken,     setIdToken]     = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Reset auth state when the selected app/env changes
  useEffect(() => {
    if (!app || !env) {
      setUser(null);
      setAccessToken(null);
      setIdToken(null);
    }
  }, [app, env]);

  const setSession = useCallback(
    (u: AuthUser, access: string, id: string) => {
      setUser(u);
      setAccessToken(access);
      setIdToken(id);
      setError(null);
    },
    [],
  );

  /**
   * Trigger the B2C redirect login for the currently selected app + env.
   * Called from AppCard — selectApp() must have been called first so that
   * app/env/msal are populated in context.
   */
  const login = useCallback(async () => {
    if (!app || !env) return;
    const cfg = getEnvConfig(app.id, env);
    if (!cfg) return;

    try {
      setIsLoading(true);
      setError(null);
      const instance = await initializeMsalInstance(app.id, env, cfg);
      clearStaleInteraction();
      await instance.loginRedirect({ scopes: cfg.scopes });
      // Browser navigates away — code below never runs during redirect flow
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
    }
  }, [app, env]);

  const logout = useCallback(() => {
    clearPendingAuth();
    if (msal) {
      msal.logoutRedirect().catch(() => { /* ignore */ });
    }
    setUser(null);
    setAccessToken(null);
    setIdToken(null);
  }, [msal]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        idToken,
        isAuthenticated: !!user,
        isLoading,
        error,
        setSession,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

/**
 * Decode the payload section of a JWT without verifying its signature.
 * MSAL has already validated the token — we only need the claims for display.
 */
export function decodeJwtClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    if (!payload) return {};
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}
