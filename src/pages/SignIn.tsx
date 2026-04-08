import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getEnvConfig, isConfigured, B2C_APPS } from '../config/b2cApps';
import type { Environment } from '../config/b2cApps';
import { useAppConfig } from '../contexts/AppConfigContext';
import { initializeMsalInstance, clearStaleInteraction, savePendingAuth } from '../lib/msalFactory';

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const { selectApp } = useAppConfig();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const appId = searchParams.get('appId');
    const env   = searchParams.get('env') as Environment | null;

    if (!appId || !env) {
      setError('Missing appId or env query parameter.');
      return;
    }

    const app    = B2C_APPS.find(a => a.id === appId);
    const envCfg = app ? getEnvConfig(appId, env) : undefined;

    if (!app || !envCfg || !isConfigured(envCfg)) {
      setError('App or environment not configured.');
      return;
    }

    savePendingAuth(appId, env);
    selectApp(app, env);

    initializeMsalInstance(appId, env, envCfg)
      .then(instance => {
        clearStaleInteraction();
        return instance.loginRedirect({ scopes: envCfg.scopes });
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : String(err));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md text-center shadow-sm">
          <p className="text-red-600 font-semibold mb-2">Sign-in error</p>
          <p className="text-sm text-gray-500 break-all">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm">Redirecting to B2C…</p>
      </div>
    </div>
  );
}
