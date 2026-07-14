import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import StaffTopbar from '../../components/staff/StaffTopbar';
import authApi from '../../api/authApi';
import parkingApi from '../../api/parkingApi';

export default function StaffProfilePage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: localStorage.getItem('fullName') || '',
    email: localStorage.getItem('email') || '',
    phone: localStorage.getItem('phone') || localStorage.getItem('userPhone') || '',
    address: localStorage.getItem('address') || localStorage.getItem('userAddress') || ''
  });

  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  // Vehicle Modal states
  const [showVehModal, setShowVehModal] = useState(false);
  const [vehModalMode, setVehModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedVeh, setSelectedVeh] = useState(null);
  const [vehFormData, setVehFormData] = useState({
    licensePlate: '',
    vehicleColor: '',
    vehicleBrand: '',
    vehicleTypeId: ''
  });
  const [submittingVeh, setSubmittingVeh] = useState(false);

  // Password change states
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [submittingPw, setSubmittingPw] = useState(false);

  const loadData = async () => {
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
        address: profile.userAddress || localStorage.getItem('address') || localStorage.getItem('userAddress') || ''
      };

      localStorage.setItem('fullName', nextProfile.fullName);
      localStorage.setItem('email', nextProfile.email);
      localStorage.setItem('phone', nextProfile.phone);
      localStorage.setItem('userPhone', nextProfile.phone);
      localStorage.setItem('address', nextProfile.address);
      localStorage.setItem('userAddress', nextProfile.address);

      setFormData(nextProfile);

      // 2. Load vehicles & vehicle types
      const [vehRes, typeRes] = await Promise.all([
        parkingApi.getAllVehicles().catch(() => []),
        parkingApi.getAllVehicleTypes().catch(() => [])
      ]);

      const allVehiclesList = Array.isArray(vehRes) ? vehRes : (vehRes?.content || vehRes?.data || []);
      const userVehicles = allVehiclesList.filter(v => String(v.userId) === String(userId) && !v.deleted);
      setVehicles(userVehicles);

      if (typeRes) {
        const typeList = Array.isArray(typeRes) ? typeRes : (typeRes?.content || typeRes?.data || []);
        setVehicleTypes(typeList);
        if (typeList.length > 0) {
          setVehFormData(prev => ({ ...prev, vehicleTypeId: typeList[0].vehicleTypeId }));
        }
      }
    } catch (err) {
      console.error("Failed to load staff details & vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateUser(userId, {
        userFullName: formData.fullName,
        userEmail: formData.email,
        userPhone: formData.phone,
        userAddress: formData.address
      });

      localStorage.setItem('fullName', formData.fullName);
      localStorage.setItem('email', formData.email);
      localStorage.setItem('phone', formData.phone);
      localStorage.setItem('userPhone', formData.phone);
      localStorage.setItem('address', formData.address);
      localStorage.setItem('userAddress', formData.address);

      setIsEditing(false);
      toast.success('Cập nhật thông tin thành công!');
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error("Save staff profile error:", err);
      const msg = err.response?.data?.message || err.response?.data || 'Cập nhật thất bại!';
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
      address: localStorage.getItem('address') || localStorage.getItem('userAddress') || ''
    });
    setIsEditing(false);
  };

  // Vehicle operations
  const handleOpenAddVeh = () => {
    setVehModalMode('add');
    setSelectedVeh(null);
    setVehFormData({
      licensePlate: '',
      vehicleColor: '',
      vehicleBrand: '',
      vehicleTypeId: vehicleTypes[0]?.vehicleTypeId || ''
    });
    setShowVehModal(true);
  };

  const handleOpenEditVeh = (v) => {
    setVehModalMode('edit');
    setSelectedVeh(v);
    setVehFormData({
      licensePlate: v.licensePlate || '',
      vehicleColor: v.vehicleColor || '',
      vehicleBrand: v.vehicleBrand || '',
      vehicleTypeId: v.vehicleTypeId || ''
    });
    setShowVehModal(true);
  };

  const handleVehSubmit = async (e) => {
    e.preventDefault();
    if (!vehFormData.licensePlate.trim()) {
      return toast.warning("Vui lòng nhập biển số xe!");
    }
    setSubmittingVeh(true);
    try {
      const payload = {
        licensePlate: vehFormData.licensePlate.trim().toUpperCase().replace(/[^A-Za-z0-9\-.]/g, ''),
        vehicleColor: vehFormData.vehicleColor.trim(),
        vehicleBrand: vehFormData.vehicleBrand.trim(),
        vehicleTypeId: Number(vehFormData.vehicleTypeId),
        userId: Number(userId)
      };

      if (vehModalMode === 'add') {
        await parkingApi.createVehicle(payload);
        toast.success("Thêm phương tiện mới thành công!");
      } else {
        await parkingApi.updateVehicle(selectedVeh.vehicleId, payload);
        toast.success("Cập nhật thông tin phương tiện thành công!");
      }
      setShowVehModal(false);
      loadData();
    } catch (err) {
      console.error("Save vehicle error:", err);
      const msg = err.response?.data?.message || err.response?.data || 'Lỗi lưu thông tin phương tiện!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối server!');
    } finally {
      setSubmittingVeh(false);
    }
  };

  const handleVehDelete = async (vehicleId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phương tiện này?")) return;
    try {
      await parkingApi.deleteVehicle(vehicleId);
      toast.success("Xóa phương tiện thành công!");
      loadData();
    } catch (err) {
      console.error("Delete vehicle error:", err);
      toast.error("Không thể xóa phương tiện này!");
    }
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
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối!');
    } finally {
      setSubmittingPw(false);
    }
  };

  const getInputStyle = (editable) => ({
    backgroundColor: editable ? '#ffffff' : 'var(--vin-bg-light)',
    color: 'var(--vin-text-main)',
    border: editable ? '1px solid var(--vin-primary)' : '1px solid var(--vin-border)',
    borderRadius: '8px',
    padding: '0.6rem 0.75rem',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s',
  });

  const role = (localStorage.getItem('role') || 'STAFF').toUpperCase();
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'Staff')}&background=0284c7&color=fff&size=128`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--vin-bg-deep)', color: 'var(--vin-text-main)' }}>
      <StaffTopbar 
        mode="PROFILE" 
        onModeChange={(m) => navigate(m === 'ENTRY' ? '/staff/entry' : m === 'EXIT' ? '/staff/exit' : '/staff/profile')} 
      />

      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <h4 className="fw-bold mb-4" style={{ color: 'var(--vin-text-main)' }}>👤 Hồ sơ cá nhân Nhân viên</h4>

        {loading ? (
          <div className="d-flex align-items-center justify-content-center p-5">
            <div className="spinner-border" style={{ color: 'var(--vin-primary)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Banner Card */}
            <div style={{ background: 'var(--vin-bg-card)', border: '1px solid var(--vin-border)', borderRadius: '12px', padding: '1.5rem' }}>
              <div className="d-flex align-items-center gap-4">
                <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: 'var(--vin-text-main)' }}>
                    {formData.fullName} <span style={{ fontSize: '0.8rem', color: 'var(--vin-text-muted)', fontWeight: 'normal' }}>(ID: {userId})</span>
                  </h5>
                  <p style={{ color: 'var(--vin-text-muted)', fontSize: '0.85rem', margin: '0 0 8px 0' }}>{formData.email}</p>
                  <span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600 }}>
                    🛠️ VAI TRÒ: {role === 'MANAGER' ? 'QUẢN LÝ BÃI XE' : 'NHÂN VIÊN VẬN HÀNH'}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin cá nhân */}
            <div style={{ background: 'var(--vin-bg-card)', border: '1px solid var(--vin-border)', borderRadius: '12px', padding: '1.5rem' }}>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h6 className="fw-bold m-0" style={{ color: 'var(--vin-text-main)' }}>
                  👤 Thông tin chi tiết
                </h6>
                {isEditing ? (
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary fw-semibold border-secondary" onClick={handleCancel} disabled={saving}>Hủy</button>
                    <button className="btn btn-sm btn-primary fw-semibold" onClick={handleSave} disabled={saving}>
                      {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-link text-decoration-none fw-bold p-0" style={{ color: 'var(--vin-primary)' }} onClick={() => setIsEditing(true)}>Chỉnh sửa</button>
                )}
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">HỌ VÀ TÊN</label>
                  <input type="text" name="fullName" style={getInputStyle(isEditing)} value={formData.fullName} onChange={handleChange} readOnly={!isEditing} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">EMAIL</label>
                  <input type="email" name="email" style={getInputStyle(false)} value={formData.email} readOnly />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">SỐ ĐIỆN THOẠI</label>
                  <input type="text" name="phone" style={getInputStyle(isEditing)} value={formData.phone} onChange={handleChange} readOnly={!isEditing} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">VAI TRÒ HỆ THỐNG</label>
                  <input type="text" style={getInputStyle(false)} value={role === 'MANAGER' ? 'Manager' : 'Staff'} readOnly />
                </div>
                <div className="col-12">
                  <label className="form-label small text-muted fw-bold">ĐỊA CHỈ</label>
                  <textarea name="address" rows="2" style={{ ...getInputStyle(isEditing), resize: 'none' }} value={formData.address} onChange={handleChange} readOnly={!isEditing}></textarea>
                </div>
              </div>
            </div>

            {/* Phương tiện của tôi */}
            <div style={{ background: 'var(--vin-bg-card)', border: '1px solid var(--vin-border)', borderRadius: '12px', padding: '1.5rem' }}>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h6 className="fw-bold m-0" style={{ color: 'var(--vin-text-main)' }}>
                  🚘 Phương tiện của tôi
                </h6>
                <button className="btn btn-sm btn-primary fw-semibold" onClick={handleOpenAddVeh}>
                  + Đăng ký xe
                </button>
              </div>

              {vehicles.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--vin-text-muted)', border: '1px dashed var(--vin-border)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '1.8rem' }}>🚗</span>
                  <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem' }}>Chưa đăng ký phương tiện nào</p>
                </div>
              ) : (
                <div className="row g-3">
                  {vehicles.map((v) => (
                    <div className="col-md-6" key={v.vehicleId || v.id}>
                      <div style={{ background: 'var(--vin-bg-deep)', border: '1px solid var(--vin-border)', borderRadius: '8px', padding: '1rem' }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span style={{ fontSize: '1.2rem' }}>
                            {v.vehicleTypeName?.toLowerCase().includes('máy') || v.vehicleTypeName?.toLowerCase().includes('moto') ? '🛵' : '🚙'}
                          </span>
                          <span className="badge" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.65rem' }}>
                            ● Đang hoạt động
                          </span>
                        </div>
                        <div className="mb-2">
                          <div style={{ fontSize: '0.75rem', color: 'var(--vin-text-muted)' }}>{v.vehicleBrand || 'Hãng xe'} {v.vehicleColor ? `(${v.vehicleColor})` : ''}</div>
                          <h6 className="fw-bold m-0" style={{ color: 'var(--vin-text-main)', letterSpacing: '1px' }}>{v.licensePlate}</h6>
                          <div style={{ fontSize: '0.75rem', color: 'var(--vin-text-muted)', marginTop: '2px' }}>{v.vehicleTypeName}</div>
                        </div>
                        <div className="d-flex justify-content-between border-top pt-2" style={{ borderColor: 'var(--vin-border)' }}>
                          <button className="btn btn-link text-danger text-decoration-none p-0 fw-bold" style={{ fontSize: '0.75rem' }} onClick={() => handleVehDelete(v.vehicleId || v.id)}>Xóa</button>
                          <button className="btn btn-link text-decoration-none p-0 fw-bold" style={{ color: 'var(--vin-primary)', fontSize: '0.75rem' }} onClick={() => handleOpenEditVeh(v)}>Chỉnh sửa</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bảo mật */}
            <div style={{ background: 'var(--vin-bg-card)', border: '1px solid var(--vin-border)', borderRadius: '12px', padding: '1.5rem' }}>
              <h6 className="fw-bold mb-4" style={{ color: 'var(--vin-text-main)' }}>
                🛡️ Bảo mật &amp; Tài khoản
              </h6>

              <div className="d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-start gap-3">
                  <span className="fs-5 text-muted">🔒</span>
                  <div>
                    <h6 className="fw-bold mb-1" style={{ color: 'var(--vin-text-main)' }}>Mật khẩu đăng nhập</h6>
                    <p style={{ color: 'var(--vin-text-muted)', fontSize: '0.8rem', margin: 0 }}>Cập nhật mật khẩu định kỳ để bảo vệ tài khoản</p>
                  </div>
                </div>
                <button className="btn btn-outline-secondary btn-sm fw-bold border-secondary" onClick={() => setShowPwModal(true)}>Đổi mật khẩu</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Vehicle Modal */}
      {showVehModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--vin-bg-card)', border: '1px solid var(--vin-border)', borderRadius: '16px', width: '100%', maxWidth: '450px', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0" style={{ color: 'var(--vin-text-main)' }}>
                {vehModalMode === 'add' ? '🚘 Đăng ký phương tiện' : '⚙️ Chỉnh sửa phương tiện'}
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowVehModal(false)}></button>
            </div>
            <form onSubmit={handleVehSubmit}>
              <div className="mb-3">
                <label className="form-label small text-muted fw-bold">BIỂN SỐ XE *</label>
                <input type="text" required style={getInputStyle(true)} value={vehFormData.licensePlate} onChange={e => setVehFormData({...vehFormData, licensePlate: e.target.value})} placeholder="Ví dụ: 30G12345" />
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Không chứa ký tự đặc biệt ngoài '-' hoặc '.'</small>
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-bold">HÃNG XE / NHÃN HIỆU</label>
                <input type="text" style={getInputStyle(true)} value={vehFormData.vehicleBrand} onChange={e => setVehFormData({...vehFormData, vehicleBrand: e.target.value})} placeholder="Ví dụ: VinFast, Honda" />
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-bold">MÀU SẮC XE</label>
                <input type="text" style={getInputStyle(true)} value={vehFormData.vehicleColor} onChange={e => setVehFormData({...vehFormData, vehicleColor: e.target.value})} placeholder="Ví dụ: Trắng, Đen, Đỏ" />
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-bold">LOẠI PHƯƠNG TIỆN</label>
                <select style={getInputStyle(true)} value={vehFormData.vehicleTypeId} onChange={e => setVehFormData({...vehFormData, vehicleTypeId: e.target.value})}>
                  {vehicleTypes.map(type => (
                    <option key={type.vehicleTypeId} value={type.vehicleTypeId}>
                      {type.typeName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-outline-secondary fw-semibold border-secondary" onClick={() => setShowVehModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary fw-semibold" disabled={submittingVeh}>
                  {submittingVeh ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPwModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--vin-bg-card)', border: '1px solid var(--vin-border)', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0" style={{ color: 'var(--vin-text-main)' }}>🔒 Đổi mật khẩu</h5>
              <button type="button" className="btn-close" onClick={() => setShowPwModal(false)}></button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="form-label small text-muted fw-bold">MẬT KHẨU HIỆN TẠI</label>
                <input type="password" required style={getInputStyle(true)} value={pwForm.oldPassword} onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })} placeholder="Nhập mật khẩu cũ" />
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-bold">MẬT KHẨU MỚI</label>
                <input type="password" required style={getInputStyle(true)} minLength={6} value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Tối thiểu 6 ký tự" />
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-bold">XÁC NHẬN MẬT KHẨU MỚI</label>
                <input type="password" required style={getInputStyle(true)} value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="Xác nhận mật khẩu mới" />
              </div>
              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-outline-secondary fw-semibold border-secondary" onClick={() => setShowPwModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary fw-semibold" disabled={submittingPw}>
                  {submittingPw ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
