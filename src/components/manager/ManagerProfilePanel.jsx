import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Form, Button, Card, Row, Col, Modal, Badge } from 'react-bootstrap';
import authApi from '../../api/authApi';
import parkingApi from '../../api/parkingApi';
import { mt } from './managerTheme';

export default function ManagerProfilePanel({ branchId }) {
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

  const loadProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
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

      // Load vehicles & types
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
      console.error("Failed to load manager profile & vehicles:", err);
      toast.error("Không thể tải thông tin hồ sơ!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
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
      console.error("Save manager profile error:", err);
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
      loadProfile();
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
      loadProfile();
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

  const branchName = localStorage.getItem('parkingBranchName') || '';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'Manager')}&background=164e63&color=fff&size=128`;

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5">
        <div className="spinner-border" style={{ color: mt.primary }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Banner Card */}
      <Card className="border-0 shadow-sm p-4 rounded-4" style={{ background: mt.cardBg }}>
        <div className="d-flex align-items-center gap-4 flex-wrap">
          <div className="rounded-4 overflow-hidden shadow-sm" style={{ width: '90px', height: '90px' }}>
            <img src={avatarUrl} alt="Avatar" className="w-100 h-100 object-fit-cover" />
          </div>
          <div>
            <h4 className="fw-bold mb-1" style={{ color: mt.text }}>
              {formData.fullName} <span style={{ fontSize: '0.85rem', color: mt.textMuted, fontWeight: 'normal' }}>(ID: {userId})</span>
            </h4>
            <p className="mb-2" style={{ color: mt.textMuted, fontSize: '0.9rem' }}>
              {formData.email} {branchName && `• Chi nhánh: ${branchName}`}
            </p>
            <Badge bg="primary" style={{ backgroundColor: mt.primary, padding: '6px 12px', fontSize: '0.75rem' }}>
              👑 QUẢN LÝ CHI NHÁNH
            </Badge>
          </div>
        </div>
      </Card>

      <Row className="g-4">
        {/* Left Column: Personal Info Form & Vehicles */}
        <Col lg={7}>
          {/* Personal Info Card */}
          <Card className="border-0 shadow-sm p-4 rounded-4" style={{ background: mt.cardBg }}>
            <Form onSubmit={handleSave}>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h6 className="fw-bold m-0" style={{ color: mt.text }}>
                  👤 Thông tin cá nhân
                </h6>
                {isEditing ? (
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={handleCancel} disabled={saving}>Hủy</Button>
                    <Button variant="primary" size="sm" type="submit" disabled={saving} style={{ backgroundColor: mt.primary, borderColor: mt.primary }}>
                      {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                    </Button>
                  </div>
                ) : (
                  <Button variant="link" className="p-0 text-decoration-none fw-bold" style={{ color: mt.primary }} onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>
                )}
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>HỌ VÀ TÊN</Form.Label>
                    <Form.Control type="text" name="fullName" value={formData.fullName} onChange={handleChange} readOnly={!isEditing} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>EMAIL</Form.Label>
                    <Form.Control type="email" name="email" value={formData.email} readOnly style={{ backgroundColor: '#f1f5f9' }} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>SỐ ĐIỆN THOẠI</Form.Label>
                    <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} readOnly={!isEditing} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>CHI NHÁNH PHỤ TRÁCH</Form.Label>
                    <Form.Control type="text" value={branchName || 'Chưa gán'} readOnly style={{ backgroundColor: '#f1f5f9' }} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>ĐỊA CHỈ</Form.Label>
                    <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} readOnly={!isEditing} />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* Vehicles Card */}
          <Card className="border-0 shadow-sm p-4 rounded-4 mt-4" style={{ background: mt.cardBg }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h6 className="fw-bold m-0" style={{ color: mt.text }}>
                🚘 Phương tiện của tôi
              </h6>
              <Button variant="primary" size="sm" onClick={handleOpenAddVeh} style={{ backgroundColor: mt.primary, borderColor: mt.primary }}>
                + Đăng ký xe
              </Button>
            </div>

            {vehicles.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: mt.textMuted, border: `1px dashed ${mt.border}`, borderRadius: '8px' }}>
                <span style={{ fontSize: '1.8rem' }}>🚗</span>
                <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem' }}>Chưa đăng ký phương tiện nào</p>
              </div>
            ) : (
              <Row className="g-3">
                {vehicles.map((v) => (
                  <Col md={6} key={v.vehicleId || v.id}>
                    <div style={{ background: '#f8fafc', border: `1px solid ${mt.border}`, borderRadius: '8px', padding: '1rem' }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span style={{ fontSize: '1.2rem' }}>
                          {v.vehicleTypeName?.toLowerCase().includes('máy') || v.vehicleTypeName?.toLowerCase().includes('moto') ? '🛵' : '🚙'}
                        </span>
                        <Badge bg="success" style={{ fontSize: '0.65rem' }}>
                          ● Đang hoạt động
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <div style={{ fontSize: '0.75rem', color: mt.textMuted }}>{v.vehicleBrand || 'Hãng xe'} {v.vehicleColor ? `(${v.vehicleColor})` : ''}</div>
                        <h6 className="fw-bold m-0" style={{ color: mt.text, letterSpacing: '1px' }}>{v.licensePlate}</h6>
                        <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginTop: '2px' }}>{v.vehicleTypeName}</div>
                      </div>
                      <div className="d-flex justify-content-between border-top pt-2" style={{ borderColor: mt.border }}>
                        <Button variant="link" className="text-danger text-decoration-none p-0 fw-bold" style={{ fontSize: '0.75rem' }} onClick={() => handleVehDelete(v.vehicleId || v.id)}>Xóa</Button>
                        <Button variant="link" className="text-decoration-none p-0 fw-bold" style={{ color: mt.primary, fontSize: '0.75rem' }} onClick={() => handleOpenEditVeh(v)}>Chỉnh sửa</Button>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>

        {/* Right Column: Security Panel */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm p-4 rounded-4" style={{ background: mt.cardBg }}>
            <h6 className="fw-bold mb-4" style={{ color: mt.text }}>
              🛡️ Bảo mật &amp; Tài khoản
            </h6>

            <div className="d-flex justify-content-between align-items-center py-2">
              <div className="d-flex align-items-start gap-3">
                <span className="fs-5 text-muted">🔒</span>
                <div>
                  <h6 className="fw-bold mb-1" style={{ color: mt.text, fontSize: '0.9rem' }}>Mật khẩu đăng nhập</h6>
                  <p className="m-0" style={{ color: mt.textMuted, fontSize: '0.78rem' }}>Đổi mật khẩu tài khoản quản lý định kỳ</p>
                </div>
              </div>
              <Button variant="outline-secondary" size="sm" onClick={() => setShowPwModal(true)}>Đổi mật khẩu</Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Change Password Modal */}
      <Modal show={showPwModal} onHide={() => setShowPwModal(false)} centered>
        <Form onSubmit={handleChangePassword}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold" style={{ color: mt.text }}>🔒 Thay đổi mật khẩu</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>MẬT KHẨU HIỆN TẠI</Form.Label>
              <Form.Control type="password" required value={pwForm.oldPassword} onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })} placeholder="Nhập mật khẩu cũ" />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>MẬT KHẨU MỚI</Form.Label>
              <Form.Control type="password" required minLength={6} value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Mật khẩu tối thiểu 6 ký tự" />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>XÁC NHẬN MẬT KHẨU MỚI</Form.Label>
              <Form.Control type="password" required value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="Xác nhận mật khẩu mới" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowPwModal(false)}>Hủy</Button>
            <Button variant="primary" type="submit" disabled={submittingPw} style={{ backgroundColor: mt.primary, borderColor: mt.primary }}>
              {submittingPw ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add / Edit Vehicle Modal */}
      <Modal show={showVehModal} onHide={() => setShowVehModal(false)} centered>
        <Form onSubmit={handleVehSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold" style={{ color: mt.text }}>
              {vehModalMode === 'add' ? '🚘 Đăng ký phương tiện' : '⚙️ Chỉnh sửa phương tiện'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>BIỂN SỐ XE *</Form.Label>
              <Form.Control type="text" required value={vehFormData.licensePlate} onChange={e => setVehFormData({...vehFormData, licensePlate: e.target.value})} placeholder="Ví dụ: 30G12345" />
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>Không chứa ký tự đặc biệt ngoài '-' hoặc '.'</small>
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>HÃNG XE / NHÃN HIỆU</Form.Label>
              <Form.Control type="text" value={vehFormData.vehicleBrand} onChange={e => setVehFormData({...vehFormData, vehicleBrand: e.target.value})} placeholder="Ví dụ: VinFast, Honda" />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>MÀU SẮC XE</Form.Label>
              <Form.Control type="text" value={vehFormData.vehicleColor} onChange={e => setVehFormData({...vehFormData, vehicleColor: e.target.value})} placeholder="Ví dụ: Trắng, Đen, Đỏ" />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-bold" style={{ color: mt.textMuted }}>LOẠI PHƯƠNG TIỆN</Form.Label>
              <Form.Select value={vehFormData.vehicleTypeId} onChange={e => setVehFormData({...vehFormData, vehicleTypeId: e.target.value})}>
                {vehicleTypes.map(type => (
                  <option key={type.vehicleTypeId} value={type.vehicleTypeId}>
                    {type.typeName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowVehModal(false)}>Hủy</Button>
            <Button variant="primary" type="submit" disabled={submittingVeh} style={{ backgroundColor: mt.primary, borderColor: mt.primary }}>
              {submittingVeh ? 'Đang lưu...' : 'Lưu thông tin'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
