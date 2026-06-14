import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotForm from '../components/auth/ForgotForm';

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const navigate = useNavigate();

   const handleLoginSuccess = () => navigate('/');
  const handleRegisterSuccess = () => setTab('login');

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100"
      style={{ background: '#0f172a' }}>

      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(168,85,247,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="rounded-3 p-0 position-relative shadow-lg overflow-hidden" style={{ width: '100%', maxWidth: 460, background: '#ffffff' }}>

        {/* Tabs */}
        <div className="d-flex w-100" style={{ borderBottom: '1px solid #e2e8f0' }}>
          {['login', 'register'].map((t) => (
            <button type="button" key={t} onClick={() => setTab(t)}
              className={`btn flex-fill rounded-0 fw-bold py-3 ${tab === t ? 'text-dark' : 'text-muted'}`}
              style={{ 
                fontSize: '1rem', 
                background: 'transparent', 
                border: 'none',
                borderBottom: tab === t ? '2px solid #164e63' : '2px solid transparent',
              }}>
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        <div className="p-4 p-md-5">
          {tab === 'forgot' ? (
            <ForgotForm onBack={() => setTab('login')} />
          ) : tab === 'login' ? (
            <LoginForm onSuccess={handleLoginSuccess} onForgot={() => setTab('forgot')} />
          ) : (
            <RegisterForm onSuccess={handleRegisterSuccess} />
          )}
        </div>
      </div>
    </div>
  );
}