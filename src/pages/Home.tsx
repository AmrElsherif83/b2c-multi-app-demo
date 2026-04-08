import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { B2C_APPS } from '../config/b2cApps';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import AppCard from '../components/AppCard';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/welcome', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-500 mb-6 shadow-sm">
            <span>🔐</span>
            <span>Azure AD B2C Demo</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Multi-App B2C Demo
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Each card is a separate Azure B2C app registration. Choose an
            environment, then click <strong>Sign in</strong> to test the full
            redirect → callback → welcome flow.
          </p>
        </div>

        {/* App cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {B2C_APPS.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>

        {/* How it works */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            { step: '1', title: 'Select environment', desc: 'DEV, STAGE, or PROD — each maps to its own B2C tenant config.' },
            { step: '2', title: 'Click Sign in',      desc: 'A B2C redirect is triggered with the app-specific client ID and policy.' },
            { step: '3', title: 'View your claims',   desc: 'After callback the Welcome page shows your token claims and user info.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mb-2">
                {step}
              </div>
              <p className="font-semibold text-gray-800 mb-1">{title}</p>
              <p className="text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
