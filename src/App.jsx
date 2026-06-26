import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { hasRole, ROLES } from './utils/roleGuard';

// --- Layouts & Public Pages ---
import Navbar from './components/layout/Navbar';
import Footer from './components/landing/Footer';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import AuthPage from './pages/AuthPage';
import ContactPage from './pages/ContactPage';
import PricingPage from './pages/PricingPage';
import NotFoundPage from './pages/NotFoundPage';

// --- User, Manager & Staff Pages ---
import DashboardPage from './pages/DashboardPage';
import UserDashboardPage from './pages/UserDashboardPage';
import BookingPage from './pages/BookingPage';
import StaffEntryGate from './pages/staff/StaffEntryGate';    
import StaffExitGate from './pages/staff/StaffExitGate';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';

// --- Admin Portal Pages (MỚI THÊM) ---
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import SystemLogsPage from './components/admin/SystemLogsPage';
import PermissionsPage from './components/admin/PermissionsPage';
import UserAccountsPage from './components/admin/UserAccountsPage';
import SystemSettingsPage from './components/admin/SystemSettingsPage';
import PaymentsPage from './components/admin/PaymentsPage';
import AIConfigPage from './components/admin/AIConfigPage';

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
              <BookingPage />
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

          {/* --- ADMIN PORTAL ROUTES (MỚI THÊM) --- */}
          <Route path="/admin" element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
              <AdminLayout />
            </RoleRoute>
          }>
            {/* Các route con của Admin */}
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<UserAccountsPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="ai-config" element={<AIConfigPage />} />
            <Route path="logs" element={<SystemLogsPage />} />
          </Route>

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