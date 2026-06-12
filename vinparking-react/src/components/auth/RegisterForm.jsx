import { useState } from 'react';
import authApi from '../../api/authApi';
import { toast } from 'react-toastify';

export default function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register({
        userFullName: form.name, userEmail: form.email,
        userPassword: form.password, userPhone: form.phone, userAddress: form.address,
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
    <div onSubmit={handleSubmit}>
      {[
        { label: 'Họ và tên', field: 'name', type: 'text', placeholder: 'Nguyễn Văn A' },
        { label: 'Email', field: 'email', type: 'email', placeholder: 'your@email.com' },
        { label: 'Mật khẩu', field: 'password', type: 'password', placeholder: '••••••••' },
        { label: 'Số điện thoại', field: 'phone', type: 'tel', placeholder: '0901234567' },
        { label: 'Địa chỉ', field: 'address', type: 'text', placeholder: 'Quận 1, TP.HCM' },
      ].map(({ label, field, type, placeholder }) => (
        <div className="mb-3" key={field}>
          <label className="form-label text-white-50 small">{label}</label>
          <input type={type} className="form-control bg-transparent text-white border-secondary"
            placeholder={placeholder} value={form[field]} onChange={set(field)} required />
        </div>
      ))}
      <button className="btn btn-primary w-100 mt-1" onClick={handleSubmit} disabled={loading}>
        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
        {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
      </button>
    </div>
  );
}
