import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { B2C_APPS, getEnvConfig, isConfigured } from '../config/b2cApps';
import type { Environment } from '../config/b2cApps';
import { useAppConfig } from '../contexts/AppConfigContext';
import {
  savePendingAuth,
  loginWithB2CInviteRedirect,
} from '../lib/msalFactory';

// ── State machine ─────────────────────────────────────────────────────────────
type InviteState =
  | 'validating'
  | 'redirecting'
  | 'no-token'
  | 'invalid'
  | 'network-error'
  | 'missing-config';

interface ValidateResponse {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  tokenValid: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Invites() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectApp } = useAppConfig();
  const [pageState, setPageState] = useState<InviteState>('validating');

  const validateAndRedirect = useCallback(
    async (token: string, appId: string, env: Environment) => {
      const app    = B2C_APPS.find(a => a.id === appId);
      const envCfg = app ? getEnvConfig(appId, env) : undefined;

      if (!app || !envCfg || !isConfigured(envCfg) || !envCfg.inviteValidateUrl) {
        setPageState('missing-config');
        return;
      }

      setPageState('validating');
      try {
        const res = await fetch(envCfg.inviteValidateUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ Token: token }),
        });

        if (!res.ok) { setPageState('network-error'); return; }

        const data = await res.json() as ValidateResponse;

        if (data.tokenValid) {
          setPageState('redirecting');
          savePendingAuth(appId, env);
          selectApp(app, env);
          await loginWithB2CInviteRedirect(appId, env, envCfg, token);
        } else {
          setPageState('invalid');
        }
      } catch {
        setPageState('network-error');
      }
    },
    [selectApp],
  );

  useEffect(() => {
    const token = searchParams.get('token');
    const appId = searchParams.get('appId');
    const env   = searchParams.get('env') as Environment | null;

    if (!token)         { setPageState('no-token');       return; }
    if (!appId || !env) { setPageState('missing-config'); return; }

    validateAndRedirect(token, appId, env);
  }, [searchParams, validateAndRedirect]);

  const handleRetry = () => {
    const token = searchParams.get('token');
    const appId = searchParams.get('appId');
    const env   = searchParams.get('env') as Environment | null;
    if (token && appId && env) validateAndRedirect(token, appId, env);
  };

  // ── Spinner ──────────────────────────────────────────────────────────────
  if (pageState === 'validating' || pageState === 'redirecting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <span className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm">
            {pageState === 'validating'
              ? 'Verifying your invitation…'
              : 'Redirecting to sign up…'}
          </p>
        </div>
      </div>
    );
  }

  // ── Error states ─────────────────────────────────────────────────────────
  const errorConfig = {
    'no-token': {
      title:   'No Invitation Token',
      message: "The link you followed doesn't contain an invitation token. Please check your invitation email and click the link again.",
      buttons: [{ label: 'Back to Home', onClick: () => navigate('/'), primary: true }],
    },
    'invalid': {
      title:   'Invalid or Expired Invitation',
      message: 'This invitation token is invalid or has already been used. Please contact your administrator to request a new invitation.',
      buttons: [{ label: 'Back to Home', onClick: () => navigate('/'), primary: true }],
    },
    'network-error': {
      title:   'Unable to Validate Invitation',
      message: "We couldn't reach the validation service. Please check your connection and try again.",
      buttons: [
        { label: 'Try Again',     onClick: handleRetry,          primary: true  },
        { label: 'Back to Home',  onClick: () => navigate('/'),  primary: false },
      ],
    },
    'missing-config': {
      title:   'App Not Configured',
      message: 'This app or environment is not set up for invitation-based signup. Please contact your administrator.',
      buttons: [{ label: 'Back to Home', onClick: () => navigate('/'), primary: true }],
    },
  } satisfies Record<Exclude<InviteState, 'validating' | 'redirecting'>, unknown>;

  const cfg = errorConfig[pageState as keyof typeof errorConfig];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <span className="text-4xl">✉️</span>
          <h2 className="mt-3 text-xl font-bold text-gray-900">{cfg.title}</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{cfg.message}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {cfg.buttons.map(btn => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              className={[
                'py-2 px-6 rounded-xl font-semibold text-sm transition-all duration-150',
                btn.primary
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white hover:opacity-90'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              ].join(' ')}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
