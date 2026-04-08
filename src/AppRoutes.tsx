import { Routes, Route, Navigate } from 'react-router-dom';
import Home         from './pages/Home';
import AuthCallback from './pages/AuthCallback';
import Welcome      from './pages/Welcome';
import SignIn       from './pages/SignIn';
import ProtectedRoute from './components/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/"              element={<Home />} />
      <Route path="/signin"        element={<SignIn />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/welcome"
        element={
          <ProtectedRoute>
            <Welcome />
          </ProtectedRoute>
        }
      />
      {/* Catch-all → home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
