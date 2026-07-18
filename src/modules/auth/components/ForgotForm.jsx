// ForgotForm - Form yêu cầu khôi phục mật khẩu, gọi authApi
import { useState } from 'react';
import authApi from '../api/authApi';
import { toast } from 'react-toastify';

export default function ForgotForm({ onBack }) {
  const [form, setForm] = useState({ emailOrPhone: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return toast.warning('Mật khẩu xác nhận không khớp!');
    }
    setLoading(true);
    try {
      await authApi.resetPassword(form);
      toast.success('Đặt lại mật khẩu thành công!');
      onBack();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data;
      toast.error(typeof msg === 'string' ? msg : 'Lỗi đặt lại mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        type="button" 
        className="btn btn-link p-0 text-decoration-none mb-4 small" 
        onClick={onBack}
        style={{ color: '#1f6a85' }}
      >
        ← Quay lại đăng nhập
      </button>
      <h4 className="fw-bold mb-1" style={{ color: '#164e63' }}>Quên mật khẩu</h4>
      <p className="text-muted small mb-4">Nhập thông tin để đặt lại mật khẩu của bạn.</p>
      {[
        { label: 'Email / Số điện thoại', field: 'emailOrPhone', type: 'text', placeholder: 'Nhập email hoặc số điện thoại' },
        { label: 'Mật khẩu mới', field: 'newPassword', type: 'password', placeholder: '••••••••' },
        { label: 'Xác nhận mật khẩu', field: 'confirmPassword', type: 'password', placeholder: '••••••••' },
      ].map(({ label, field, type, placeholder }) => (
        <div className="mb-3" key={field}>
          <label className="form-label small fw-semibold text-dark">{label}</label>
          <input 
            type={type} 
            className="form-control"
            placeholder={placeholder}
            value={form[field]} 
            onChange={set(field)} 
            required 
          />
        </div>
      ))}
      <button 
        className="btn w-100 fw-bold mb-3" 
        onClick={handleSubmit} 
        disabled={loading}
        style={{ backgroundColor: '#1f6a85', color: '#fff', padding: '10px' }}
      >
        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
        Đặt lại mật khẩu
      </button>
    </div>
  );
}
