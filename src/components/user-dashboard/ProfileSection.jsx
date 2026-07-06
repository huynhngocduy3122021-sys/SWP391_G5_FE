import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import authApi from '../../api/authApi';
import parkingApi from '../../api/parkingApi';

export default function ProfileSection() {
  const userId = localStorage.getItem('userId');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: localStorage.getItem('fullName') || '',
    email: localStorage.getItem('email') || '',
    phone: localStorage.getItem('phone') || localStorage.getItem('userPhone') || '',
    apartment: localStorage.getItem('apartment') || '',
    address: localStorage.getItem('address') || localStorage.getItem('userAddress') || ''
  });

  const [vehicles, setVehicles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [residentCard, setResidentCard] = useState(null); // thẻ VIP hoặc thẻ tháng đang hiệu lực
  const [rawTickets, setRawTickets] = useState([]);

  // Password change states
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [submittingPw, setSubmittingPw] = useState(false);

  const loadProfileAndData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Get user profile details
      const profile = await authApi.getUserById(userId);
      const email = localStorage.getItem('email');

      const nextProfile = {
        fullName: profile.userFullName || localStorage.getItem('fullName') || '',
        email: profile.userEmail || email || '',
        phone: profile.userPhone || localStorage.getItem('phone') || localStorage.getItem('userPhone') || '',
        apartment: localStorage.getItem('apartment') || '',
        address: profile.userAddress || localStorage.getItem('address') || localStorage.getItem('userAddress') || ''
      };

      localStorage.setItem('fullName', nextProfile.fullName);
      localStorage.setItem('email', nextProfile.email);
      localStorage.setItem('phone', nextProfile.phone);
      localStorage.setItem('userPhone', nextProfile.phone);
      localStorage.setItem('address', nextProfile.address);
      localStorage.setItem('userAddress', nextProfile.address);

      setFormData(nextProfile);

      // 2. Load user's vehicles
      const allVehicles = await parkingApi.getAllVehicles();
      const userVehicles = Array.isArray(allVehicles)
        ? allVehicles.filter(v => String(v.userId) === String(userId) && !v.deleted)
        : [];
      setVehicles(userVehicles);

      // 3. Load user's recent sessions (tách try-catch riêng, lỗi không ảnh hưởng bước tiếp theo)
      try {
        const allSessions = await parkingApi.getAllSessions();
        const sessionsList = Array.isArray(allSessions) ? allSessions : (allSessions?.content || []);

        const userPlates = userVehicles.map(v => v.licensePlate.toUpperCase());
        const filteredSessions = sessionsList.filter(s =>
          userPlates.includes(s.licensePlate?.toUpperCase())
        );

        const sortedSessions = filteredSessions
          .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
          .slice(0, 3);
        setActivities(sortedSessions);
      } catch (sessionErr) {
        console.warn('Không thể tải lịch sử đỗ xe (bỏ qua để tiếp tục):', sessionErr?.response?.status, sessionErr?.message);
        setActivities([]);
      }


      // 4. Lấy thẻ VIP / thẻ tháng của user từ API monthly-tickets/my-tickets
      try {
        console.log('--- CURRENT LOGGED-IN USER ID ---', userId);
        const myTickets = await parkingApi.getMyMonthlyTickets();
        console.log('--- getMyMonthlyTickets RAW RESPONSE ---', myTickets);
        const ticketsList = Array.isArray(myTickets) ? myTickets : (myTickets?.content || myTickets?.data || []);
        setRawTickets(ticketsList);

        // Trạng thái hợp lệ: trống (0 / 'AVAILABLE' / 'EMPTY') hoặc đang dùng (1 / 'IN_USE' / 'ACTIVE' / true)
        const isValidStatus = (status) => {
          if (status === 0 || status === 'AVAILABLE' || status === 'EMPTY' || status === 'INACTIVE') return true;
          if (status === 1 || status === true || status === 'IN_USE' || status === 'ACTIVE') return true;
          return false;
        };

        // Lọc tất cả thẻ VIP / thẻ tháng thuộc user có trạng thái hợp lệ
        const matchedCards = ticketsList.filter(t => {
          const cardCode = t.cardCode || t.parkingCard?.cardCode || '';
          const isVipOrMonthly = cardCode.startsWith('VIP-') || cardCode.startsWith('MONTH-');
          const isNotExpired = !t.endDate || new Date(t.endDate) >= new Date();
          console.log(`[DEBUG] Filtering card ${cardCode}:`, {
            isVipOrMonthly,
            status: t.status,
            isValidStatus: isValidStatus(t.status),
            endDate: t.endDate,
            isNotExpired
          });
          return isVipOrMonthly && isValidStatus(t.status) && isNotExpired;
        });
        console.log('--- MATCHED CARDS ---', matchedCards);

        // Ưu tiên thẻ đang dùng (status 1/true/IN_USE/ACTIVE) trước, rồi đến thẻ trống
        const isInUse = (status) =>
          status === 1 || status === true || status === 'IN_USE' || status === 'ACTIVE';

        const sorted = [...matchedCards].sort((a, b) => {
          const aInUse = isInUse(a.status) ? 0 : 1;
          const bInUse = isInUse(b.status) ? 0 : 1;
          return aInUse - bInUse;
        });

        setResidentCard(sorted[0] || null);
      } catch (cardErr) {
        console.warn('Không thể tải thẻ giữ xe :', cardErr);
        setResidentCard(null);
      }
    } catch (err) {
      console.error("Failed to load user profile details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileAndData();
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        await authApi.updateUser(userId, {
          userFullName: formData.fullName,
          userEmail: formData.email,
          userPhone: formData.phone,
          userAddress: formData.address
        });
      }

      localStorage.setItem('fullName', formData.fullName);
      localStorage.setItem('email', formData.email);
      localStorage.setItem('phone', formData.phone);
      localStorage.setItem('userPhone', formData.phone);
      localStorage.setItem('apartment', formData.apartment);
      localStorage.setItem('address', formData.address);
      localStorage.setItem('userAddress', formData.address);

      setIsEditing(false);
      toast.success('Cập nhật thông tin thành công!');
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error("Save profile error:", err);
      const msg = err.response?.data?.message || err.response?.data || 'Cập nhật thông tin thất bại!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối!');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: localStorage.getItem('fullName') || '',
      email: localStorage.getItem('email') || '',
      phone: localStorage.getItem('phone') || localStorage.getItem('userPhone') || '',
      apartment: localStorage.getItem('apartment') || '',
      address: localStorage.getItem('address') || localStorage.getItem('userAddress') || ''
    });
    loadProfileAndData();
    setIsEditing(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.warning("Mật khẩu mới và xác nhận mật khẩu không khớp!");
    }
    setSubmittingPw(true);
    try {
      await authApi.changePassword(userId, pwForm);
      toast.success("Thay đổi mật khẩu thành công!");
      setShowPwModal(false);
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error("Change password error:", err);
      const msg = err.response?.data?.message || err.response?.data || 'Đổi mật khẩu thất bại!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối server!');
    } finally {
      setSubmittingPw(false);
    }
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'User')}&background=164e63&color=fff&size=128`;

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '300px' }}>
        <div className="spinner-border" style={{ color: '#164e63' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

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
              <h4 className="fw-bold text-dark mb-1">{formData.fullName} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal' }}>(ID: {userId})</span></h4>
              <p className="text-muted mb-2">{formData.email} • {formData.apartment ? `Thành viên căn hộ ${formData.apartment}` : 'Khách hàng Vinparking'} - {formData.address || 'Hệ thống'}</p>
              <div className="d-flex gap-2">
                <span className="badge rounded-pill bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-3 py-2 fw-medium">
                  ⭐ Tài khoản Khách hàng / Cư dân
                </span>
                <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-3 py-2 fw-medium">
                  🚗 {vehicles.length} Phương tiện đăng ký
                </span>
              </div>
            </div>
          </div>
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
                  <button className="btn btn-outline-secondary btn-sm fw-bold" onClick={handleCancel} disabled={saving}>Hủy</button>
                  <button className="btn btn-sm fw-bold text-white" style={{ backgroundColor: '#164e63' }} onClick={handleSave} disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
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
                  <p className="text-muted small m-0">Thay đổi mật khẩu đăng nhập vào bãi đỗ xe</p>
                </div>
              </div>
              <button className="btn btn-outline-secondary btn-sm fw-bold" onClick={() => setShowPwModal(true)}>Đổi mật khẩu</button>
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
          </div>
        </div>

        {/* Cột Phải (Thẻ, Hoạt động) */}
        <div className="col-lg-5">
          {/* Trạng thái thẻ */}
          <div className="card border-0 shadow-sm p-4 rounded-4 mb-4" style={{ background: '#ffffff' }}>
            <h6 className="fw-bold text-dark text-uppercase mb-3 small" style={{ letterSpacing: '1px' }}>Thông tin thẻ giữ xe</h6>
            {residentCard ? (() => {
              const cardCode = residentCard.cardCode || residentCard.parkingCard?.cardCode || '';
              const isVip = cardCode.startsWith('VIP-');
              const cardBg = isVip
                ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                : 'linear-gradient(135deg, #164e63 0%, #0e7490 100%)';
              const cardLabel = isVip ? '👑 Thẻ VIP ' : '📅 Thẻ Tháng';
              const expiryStr = residentCard.endDate
                ? new Date(residentCard.endDate).toLocaleDateString('vi-VN')
                : 'Vô thời hạn';
              const startStr = residentCard.startDate
                ? new Date(residentCard.startDate).toLocaleDateString('vi-VN')
                : '—';

              // Xác định trạng thái hiển thị từ API
              const st = residentCard.status;
              const isInUse = st === 1 || st === true || st === 'IN_USE' || st === 'ACTIVE';
              const statusBadge = isInUse
                ? { bg: '#dcfce7', color: '#166534', text: '✓ Đang hoạt động' }
                : { bg: '#eff6ff', color: '#1d4ed8', text: '○ Trống / Sẵn sàng' };

              return (
                <>
                  <div className="rounded-4 p-4 text-white mb-4 position-relative overflow-hidden" style={{ background: cardBg, minHeight: '180px' }}>
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }}></div>
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <h5 className="fw-bold m-0" style={{ letterSpacing: '1px' }}>Vinparking</h5>
                      <span className="badge rounded-pill" style={{ background: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', letterSpacing: '1px', padding: '4px 10px' }}>
                        {isVip ? 'VIP-MALL' : 'MONTHLY-MALL'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="small mb-1 opacity-75" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>CARD HOLDER</p>
                      <h6 className="fw-bold mb-3 text-uppercase">{residentCard.guestName || formData.fullName || 'CUSTOMER'}</h6>
                      <p className="small mb-0 opacity-75" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>CARD CODE</p>
                      <h5 className="fw-bold m-0" style={{ letterSpacing: '2px', fontSize: '0.95rem' }}>{cardCode}</h5>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Loại thẻ:</span>
                    <span className="fw-bold" style={{ color: isVip ? '#7c3aed' : '#164e63' }}>{cardLabel}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Ngày bắt đầu:</span>
                    <span className="fw-bold text-dark">{startStr}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Hết hạn:</span>
                    <span className="fw-bold" style={{ color: '#164e63' }}>{expiryStr}</span>
                  </div>
                  {residentCard.guestPhone && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted small">SĐT liên kết:</span>
                      <span className="fw-bold text-dark">{residentCard.guestPhone}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Trạng thái:</span>
                    <span className="badge rounded-pill fw-semibold"
                      style={{ background: statusBadge.bg, color: statusBadge.color, fontSize: '0.75rem' }}>
                      {statusBadge.text}
                    </span>
                  </div>
                </>
              );
            })() : (
              <>
                <div className="rounded-4 p-4 text-white mb-4 position-relative overflow-hidden" style={{ background: '#94a3b8', minHeight: '180px' }}>
                  <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <h5 className="fw-bold m-0" style={{ letterSpacing: '1px' }}>Vinparking</h5>
                    <span className="fs-5">📡</span>
                  </div>
                  <div className="mt-4">
                    <p className="small mb-1 opacity-75" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>CARD HOLDER</p>
                    <h6 className="fw-bold mb-3 text-uppercase">{formData.fullName || 'CUSTOMER'}</h6>
                    <p className="small mb-0 opacity-75" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>CARD CODE</p>
                    <h5 className="fw-bold m-0" style={{ letterSpacing: '2px', fontSize: '0.85rem' }}>— CHƯA KÍCH HOẠT —</h5>
                  </div>
                </div>

                <div className="rounded-3 p-3 mb-2" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <div className="d-flex align-items-start gap-2">
                    <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                    <div>
                      <p className="fw-semibold mb-1" style={{ color: '#c2410c', fontSize: '0.85rem' }}>Bạn chưa có thẻ giữ xe</p>
                      <p className="text-muted m-0" style={{ fontSize: '0.78rem' }}>
                        Vui lòng liên hệ quản lý bãi đỗ xe hoặc đến quầy dịch vụ khách hàng tại ban quản lý để đăng ký thẻ đỗ xe và nhận ưu đãi.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Hoạt động gần đây */}
          <div className="card border-0 shadow-sm p-4 rounded-4" style={{ background: '#ffffff' }}>
            <h6 className="fw-bold text-dark text-uppercase mb-4 small" style={{ letterSpacing: '1px' }}>Lịch sử đỗ xe gần đây</h6>

            <div className="d-flex flex-column gap-3">
              {activities.length === 0 ? (
                <p className="text-muted small text-center my-4">Chưa có hoạt động gửi xe nào gần đây.</p>
              ) : (
                activities.map((act) => {
                  const isCheckIn = act.sessionStatus === 'ACTIVE' || !act.checkOutTime;
                  const timeStr = new Date(isCheckIn ? act.checkInTime : act.checkOutTime).toLocaleString('vi-VN', {
                    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                  });
                  return (
                    <div className="d-flex align-items-start gap-3" key={act.parkingSessionId}>
                      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: isCheckIn ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                          color: isCheckIn ? '#22c55e' : '#64748b',
                          fontSize: '1.2rem'
                        }}>
                        {isCheckIn ? '↓' : '↑'}
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-1 fs-6">
                          {act.parkingBranchName} - {isCheckIn ? 'Cổng vào' : 'Cổng ra'}
                        </h6>
                        <p className="text-muted small m-0">
                          Biển số: {act.licensePlate} • {timeStr}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPwModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card border-0 shadow-lg p-4 rounded-4" style={{ width: '100%', maxWidth: '400px', background: '#fff' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark m-0">🔐 Thay đổi mật khẩu</h5>
              <button type="button" className="btn-close" onClick={() => setShowPwModal(false)}></button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Mật khẩu hiện tại</label>
                <input
                  type="password" required className="form-control"
                  value={pwForm.oldPassword} onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                  placeholder="Nhập mật khẩu cũ"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Mật khẩu mới</label>
                <input
                  type="password" required className="form-control" minLength={6}
                  value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="Mật khẩu tối thiểu 6 ký tự"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Xác nhận mật khẩu mới</label>
                <input
                  type="password" required className="form-control"
                  value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  placeholder="Xác nhận lại mật khẩu mới"
                />
              </div>
              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-light fw-bold" onClick={() => setShowPwModal(false)}>Hủy</button>
                <button type="submit" className="btn text-white fw-bold" style={{ backgroundColor: '#164e63' }} disabled={submittingPw}>
                  {submittingPw ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Temporary Debug Info */}
      <div style={{ marginTop: '2.5rem', padding: '1.25rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12 }}>
        <h6 className="fw-bold text-dark mb-2">🔎 Thông tin Gỡ lỗi Bãi xe (Debug Info):</h6>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
          <div><strong>Tài khoản ID:</strong> {userId}</div>
          <div><strong>Số lượng phương tiện của bạn:</strong> {vehicles.length} (Biển số: {vehicles.map(v => v.licensePlate).join(', ')})</div>
          <div><strong>Số vé tháng nhận được:</strong> {rawTickets.length}</div>
          <div><strong>Có thẻ đỗ xe hợp lệ:</strong> {residentCard ? "CÓ" : "KHÔNG"}</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: 4 }}>Dữ liệu vé đỗ xe thô từ API:</div>
          <pre style={{ fontSize: '0.75rem', background: '#1e293b', color: '#f8fafc', padding: '10px', borderRadius: 8, overflow: 'auto', maxHeight: '180px' }}>
            {JSON.stringify(rawTickets, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
