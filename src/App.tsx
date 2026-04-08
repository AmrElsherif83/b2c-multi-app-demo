import { BrowserRouter } from 'react-router-dom';
import { AppConfigProvider } from './contexts/AppConfigContext';
import { AuthProvider }      from './contexts/AuthContext';
import { AppRoutes }         from './AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AppConfigProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AppConfigProvider>
    </BrowserRouter>
  );
}
