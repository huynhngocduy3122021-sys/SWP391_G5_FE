// LoginForm - Form đăng nhập, validate bằng Yup và gọi authApi để xác thực người dùng
import { useState } from 'react';
import authApi from '../api/authApi';
import managerApi from '../../manager/api/manager';
import { toast } from 'react-toastify';

export default function LoginForm({ onSuccess, onForgot }) {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);



  const processLoginSuccess = async (data) => {
    try {
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.userEmail);
      localStorage.setItem('role', data.userRole);
      localStorage.setItem('fullName', data.userFullName);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('phone', data.userPhone || '');
      localStorage.setItem('userPhone', data.userPhone || '');
      localStorage.setItem('address', data.userAddress || '');
      localStorage.setItem('userAddress', data.userAddress || '');

      // Nếu là MANAGER: gọi thêm API getUserById để lấy parkingBranchId chính xác
      if (data.userRole?.toLowerCase() === 'manager' && data.userId) {
        try {
          const userDetail = await authApi.getUserById(data.userId);
          const branchId =
            userDetail?.parkingBranchId ||
            userDetail?.branchId ||
            userDetail?.parkingBranch?.parkingBranchId ||
            userDetail?.parkingBranch?.id ||
            userDetail?.branch?.id ||
            data.parkingBranchId ||
            '';
          const branchName =
            userDetail?.parkingBranchName ||
            userDetail?.branchName ||
            userDetail?.parkingBranch?.branchName ||
            userDetail?.parkingBranch?.parkingBranchName ||
            userDetail?.branch?.branchName ||
            data.parkingBranchName ||
            '';

          let finalBranchName = branchName;
          if (branchId && !finalBranchName) {
            try {
              const branch = await managerApi.getParkingBranchById(branchId);
              finalBranchName = branch?.branchName || branch?.parkingBranchName || '';
            } catch (_) { /* ignore */ }
          }

          localStorage.setItem('parkingBranchId', branchId ? String(branchId) : '');
          if (branchId) localStorage.setItem('branchId', String(branchId));
          else localStorage.removeItem('branchId');
          localStorage.setItem('parkingBranchName', finalBranchName);
        } catch (err) {
          console.warn('Không thể lấy thông tin chi nhánh manager:', err);
          localStorage.setItem('parkingBranchId', data.parkingBranchId ? String(data.parkingBranchId) : '');
          if (data.parkingBranchId) localStorage.setItem('branchId', data.parkingBranchId);
          else localStorage.removeItem('branchId');
          localStorage.setItem('parkingBranchName', data.parkingBranchName || '');
        }
      } else {
        localStorage.setItem('parkingBranchId', data.parkingBranchId ? String(data.parkingBranchId) : '');
        if (data.parkingBranchId) localStorage.setItem('branchId', data.parkingBranchId);
        else localStorage.removeItem('branchId');
        localStorage.setItem('parkingBranchName', data.parkingBranchName || '');
      }
      toast.success('Đăng nhập thành công!');
      onSuccess(data);
    } catch (err) {
      toast.error('Có lỗi trong quá trình xử lý dữ liệu đăng nhập!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login({ identifier: form.identifier, userPassword: form.password });
      processLoginSuccess(data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || 'Đăng nhập thất bại!';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Đăng nhập thất bại!');
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
        <label className="form-label small fw-semibold text-dark">Email / Số điện thoại</label>
        <input type="text" className="form-control"
          placeholder="Nhập email hoặc số điện thoại" value={form.identifier}
          onChange={e => setForm({ ...form, identifier: e.target.value })} required />
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
        {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
      </button>
    </form>
  );
}
