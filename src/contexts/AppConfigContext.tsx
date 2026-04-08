import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { PublicClientApplication } from '@azure/msal-browser';
import { B2C_APPS, getEnvConfig } from '../config/b2cApps';
import type { B2CAppConfig, Environment } from '../config/b2cApps';
import { getMsalInstance, savePendingAuth, loadPendingAuth } from '../lib/msalFactory';

interface AppConfigState {
  app:  B2CAppConfig | null;
  env:  Environment  | null;
  msal: PublicClientApplication | null;
}

interface AppConfigContextType extends AppConfigState {
  /** Select an app + environment; persists to sessionStorage for callback restoration. */
  selectApp: (app: B2CAppConfig, env: Environment) => void;
  clearSelection: () => void;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

/**
 * Attempt to restore the app+env selection that was saved before the B2C redirect.
 * This runs synchronously during initial render so AuthCallback has state immediately.
 */
function restoreFromStorage(): AppConfigState {
  const pending = loadPendingAuth();
  if (!pending) return { app: null, env: null, msal: null };

  const app    = B2C_APPS.find(a => a.id === pending.appId) ?? null;
  const envCfg = app ? getEnvConfig(pending.appId, pending.env as Environment) : undefined;
  if (!app || !envCfg) return { app: null, env: null, msal: null };

  const msal = getMsalInstance(pending.appId, pending.env, envCfg);
  return { app, env: pending.env as Environment, msal };
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppConfigState>(restoreFromStorage);

  const selectApp = useCallback((app: B2CAppConfig, env: Environment) => {
    const envCfg = getEnvConfig(app.id, env);
    if (!envCfg) throw new Error(`No B2C config found for ${app.id}/${env}`);

    savePendingAuth(app.id, env);
    const msal = getMsalInstance(app.id, env, envCfg);
    setState({ app, env, msal });
  }, []);

  const clearSelection = useCallback(() => {
    setState({ app: null, env: null, msal: null });
  }, []);

  return (
    <AppConfigContext.Provider value={{ ...state, selectApp, clearSelection }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig(): AppConfigContextType {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error('useAppConfig must be used within AppConfigProvider');
  return ctx;
}
