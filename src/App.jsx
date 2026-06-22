import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import ManagerDashboardPage from './components/manager/ManagerDashboardPage';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/auth" replace />;
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
      <Routes>
        {/* Trang chủ là LandingPage */}
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/locations" element={<PublicLayout><SearchPage /></PublicLayout>} />
        <Route path="/pricing" element={<PublicLayout><PricingPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
        <Route path="/auth" element={<AuthPage />} />

        <Route path="/booking" element={
          <PrivateRoute>
            <PublicLayout>
              <BookingPage />
            </PublicLayout>
          </PrivateRoute>
        } />

        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } />

        <Route path="/user-dashboard" element={
          <PrivateRoute>
            <UserDashboardPage />
          </PrivateRoute>
        } />

        <Route path="/manager-dashboard" element={
          <PrivateRoute>
            <ManagerDashboardPage />
          </PrivateRoute>
        } />

        <Route path="/staff/entry" element={<StaffEntryGate />} />
        <Route path="/staff/exit" element={<StaffExitGate />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        theme="dark"
        toastStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
      />
    </BrowserRouter>
  );
}