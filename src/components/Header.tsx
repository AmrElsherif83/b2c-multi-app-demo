import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import EnvBadge from './EnvBadge';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { app, env } = useAppConfig();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo / home link */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-bold text-gray-800 hover:text-gray-600 transition-colors shrink-0"
        >
          <span className="text-xl">🔐</span>
          <span className="hidden sm:block">B2C Demo</span>
        </button>

        {/* Right side — shown when authenticated */}
        {isAuthenticated && app && env && (
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm text-gray-500 hidden md:block truncate max-w-xs">
              {app.icon} {app.name}
            </span>
            <EnvBadge env={env} />
            <span className="text-sm text-gray-700 font-medium hidden sm:block truncate max-w-[160px]">
              {user?.name || user?.email}
            </span>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="text-sm text-red-500 hover:text-red-700 transition-colors font-semibold shrink-0"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
