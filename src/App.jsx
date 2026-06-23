import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { hasRole, ROLES } from './utils/roleGuard';

import Navbar from './components/layout/Navbar';
import Footer from './components/landing/Footer';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import UserDashboardPage from './pages/UserDashboardPage';
import ContactPage from './pages/ContactPage';
import PricingPage from './pages/PricingPage';
import BookingPage from './pages/BookingPage';
import StaffEntryGate from './pages/staff/StaffEntryGate';
import StaffExitGate from './pages/staff/StaffExitGate';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

// RouteGuard based on Authentication and Roles
function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !hasRole(user.role, allowedRoles)) {
    return <Navigate to="/" replace />; // Redirect if not authorized
  }

  return children;
}

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '80vh' }}>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/locations" element={<PublicLayout><SearchPage /></PublicLayout>} />
          <Route path="/pricing" element={<PublicLayout><PricingPage /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
          <Route path="/auth" element={<AuthPage />} />

          {/* User Routes */}
          <Route path="/booking" element={
            <RoleRoute allowedRoles={[ROLES.USER, ROLES.MANAGER, ROLES.STAFF]}>
              <PublicLayout>
                <BookingPage />
              </PublicLayout>
            </RoleRoute>
          } />
          
          <Route path="/dashboard" element={
            <RoleRoute allowedRoles={[ROLES.USER, ROLES.MANAGER, ROLES.STAFF]}>
              <DashboardPage />
            </RoleRoute>
          } />

          <Route path="/user-dashboard" element={
            <RoleRoute allowedRoles={[ROLES.USER, ROLES.MANAGER, ROLES.STAFF]}>
              <UserDashboardPage />
            </RoleRoute>
          } />

          {/* Manager Routes */}
          <Route path="/manager-dashboard/*" element={
            <RoleRoute allowedRoles={[ROLES.MANAGER]}>
              <ManagerDashboardPage />
            </RoleRoute>
          } />

          {/* Staff Routes */}
          <Route path="/staff/entry" element={
            <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.MANAGER]}>
              <StaffEntryGate />
            </RoleRoute>
          } />
          <Route path="/staff/exit" element={
            <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.MANAGER]}>
              <StaffExitGate />
            </RoleRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          theme="dark"
          toastStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
