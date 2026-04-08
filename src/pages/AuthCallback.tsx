import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { B2C_APPS, getEnvConfig } from '../config/b2cApps';
import type { Environment } from '../config/b2cApps';
import {
  initializeMsalInstance,
  loadPendingAuth,
  clearPendingAuth,
} from '../lib/msalFactory';
import { useAuth, decodeJwtClaims } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';

export default function AuthCallback() {
  const navigate      = useNavigate();
  const { setSession } = useAuth();
  const { selectApp }  = useAppConfig();

  const [status,   setStatus]   = useState<'processing' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function handle() {
      // ── 1. Surface any B2C-level errors from the URL (before touching MSAL) ──
      const sp  = new URLSearchParams(window.location.search);
      const hp  = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const urlErr = sp.get('error') || hp.get('error');

      if (urlErr) {
        const raw  = sp.get('error_description') || hp.get('error_description') || urlErr;
        const desc = decodeURIComponent(raw.replace(/\+/g, ' '));
        if (!cancelled) { setErrorMsg(desc); setStatus('error'); }
        return;
      }

      // ── 2. Restore which app/env was selected before the redirect ──
      const pending = loadPendingAuth();
      if (!pending) {
        if (!cancelled) {
          setErrorMsg(
            'No pending authentication session found.\n' +
            'Please return to the home page and start a fresh login.',
          );
          setStatus('error');
        }
        return;
      }

      const appCfg = B2C_APPS.find(a => a.id === pending.appId);
      const envCfg = appCfg
        ? getEnvConfig(pending.appId, pending.env as Environment)
        : undefined;

      if (!appCfg || !envCfg) {
        if (!cancelled) {
          setErrorMsg(`Unknown app configuration: ${pending.appId} / ${pending.env}`);
          setStatus('error');
        }
        return;
      }

      // ── 3. Process the redirect result with the correct MSAL instance ──
      try {
        const instance = await initializeMsalInstance(pending.appId, pending.env, envCfg);
        const result   = await instance.handleRedirectPromise();

        if (!result) {
          if (!cancelled) {
            setErrorMsg(
              'MSAL returned no result — the auth code may have already been consumed.\n\n' +
              'Possible causes:\n' +
              '  • Page reloaded during the redirect (duplicate handleRedirectPromise call)\n' +
              '  • Stale or missing MSAL state in sessionStorage\n\n' +
              'Please go back to the home page and try again.',
            );
            setStatus('error');
          }
          return;
        }

        const token = result.accessToken || result.idToken;
        if (!token || !result.account) {
          if (!cancelled) {
            setErrorMsg('Authentication succeeded but no token or account was returned.');
            setStatus('error');
          }
          return;
        }

        // ── 4. Build user object from account + id-token claims ──
        const claims = decodeJwtClaims(result.idToken || result.accessToken);
        const user = {
          email: result.account.username
            || (claims['email']          as string)
            || (claims['signInNames.emailAddress'] as string)
            || '',
          name: result.account.name || (claims['name'] as string) || undefined,
        };

        // ── 5. Restore context and navigate to welcome ──
        selectApp(appCfg, pending.env as Environment);
        setSession(user, result.accessToken || '', result.idToken || '');
        clearPendingAuth();

        if (!cancelled) navigate('/welcome', { replace: true });
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      }
    }

    handle();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Spinner ──
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Completing sign-in…</p>
          <p className="text-gray-400 text-sm mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">❌</span>
          <h1 className="text-xl font-semibold text-gray-800">Authentication Error</h1>
        </div>
        <pre className="text-sm text-red-600 bg-red-50 rounded-lg p-4 whitespace-pre-wrap font-mono border border-red-200 mb-6 overflow-auto max-h-60">
          {errorMsg}
        </pre>
        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
