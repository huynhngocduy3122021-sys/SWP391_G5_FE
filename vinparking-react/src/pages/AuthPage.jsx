import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotForm from '../components/auth/ForgotForm';

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const navigate = useNavigate();

  const handleLoginSuccess = () => navigate('/dashboard');
  const handleRegisterSuccess = () => setTab('login');

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100"
      style={{ background: '#0f172a' }}>

      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(168,85,247,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="rounded-4 p-4 p-md-5 position-relative" style={{ width: '100%', maxWidth: 440, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>

        {/* Back to home */}
        <a href="/" className="text-white-50 text-decoration-none small mb-4 d-inline-block">
          ← Về trang chủ
        </a>

        {/* Logo */}
        <div className="d-flex align-items-center gap-2 mb-4">
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <span className="fw-bold text-white fs-5">Vinparking</span>
        </div>

        {tab === 'forgot' ? (
          <ForgotForm onBack={() => setTab('login')} />
        ) : (
          <>
            {/* Tabs */}
            <div className="d-flex gap-0 mb-4 rounded-3 p-1"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              {['login', 'register'].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`btn flex-fill py-2 rounded-3 fw-semibold ${tab === t ? 'btn-primary' : 'text-white-50'}`}
                  style={{ fontSize: '0.9rem', background: tab === t ? undefined : 'transparent', border: 'none' }}>
                  {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>

            {tab === 'login'
              ? <LoginForm onSuccess={handleLoginSuccess} onForgot={() => setTab('forgot')} />
              : <RegisterForm onSuccess={handleRegisterSuccess} />
            }
          </>
        )}
      </div>
    </div>
  );
}
