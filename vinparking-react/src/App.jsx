import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/layout/Navbar';
import Footer from './components/landing/Footer';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ContactPage from './pages/ContactPage';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/auth" replace />;
}

// Layout dùng chung Navbar + Footer (trang chủ, liên hệ, ...)
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
        {/* Các trang dùng Navbar + Footer chung */}
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

        {/* Trang auth: không cần Navbar/Footer */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Dashboard: có layout riêng (sidebar), không dùng Navbar/Footer */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } />

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