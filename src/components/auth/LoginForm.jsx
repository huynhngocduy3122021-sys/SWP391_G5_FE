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
    }catch{
    // } catch (err) {
      // toast.error(err.response?.data || 'Đăng nhập thất bại!');
      // Mock token ở đây , tạm thời lấy lệnh dưới để check thử khi nào dùng thật thì dùng cái bên trên 
      localStorage.setItem('token', 'mock-token-123');
      localStorage.setItem('email', form.email);
      localStorage.setItem('role', 'USER');
      localStorage.setItem('fullName', form.email.split('@')[0]);
      localStorage.setItem('userId', '1');
      toast.success('Đăng nhập thành công! (mock)');
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="text-center mb-4">
        <h4 className="fw-bold" style={{ color: '#164e63' }}>Đăng nhập</h4>
        <p className="text-muted small">Chào mừng bạn quay lại hệ thống</p>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold text-dark">Email</label>
        <input type="email" className="form-control"
          placeholder="your@email.com" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div className="mb-3">
        <label className="form-label small fw-semibold text-dark">Mật khẩu</label>
        <div className="input-group">
          <input type={showPw ? 'text' : 'password'} className="form-control border-end-0"
            placeholder="••••••••" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
          <span className="input-group-text bg-white" style={{ cursor: 'pointer' }} onClick={() => setShowPw(!showPw)}>
            {showPw ? '🔒' : '👁️'}
          </span>
        </div>
      </div>
      <div className="mb-4 text-end">
        <button type="button" className="btn btn-link p-0 text-decoration-none small" style={{ color: '#1f6a85' }} onClick={onForgot}>
          Quên mật khẩu?
        </button>
      </div>
      <button type="submit" className="btn w-100 fw-bold mb-3" disabled={loading} style={{ backgroundColor: '#1f6a85', color: '#fff', padding: '10px' }}>
        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
        {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
      </button>

      <div className="position-relative mb-4 text-center mt-3">
        <hr className="text-muted" />
        <span className="position-absolute top-50 start-50 translate-middle px-2 text-muted small" style={{ backgroundColor: '#fff', fontSize: '0.8rem' }}>
          Hoặc đăng nhập bằng:
        </span>
      </div>

      <div className="d-flex gap-3">
        <button type="button" className="btn btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-2">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="18" height="18" />
          <span className="small text-dark fw-medium">Google</span>
        </button>
        <button type="button" className="btn btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-2">
          <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" width="18" height="18" />
          <span className="small text-dark fw-medium">Facebook</span>
        </button>
      </div>
    </form>
  );
}
