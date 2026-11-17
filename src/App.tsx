import { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Spinner from './components/ui/Spinner';
import AppErrorBoundary from './components/AppErrorBoundary';
import { lazyPage } from './utils/lazyPage';

// Lazy loaded pages; a page file missing after a deploy reloads the app once
const Login = lazyPage(() => import('./pages/Login'));
const Signup = lazyPage(() => import('./pages/Signup'));
const Dashboard = lazyPage(() => import('./pages/Dashboard'));
const Transactions = lazyPage(() => import('./pages/Transactions'));
const NewTransaction = lazyPage(() => import('./pages/NewTransaction'));
const Reports = lazyPage(() => import('./pages/Reports'));
const Profile = lazyPage(() => import('./pages/Profile'));
const NotFound = lazyPage(() => import('./pages/NotFound'));
const Offline = lazyPage(() => import('./pages/Offline'));
const Budgets = lazyPage(() => import('./pages/Budgets'));
const RecurringPayments = lazyPage(() => import('./pages/RecurringPayments'));
const Manual = lazyPage(() => import('./pages/Manual'));

const App = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  // Only the initial session check blocks the app; a login in progress does not
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const initializeTheme = useUIStore((state) => state.initializeTheme);

  useEffect(() => {
    checkAuth();
    initializeTheme();
  }, [checkAuth, initializeTheme]);

  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <AppErrorBoundary>
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <Spinner size="large" />
      </div>
    }>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/offline" element={<Offline />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/new" element={<NewTransaction />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/recurring-payments" element={<RecurringPayments />} />
          <Route path="/manual" element={<Manual />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
    </AppErrorBoundary>
  );
};

export default App;