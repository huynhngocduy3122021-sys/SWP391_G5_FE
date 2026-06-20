import { useState } from 'react';
import authApi from '../../api/authApi';
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
      toast.error(err.response?.data || 'Lỗi đặt lại mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button type="button" className="btn btn-link p-0 text-white-50 mb-4 small" onClick={onBack}>
        ← Quay lại đăng nhập
      </button>
      <h5 className="text-white fw-bold mb-1">Quên mật khẩu</h5>
      <p className="text-white-50 small mb-4">Nhập thông tin để đặt lại mật khẩu của bạn.</p>
      {[
        { label: 'Email / Số điện thoại', field: 'emailOrPhone', type: 'text' },
        { label: 'Mật khẩu mới', field: 'newPassword', type: 'password' },
        { label: 'Xác nhận mật khẩu', field: 'confirmPassword', type: 'password' },
      ].map(({ label, field, type }) => (
        <div className="mb-3" key={field}>
          <label className="form-label text-white-50 small">{label}</label>
          <input type={type} className="form-control bg-transparent text-white border-secondary"
            value={form[field]} onChange={set(field)} required />
        </div>
      ))}
      <button className="btn btn-primary w-100" onClick={handleSubmit} disabled={loading}>
        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
        Đặt lại mật khẩu
      </button>
    </div>
  );
}
