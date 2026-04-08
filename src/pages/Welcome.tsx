import { useNavigate } from 'react-router-dom';
import { useAuth, decodeJwtClaims } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import Header from '../components/Header';
import EnvBadge from '../components/EnvBadge';

export default function Welcome() {
  const { user, accessToken, idToken, logout } = useAuth();
  const { app, env } = useAppConfig();
  const navigate = useNavigate();

  const claims = idToken
    ? decodeJwtClaims(idToken)
    : accessToken
      ? decodeJwtClaims(accessToken)
      : {};

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* Welcome banner */}
        <div
          className={`rounded-2xl bg-gradient-to-r ${app?.gradient ?? 'from-blue-600 to-blue-800'} text-white p-8 mb-8 shadow-lg`}
        >
          <div className="flex flex-wrap items-start gap-4">
            <span className="text-5xl leading-none">{app?.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-0.5">
                Signed in to
              </p>
              <h1 className="text-3xl font-bold truncate">{app?.name}</h1>
              <p className="text-white/70 text-sm mt-1">{app?.description}</p>
            </div>
            {env && <EnvBadge env={env} size="lg" className="shrink-0 mt-1" />}
          </div>

          <div className="mt-6 pt-5 border-t border-white/20">
            <p className="text-white/80 text-lg">
              Welcome back,{' '}
              <strong className="text-white">{user?.name || user?.email}</strong> 👋
            </p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* User info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>👤</span> User Info
            </h2>
            <dl className="space-y-3">
              <InfoRow label="Email"       value={user?.email} />
              <InfoRow label="Name"        value={user?.name} />
              <InfoRow label="App"         value={app ? `${app.name} (${app.id})` : undefined} />
              <InfoRow label="Environment" value={env?.toUpperCase()} />
            </dl>
          </div>

          {/* Token claims */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>🔑</span> ID Token Claims
            </h2>
            <div className="overflow-auto max-h-56 rounded-lg bg-gray-50 p-3">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">
                {JSON.stringify(claims, null, 2)}
              </pre>
            </div>
          </div>

          {/* Access token preview */}
          {accessToken && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
              <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <span>🎫</span> Access Token
                <span className="text-xs text-gray-400 font-normal">
                  (first 200 chars)
                </span>
              </h2>
              <div className="text-xs font-mono text-gray-500 bg-gray-50 rounded-lg p-3 break-all overflow-hidden max-h-20">
                {accessToken.substring(0, 200)}{accessToken.length > 200 ? '…' : ''}
              </div>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-semibold shadow-sm"
          >
            Sign Out
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-sm"
          >
            ← Back to Home
          </button>
        </div>

      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-28 shrink-0 pt-0.5">
        {label}
      </dt>
      <dd className="text-sm text-gray-800 font-medium break-all">
        {value ?? <span className="text-gray-300 italic font-normal">—</span>}
      </dd>
    </div>
  );
}
