import { useState } from 'react';
import { toast } from 'react-toastify';

export default function ProfileSection() {
  const initialFullName = localStorage.getItem('fullName') || '';
  const initialEmail = localStorage.getItem('email') || '';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initialFullName)}&background=164e63&color=fff&size=128`;
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: initialFullName,
    email: initialEmail,
    phone: localStorage.getItem('phone') || '',
    apartment: localStorage.getItem('apartment') || '',
    address: localStorage.getItem('address') || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    localStorage.setItem('fullName', formData.fullName);
    localStorage.setItem('phone', formData.phone);
    localStorage.setItem('apartment', formData.apartment);
    localStorage.setItem('address', formData.address);
    
    setIsEditing(false);
    toast.success('Cập nhật thông tin thành công!');
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleCancel = () => {
    setFormData({
      fullName: localStorage.getItem('fullName') || '',
      email: localStorage.getItem('email') || '',
      phone: localStorage.getItem('phone') || '',
      apartment: localStorage.getItem('apartment') || '',
      address: localStorage.getItem('address') || ''
    });
    setIsEditing(false);
  };

  return (
    <div>
      {/* Top Banner Card */}
      <div className="card border-0 shadow-sm p-4 rounded-4 mb-4" style={{ background: '#ffffff' }}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-4">
            <div className="rounded-4 overflow-hidden shadow-sm" style={{ width: '100px', height: '100px' }}>
              <img src={avatarUrl} alt="Avatar" className="w-100 h-100 object-fit-cover" />
            </div>
            <div>
              <h4 className="fw-bold text-dark mb-1">{formData.fullName}</h4>
              <p className="text-muted mb-2">{formData.apartment ? `Cư dân ${formData.apartment}` : 'Cư dân Vinparking'} - {formData.address || 'Hệ thống'}</p>
              <div className="d-flex gap-2">
                <span className="badge rounded-pill bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-3 py-2 fw-medium">
                  ⭐ Tài khoản Gold
                </span>
                <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-3 py-2 fw-medium">
                  📅 Thành viên từ 2023
                </span>
              </div>
            </div>
          </div>
          <button className="btn fw-bold px-4 rounded-pill" style={{ backgroundColor: '#164e63', color: '#fff' }}>
            Chỉnh sửa ảnh
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Cột Trái (Thông tin, Bảo mật, Xóa) */}
        <div className="col-lg-7">
          {/* Thông tin cá nhân */}
          <div className="card border-0 shadow-sm p-4 rounded-4 mb-4" style={{ background: '#ffffff' }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h6 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                <span className="text-info fs-5">👤</span> Thông tin cá nhân
              </h6>
              {isEditing ? (
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary btn-sm fw-bold" onClick={handleCancel}>Hủy</button>
                  <button className="btn btn-sm fw-bold text-white" style={{ backgroundColor: '#164e63' }} onClick={handleSave}>Lưu thông tin</button>
                </div>
              ) : (
                <button className="btn btn-link text-decoration-none fw-bold p-0" style={{ color: '#164e63' }} onClick={() => setIsEditing(true)}>Cập nhật</button>
              )}
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label small text-muted fw-medium mb-1">Họ và Tên</label>
                <input type="text" name="fullName" className={`form-control ${isEditing ? '' : 'bg-light border-0'}`} value={formData.fullName} onChange={handleChange} readOnly={!isEditing} />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted fw-medium mb-1">Địa chỉ Email</label>
                <input type="email" name="email" className="form-control bg-light border-0" value={formData.email} readOnly />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted fw-medium mb-1">Số điện thoại</label>
                <input type="text" name="phone" className={`form-control ${isEditing ? '' : 'bg-light border-0'}`} value={formData.phone} onChange={handleChange} placeholder="Chưa cập nhật" readOnly={!isEditing} />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted fw-medium mb-1">Mã căn hộ (Apartment ID)</label>
                <input type="text" name="apartment" className={`form-control ${isEditing ? '' : 'bg-light border-0'}`} value={formData.apartment} onChange={handleChange} placeholder="Chưa cập nhật" readOnly={!isEditing} />
              </div>
              <div className="col-12">
                <label className="form-label small text-muted fw-medium mb-1">Địa chỉ thường trú</label>
                <textarea name="address" rows="2" className={`form-control ${isEditing ? '' : 'bg-light border-0'}`} value={formData.address} onChange={handleChange} placeholder="Chưa cập nhật" readOnly={!isEditing}></textarea>
              </div>
            </div>
          </div>

          {/* Bảo mật & Tài khoản */}
          <div className="card border-0 shadow-sm p-4 rounded-4 mb-4" style={{ background: '#ffffff' }}>
            <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
              <span className="text-info fs-5">🛡️</span> Bảo mật & Tài khoản
            </h6>
            
            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
              <div className="d-flex align-items-start gap-3">
                <span className="fs-5 text-muted mt-1">🔒</span>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Mật khẩu</h6>
                  <p className="text-muted small m-0">Thay đổi lần cuối: 3 tháng trước</p>
                </div>
              </div>
              <button className="btn btn-outline-secondary btn-sm fw-bold">Đổi mật khẩu</button>
            </div>

            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
              <div className="d-flex align-items-start gap-3">
                <span className="fs-5 text-muted mt-1">✓</span>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Xác thực 2 yếu tố (2FA)</h6>
                  <p className="text-muted small m-0">Tăng cường bảo mật cho tài khoản của bạn</p>
                </div>
              </div>
              <div className="form-check form-switch fs-4 m-0">
                <input className="form-check-input cursor-pointer" type="checkbox" defaultChecked />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center pt-3">
              <div className="d-flex align-items-start gap-3">
                <span className="fs-5 text-muted mt-1">📱</span>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Phiên đăng nhập</h6>
                  <p className="text-muted small m-0">Đang đăng nhập trên 2 thiết bị</p>
                </div>
              </div>
              <button className="btn btn-link text-danger text-decoration-none small fw-bold p-0">Đăng xuất từ xa</button>
            </div>
          </div>

          {/* Khu vực rủi ro */}
          <div className="card border border-danger border-opacity-25 shadow-sm p-4 rounded-4" style={{ background: '#fffcfc' }}>
            <h6 className="fw-bold text-danger mb-2">Khu vực rủi ro</h6>
            <div className="d-flex justify-content-between align-items-center">
              <p className="text-danger opacity-75 small m-0">Yêu cầu xóa tài khoản và dữ liệu cá nhân khỏi hệ thống Vinparking.</p>
              <button className="btn btn-danger btn-sm fw-bold px-3">Xóa tài khoản</button>
            </div>
          </div>
        </div>

        {/* Cột Phải (Thẻ, Hoạt động) */}
        <div className="col-lg-5">
          {/* Trạng thái thẻ */}
          <div className="card border-0 shadow-sm p-4 rounded-4 mb-4" style={{ background: '#ffffff' }}>
            <h6 className="fw-bold text-dark text-uppercase mb-3 small" style={{ letterSpacing: '1px' }}>Trạng thái thẻ</h6>
            
            <div className="rounded-4 p-4 text-white mb-4 position-relative overflow-hidden" style={{ background: '#164e63', minHeight: '180px' }}>
              {/* Card visual elements */}
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <h5 className="fw-bold m-0" style={{ letterSpacing: '1px' }}>Vinparking</h5>
                <span className="fs-5">📡</span>
              </div>
              <div className="mt-4">
                <p className="small mb-1 opacity-75" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>CARD HOLDER</p>
                <h6 className="fw-bold mb-3 text-uppercase">{formData.fullName || 'RESIDENT'}</h6>
                <p className="small mb-0 opacity-75" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>CARD NUMBER</p>
                <h5 className="fw-bold m-0" style={{ letterSpacing: '3px' }}>•••• •••• 8868</h5>
              </div>
            </div>

            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted small">Loại thẻ:</span>
              <span className="fw-bold" style={{ color: '#164e63' }}>Thẻ Cư dân Gold</span>
            </div>
            <div className="d-flex justify-content-between mb-4">
              <span className="text-muted small">Hạn dùng:</span>
              <span className="fw-bold text-dark">31/12/2024</span>
            </div>
            
            <div className="progress" style={{ height: '6px' }}>
              <div className="progress-bar" role="progressbar" style={{ width: '75%', backgroundColor: '#164e63' }} aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <p className="text-center text-muted mt-2 mb-0" style={{ fontSize: '0.7rem' }}>75% thời hạn sử dụng</p>
          </div>

          {/* Hoạt động gần đây */}
          <div className="card border-0 shadow-sm p-4 rounded-4" style={{ background: '#ffffff' }}>
            <h6 className="fw-bold text-dark text-uppercase mb-4 small" style={{ letterSpacing: '1px' }}>Hoạt động gần đây</h6>
            
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-start gap-3">
                <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                  →
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1 fs-6">Cổng S2.05 - Vào</h6>
                  <p className="text-muted small m-0">Hôm nay, 08:34 SA</p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="bg-secondary bg-opacity-10 text-secondary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                  💳
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1 fs-6">Gia hạn gói cước ô tô</h6>
                  <p className="text-muted small m-0">Hôm qua, 14:15 CH</p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="bg-light text-muted border rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                  ←
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1 fs-6">Cổng S1.03 - Ra</h6>
                  <p className="text-muted small m-0">20/05/2024, 18:40 CH</p>
                </div>
              </div>
            </div>

            <button className="btn btn-link text-decoration-none w-100 mt-4 fw-bold p-0" style={{ color: '#164e63' }}>
              Xem toàn bộ lịch sử
            </button>
           </div>
        </div>
      </div>
    </div>
  );
}
