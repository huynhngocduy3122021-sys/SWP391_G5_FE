import { useState } from 'react';
import authApi from '../../api/authApi';
import { toast } from 'react-toastify';

export default function LoginForm({ onSuccess, onForgot }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login({ userEmail: form.email, userPassword: form.password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.userEmail);
      localStorage.setItem('role', data.userRole);
      localStorage.setItem('fullName', data.userFullName);
      localStorage.setItem('userId', data.userId);
      toast.success('Đăng nhập thành công!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label text-white-50 small">Email</label>
        <input type="email" className="form-control bg-transparent text-white border-secondary"
          placeholder="your@email.com" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div className="mb-3">
        <label className="form-label text-white-50 small">Mật khẩu</label>
        <div className="input-group">
          <input type={showPw ? 'text' : 'password'} className="form-control bg-transparent text-white border-secondary"
            placeholder="••••••••" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPw(!showPw)}>
            {showPw ? '🔒' : '👁️'}
          </button>
        </div>
      </div>
      <div className="mb-4 text-end">
        <button type="button" className="btn btn-link p-0 text-primary small" onClick={onForgot}>
          Quên mật khẩu?
        </button>
      </div>
      <button className="btn btn-primary w-100" onClick={handleSubmit} disabled={loading}>
        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </div>
  );
}
