import { useState } from 'react';
import { ENVIRONMENTS, getEnvConfig, isConfigured } from '../config/b2cApps';
import type { B2CAppConfig, Environment } from '../config/b2cApps';
import EnvBadge from './EnvBadge';

interface AppCardProps {
  app: B2CAppConfig;
}

export default function AppCard({ app }: AppCardProps) {
  const [selectedEnv, setSelectedEnv] = useState<Environment>('dev');

  const envCfg      = getEnvConfig(app.id, selectedEnv);
  const canLogin    = isConfigured(envCfg);

  function handleLogin() {
    if (!envCfg || !canLogin) return;
    window.open(`/signin?appId=${encodeURIComponent(app.id)}&env=${encodeURIComponent(selectedEnv)}`, '_blank');
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">

      {/* ── Coloured header ── */}
      <div className={`bg-gradient-to-br ${app.gradient} p-6 text-white`}>
        <div className="text-4xl mb-3 leading-none">{app.icon}</div>
        <h2 className="text-xl font-bold leading-snug">{app.name}</h2>
        <p className="text-white/70 text-sm mt-1 leading-relaxed">{app.description}</p>
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col flex-1">

        {/* Environment tabs */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Environment
        </p>
        <div className="flex gap-2 mb-4">
          {ENVIRONMENTS.map(envDef => {
            const cfg        = getEnvConfig(app.id, envDef.id);
            const configured = isConfigured(cfg);
            const isActive   = selectedEnv === envDef.id;

            return (
              <button
                key={envDef.id}
                onClick={() => { setSelectedEnv(envDef.id); setError(null); }}
                disabled={!configured}
                title={configured ? undefined : `Set VITE_${app.id.toUpperCase()}_${envDef.label}_* in .env`}
                className={[
                  'flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all duration-150',
                  isActive && configured
                    ? `${envDef.color} border-current`
                    : configured
                      ? 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                      : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed',
                ].join(' ')}
              >
                {envDef.label}
                {!configured && (
                  <span className="block text-gray-300" style={{ fontSize: '0.55rem' }}>
                    not set
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Config preview */}
        {canLogin && envCfg && (
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 mb-4 space-y-0.5 font-mono">
            <div><span className="text-gray-500 font-sans font-medium">Tenant: </span>{envCfg.tenantDomain}</div>
            <div><span className="text-gray-500 font-sans font-medium">Policy: </span>{envCfg.policy}</div>
            <div><span className="text-gray-500 font-sans font-medium">Client: </span>{envCfg.clientId.substring(0, 8)}…</div>
          </div>
        )}

        {/* Not-configured hint */}
        {!canLogin && (
          <div className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3 mb-4 border border-amber-200">
            ⚠️ Add{' '}
            <code className="font-mono">
              VITE_{app.id.toUpperCase()}_{selectedEnv.toUpperCase()}_*
            </code>{' '}
            vars to <code className="font-mono">.env</code> to enable this environment.
          </div>
        )}

        {/* Error */}

        {/* Login button — pushed to bottom */}
        <button
          onClick={handleLogin}
          disabled={!canLogin}
          className={[
            'mt-auto w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-150',
            canLogin
              ? `bg-gradient-to-r ${app.gradient} text-white hover:opacity-90 active:scale-95 shadow-sm`
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          {`Sign in to ${app.name}`}
        </button>
      </div>
    </div>
  );
}
