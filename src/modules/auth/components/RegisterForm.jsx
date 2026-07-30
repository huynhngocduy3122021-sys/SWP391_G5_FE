// RegisterForm - Form đăng ký tài khoản mới, validate bằng Yup và gọi authApi
import { useState } from 'react';
import authApi from '../api/authApi';
import { toast } from 'react-toastify';

export default function RegisterForm({ onSuccess }) {
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(value.length - 1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-reg-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-reg-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 'register') {
      if (form.password !== form.confirmPassword) {
        toast.error('Mật khẩu xác nhận không khớp!');
        return;
      }
      setLoading(true);

      try {
        await authApi.register({
          userFullName: form.name, 
          userEmail: form.email,
          userPassword: form.password, 
          userPhone: form.phone, 
          userAddress: '',
        });
        toast.info('Vui lòng kiểm tra Email của bạn để lấy mã OTP!');
        setOtp(['', '', '', '', '', '']); // Reset mã OTP cũ nếu có
        setStep('otp');
      } catch (err) {
        toast.error(err.response?.data?.message || err.response?.data || 'Đăng ký thất bại!');
      } finally {
        setLoading(false);
      }
    } else if (step === 'otp') {
      const otpCode = otp.join('');
      if (otpCode.length < 6) return toast.warning('Vui lòng nhập đủ 6 số OTP!');
      
      setLoading(true);
      try {
        await authApi.verifyRegisterOtp({ 
          identifier: form.email, 
          otp: otpCode 
        });
        toast.success('Đăng ký thành công! Hãy đăng nhập.');
        onSuccess();
      } catch (err) {
        toast.error(err.response?.data?.message || err.response?.data || 'Mã OTP không chính xác!');
      } finally {
        setLoading(false);
      }
    }
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleSubmit}>
        <div className="text-center mb-4">
          <div className="mb-3">
            <div className="d-inline-flex align-items-center justify-content-center bg-light text-primary rounded-circle" style={{ width: 64, height: 64 }}>
              <i className="bi bi-envelope-check fs-1" style={{ color: '#164e63' }} />
            </div>
          </div>
          <h4 className="fw-bold" style={{ color: '#164e63' }}>Xác thực email</h4>
          <p className="text-muted small">Vui lòng nhập mã OTP gồm 6 chữ số để hoàn tất đăng ký.</p>
        </div>

        <div className="d-flex justify-content-center gap-2 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-input-reg-${index}`}
              type="text"
              inputMode="numeric"
              className="form-control text-center fw-bold fs-4 p-0"
              style={{ width: '45px', height: '55px', borderRadius: '8px' }}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              required
            />
          ))}
        </div>

        <button type="submit" className="btn w-100 fw-bold mb-3" disabled={loading} style={{ backgroundColor: '#164e63', color: '#fff', padding: '10px' }}>
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          {loading ? 'ĐANG XÁC THỰC...' : 'XÁC NHẬN'}
        </button>

        <div className="text-center">
          <button type="button" className="btn btn-link p-0 text-decoration-none small" style={{ color: '#64748b' }} onClick={() => setStep('register')} disabled={loading}>
            Quay lại chỉnh sửa thông tin
          </button>
        </div>
      </form>
    );
  }

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
        <label className="form-label small fw-semibold text-dark">Email</label>
        <input type="email" className="form-control bg-light text-dark border-0"
          placeholder="Nhập địa chỉ email" value={form.email} onChange={set('email')} required />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold text-dark">Số điện thoại</label>
        <input type="tel" className="form-control bg-light text-dark border-0"
          placeholder="Nhập số điện thoại" value={form.phone} onChange={set('phone')} required />
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


    </form>
  );
}
