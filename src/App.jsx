import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './shared/context/AuthContext';
import { useAuth } from './shared/hooks/useAuth';
import { hasRole, ROLES } from "./shared/utils/roleGuard";

// --- Layouts & Public Pages ---
import Navbar from './shared/components/Navbar';
import Footer from './modules/landing/components/Footer';
import LandingPage from './modules/landing/pages/LandingPage';
import SearchPage from './modules/search/pages/SearchPage';
import AuthPage from './modules/auth/pages/AuthPage';
import PricingPage from './modules/pricing/pages/PricingPage';
import PaymentResultPage from './modules/payment/pages/PaymentResultPage';
import NotFoundPage from './modules/not-found/pages/NotFoundPage';
import LostCardReportPage from './modules/lost-card/pages/LostCardReportPage';

// --- User, Manager & Staff Pages ---
import DashboardPage from './modules/user-dashboard/pages/DashboardPage';
import UserDashboardPage from './modules/user-dashboard/pages/UserDashboardPage';
import BookingPage from './modules/booking/pages/BookingPage';
import StaffEntryGate from './modules/staff/pages/StaffEntryGate';    
import StaffExitGate from './modules/staff/pages/StaffExitGate';
import StaffProfilePage from './modules/staff/pages/StaffProfilePage';
import ManagerDashboardPage from './modules/manager/pages/ManagerDashboardPage';

// --- Admin Portal Pages (MỚI THÊM) ---
import AdminLayout from './modules/admin/layout/AdminLayout';
import AdminDashboardPage from './modules/admin/pages/AdminDashboardPage';
import RevenueReportPage from './modules/admin/pages/RevenueReportPage';
import UserAccountsPage from './modules/admin/components/UserAccountsPage';
import SystemSettingsPage from './modules/admin/components/SystemSettingsPage';
import AIConfigPage from './modules/admin/components/AIConfigPage';

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
  useEffect(() => {
    const updateThemeColors = () => {
      const rawRole = (localStorage.getItem('role') || 'USER').toUpperCase();
      const fallback = {
        USER: { primary: '#125b71', accent: '#10b981', text: '#1e293b', textMuted: '#64748b', cardBg: '#ffffff', border: '#e2e8f0' },
        MANAGER: { primary: '#0f172a', accent: '#0d9488', text: '#0f172a', textMuted: '#64748b', cardBg: '#ffffff', border: '#cbd5e1' },
        STAFF: { primary: '#125b71', accent: '#0c4355', text: '#1e293b', textMuted: '#64748b', cardBg: '#ffffff', border: '#e2e8f0' },
        ADMIN: { primary: '#1b6eff', accent: '#10b981', text: '#1e293b', textMuted: '#64748b', cardBg: '#ffffff', border: '#cbd5e1' }
      };

      const currentRole = ['USER', 'MANAGER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(rawRole) 
        ? (rawRole === 'SUPER_ADMIN' ? 'ADMIN' : rawRole) 
        : 'USER';

      const primary = localStorage.getItem(`theme_${currentRole}_primary`) || fallback[currentRole].primary;
      const accent = localStorage.getItem(`theme_${currentRole}_accent`) || fallback[currentRole].accent;
      const text = localStorage.getItem(`theme_${currentRole}_text`) || fallback[currentRole].text;
      const textMuted = localStorage.getItem(`theme_${currentRole}_textMuted`) || fallback[currentRole].textMuted;
      const cardBg = localStorage.getItem(`theme_${currentRole}_cardBg`) || fallback[currentRole].cardBg;
      const border = localStorage.getItem(`theme_${currentRole}_border`) || fallback[currentRole].border;

      document.documentElement.style.setProperty('--vin-primary', primary);
      document.documentElement.style.setProperty('--vin-teal', primary);
      document.documentElement.style.setProperty('--vin-teal-hover', accent);
      document.documentElement.style.setProperty('--vin-indigo', primary);
      document.documentElement.style.setProperty('--vin-accent', accent);
      document.documentElement.style.setProperty('--vin-text-main', text);
      document.documentElement.style.setProperty('--vin-text-muted', textMuted);
      document.documentElement.style.setProperty('--vin-bg-card', cardBg);
      document.documentElement.style.setProperty('--vin-bg-glass', cardBg);
      document.documentElement.style.setProperty('--vin-border', border);
    };

    updateThemeColors();
    window.addEventListener('storage', updateThemeColors);
    window.addEventListener('themechange', updateThemeColors);
    return () => {
      window.removeEventListener('storage', updateThemeColors);
      window.removeEventListener('themechange', updateThemeColors);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/locations" element={<PublicLayout><SearchPage /></PublicLayout>} />
          <Route path="/pricing" element={<PublicLayout><PricingPage /></PublicLayout>} />
          <Route path="/payment-result" element={<PublicLayout><PaymentResultPage /></PublicLayout>} />
          <Route path="/lost-card-report" element={<PublicLayout><LostCardReportPage /></PublicLayout>} />
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
          <Route path="/staff/profile" element={
            <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.MANAGER]}>
              <StaffProfilePage />
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
            <Route path="revenue" element={<RevenueReportPage />} />
            <Route path="users" element={<UserAccountsPage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
            <Route path="ai-config" element={<AIConfigPage />} />
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
