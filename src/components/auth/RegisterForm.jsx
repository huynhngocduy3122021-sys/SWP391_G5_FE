import { useState } from 'react';
import authApi from '../../api/authApi';
import { toast } from 'react-toastify';

export default function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({ name: '', emailOrPhone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    setLoading(true);
    let email = '';
    let phone = '';
    if (form.emailOrPhone.includes('@')) {
      email = form.emailOrPhone;
    } else {
      phone = form.emailOrPhone;
    }

    try {
      await authApi.register({
        userFullName: form.name, 
        userEmail: email,
        userPassword: form.password, 
        userPhone: phone, 
        userAddress: '',
      });
      toast.success('Đăng ký thành công! Hãy đăng nhập.');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data || 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="text-center mb-4">
        <h4 className="fw-bold" style={{ color: '#164e63' }}>Tạo tài khoản mới</h4>
        <p className="text-muted small">Tham gia cộng đồng đỗ xe thông minh</p>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold text-dark">Họ và Tên</label>
        <input type="text" className="form-control bg-light text-dark border-0"
          placeholder="Nhập họ và tên của bạn" value={form.name} onChange={set('name')} required />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold text-dark">Email/Số điện thoại</label>
        <input type="text" className="form-control bg-light text-dark border-0"
          placeholder="Địa chỉ email hoặc SĐT" value={form.emailOrPhone} onChange={set('emailOrPhone')} required />
      </div>

      <div className="row mb-3">
        <div className="col-6">
          <label className="form-label small fw-semibold text-dark">Mật khẩu</label>
          <div className="input-group">
            <input type={showPw ? 'text' : 'password'} className="form-control bg-light text-dark border-0"
              placeholder="••••••••" value={form.password} onChange={set('password')} required />
            <button type="button" className="btn bg-light border-0 text-muted" onClick={() => setShowPw(!showPw)}>
              {showPw ? '🔒' : '👁️'}
            </button>
          </div>
        </div>
        <div className="col-6">
          <label className="form-label small fw-semibold text-dark">Xác nhận mật khẩu</label>
          <div className="input-group">
            <input type={showConfirmPw ? 'text' : 'password'} className="form-control bg-light text-dark border-0"
              placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} required />
            <button type="button" className="btn bg-light border-0 text-muted" onClick={() => setShowConfirmPw(!showConfirmPw)}>
              {showConfirmPw ? '🔒' : '👁️'}
            </button>
          </div>
        </div>
      </div>

      <button type="submit" className="btn w-100 fw-bold mb-3" disabled={loading} style={{ backgroundColor: '#164e63', color: '#fff', padding: '10px' }}>
        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
        {loading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
      </button>

      <div className="text-center mb-4">
        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
          Bằng cách đăng ký, bạn đồng ý với <span className="text-decoration-underline" style={{ color: '#164e63', cursor: 'pointer' }}>Điều khoản</span> và <span className="text-decoration-underline" style={{ color: '#164e63', cursor: 'pointer' }}>Chính sách</span> của chúng tôi
        </small>
      </div>

      <div className="position-relative mb-4 text-center">
        <hr className="text-muted" />
        <span className="position-absolute top-50 start-50 translate-middle px-2 text-muted small" style={{ backgroundColor: '#fff', fontSize: '0.8rem' }}>
          Hoặc đăng ký bằng:
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
