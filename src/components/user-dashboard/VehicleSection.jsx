import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import parkingApi from '../../api/parkingApi';

export default function VehicleSection() {
  const userId = localStorage.getItem('userId');
  
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    licensePlate: '',
    vehicleColor: '',
    vehicleBrand: '',
    vehicleTypeId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Fetch user's vehicles
      const allVehicles = await parkingApi.getAllVehicles();
      const userVehicles = Array.isArray(allVehicles)
        ? allVehicles.filter(v => String(v.userId) === String(userId) && !v.deleted)
        : [];
      setVehicles(userVehicles);

      // 2. Fetch vehicle types
      const types = await parkingApi.getAllVehicleTypes();
      setVehicleTypes(types || []);
      if (types && types.length > 0) {
        setFormData(prev => ({ ...prev, vehicleTypeId: types[0].vehicleTypeId }));
      }

      // 3. Fetch price policies (service packages)
      const allPolicies = await parkingApi.getAllPricePolicies();
      // Filter for packages that contain "tháng", "vip", "president" (case insensitive)
      const servicePackages = Array.isArray(allPolicies)
        ? allPolicies.filter(p => 
            p.active && 
            (p.policyName.toLowerCase().includes('tháng') || 
             p.policyName.toLowerCase().includes('vip') || 
             p.policyName.toLowerCase().includes('president'))
          )
        : [];
      setPackages(servicePackages);
    } catch (err) {
      console.error("Failed to load vehicle data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedVehicle(null);
    setFormData({
      licensePlate: '',
      vehicleColor: '',
      vehicleBrand: '',
      vehicleTypeId: vehicleTypes[0]?.vehicleTypeId || ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setModalMode('edit');
    setSelectedVehicle(v);
    setFormData({
      licensePlate: v.licensePlate || '',
      vehicleColor: v.vehicleColor || '',
      vehicleBrand: v.vehicleBrand || '',
      vehicleTypeId: v.vehicleTypeId || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.licensePlate.trim()) {
      return toast.warning("Vui lòng nhập biển số xe!");
    }
    setSubmitting(true);
    try {
      const payload = {
        licensePlate: formData.licensePlate.trim().replace(/[^A-Za-z0-9\-.]/g, ''),
        vehicleColor: formData.vehicleColor.trim(),
        vehicleBrand: formData.vehicleBrand.trim(),
        vehicleTypeId: Number(formData.vehicleTypeId),
        userId: Number(userId)
      };

      if (modalMode === 'add') {
        await parkingApi.createVehicle(payload);
        toast.success("Thêm phương tiện mới thành công!");
      } else {
        await parkingApi.updateVehicle(selectedVehicle.vehicleId, payload);
        toast.success("Cập nhật thông tin phương tiện thành công!");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error("Save vehicle error:", err);
      const msg = err.response?.data?.message || err.response?.data || 'Lỗi lưu thông tin phương tiện!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối server!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId) => {
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

  const handleSubscribePackage = (policyName, price) => {
    toast.success(`Đăng ký gói "${policyName}" (${price.toLocaleString('vi-VN')}đ) thành công! Hệ thống sẽ liên hệ cư dân để kích hoạt thẻ.`);
  };

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
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1" style={{ color: '#164e63' }}>Phương tiện & Gói cước</h3>
        <p className="text-muted m-0">Quản lý các phương tiện đã đăng ký và đăng ký các gói dịch vụ đỗ xe của bạn.</p>
      </div>

      <div className="row g-4">
        {/* Cột Trái (Phương tiện của tôi) */}
        <div className="col-lg-8">
          
          <div className="d-flex justify-content-between align-items-center mb-3 mt-2">
            <h6 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <span className="text-info fs-5">🚘</span> Phương tiện của tôi
            </h6>
            <button className="btn btn-sm text-white fw-medium px-3 rounded-pill" style={{ backgroundColor: '#164e63' }} onClick={handleOpenAdd}>
              + Thêm phương tiện mới
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="card border p-5 text-center text-muted rounded-4 shadow-sm" style={{ borderStyle: 'dashed' }}>
              <span className="fs-1">🚗</span>
              <p className="mt-3 mb-0">Bạn chưa đăng ký phương tiện nào.</p>
              <small className="text-muted">Nhấn nút bên trên để đăng ký xe của bạn.</small>
            </div>
          ) : (
            <div className="row g-3 mb-5">
              {vehicles.map((v) => (
                <div className="col-md-6" key={v.vehicleId}>
                  <div className="card border p-3 rounded-4 h-100 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="bg-light rounded p-2 text-secondary">
                        {v.vehicleTypeName?.toLowerCase().includes('máy') || v.vehicleTypeName?.toLowerCase().includes('moto') ? '🛵' : '🚙'}
                      </div>
                      <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1" style={{ fontSize: '0.7rem' }}>
                        ● Đã xác minh
                      </span>
                    </div>
                    <div className="mb-3 mt-2">
                      <div className="text-muted small">{v.vehicleBrand || 'Hãng xe'} {v.vehicleColor ? `(${v.vehicleColor})` : ''}</div>
                      <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: '1px', color: '#164e63' }}>{v.licensePlate}</h4>
                      <div className="text-muted small mt-1">{v.vehicleTypeName || 'Phương tiện'} • Đang hoạt động</div>
                    </div>
                    <div className="mt-auto border-top pt-2 d-flex justify-content-between">
                      <button className="btn btn-link text-danger text-decoration-none p-0 fw-bold small" onClick={() => handleDelete(v.vehicleId)}>Xóa</button>
                      <button className="btn btn-link text-decoration-none p-0 fw-bold small" style={{ color: '#164e63' }} onClick={() => handleOpenEdit(v)}>Chỉnh sửa</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gói cước khuyên dùng / hoạt động */}
          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <span className="text-info fs-5">🎫</span> Gói cước đỗ xe tháng & VIP
          </h6>
          
          {packages.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-4 text-center text-muted" style={{ background: '#ffffff' }}>
              Chưa có gói cước tháng nào được cấu hình từ hệ thống.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3 mb-4">
              {packages.map((pkg) => (
                <div className="card border rounded-4 shadow-sm" key={pkg.pricePolicyId} style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
                  <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-info bg-opacity-10 text-info rounded-3 d-flex justify-content-center align-items-center" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
                        💎
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark m-0">{pkg.policyName}</h6>
                        <small className="text-muted">
                          Phương tiện áp dụng: <strong>{pkg.vehicleType?.typeName}</strong> • Thời lượng: {pkg.baseDurationMinutes / 60 / 24} ngày
                        </small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <span className="fw-bold text-dark fs-5">{pkg.basePrice?.toLocaleString('vi-VN')} VNĐ</span>
                      <button 
                        className="btn fw-bold text-white px-4 rounded-pill" 
                        style={{ backgroundColor: '#164e63' }}
                        onClick={() => handleSubscribePackage(pkg.policyName, pkg.basePrice)}
                      >
                        Đăng ký gói
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột Phải (Hỗ trợ đăng ký) */}
        <div className="col-lg-4">
          <h6 className="fw-bold text-dark mb-3 mt-2 d-flex align-items-center gap-2">
            <span className="text-info fs-5">ℹ️</span> Thông tin dịch vụ
          </h6>
          <div className="card border shadow-sm rounded-4 p-4" style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
            <h6 className="fw-bold text-dark mb-3">Quy trình cấp thẻ tháng:</h6>
            <ol className="small text-muted ps-3 mb-4" style={{ lineHeight: '1.8' }}>
              <li>Khai báo và thêm biển số xe chính chủ ở cột bên trái.</li>
              <li>Lựa chọn gói đỗ xe tháng tương ứng (Ví dụ: Gói Xe máy, Gói Ô tô).</li>
              <li>Bấm <strong>Đăng ký gói</strong> để gửi yêu cầu lên ban quản lý.</li>
              <li>Đến quầy kỹ thuật bãi đỗ xe để nhận thẻ cư dân vật lý đã liên kết.</li>
            </ol>
            <div className="border-top pt-3 text-center">
              <small className="text-muted d-block">Mọi thắc mắc vui lòng liên hệ</small>
              <strong style={{ color: '#164e63' }}>Hotline: 1900 8868 (Phím 2)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Vehicle Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card border-0 shadow-lg p-4 rounded-4" style={{ width: '100%', maxWidth: '450px', background: '#fff' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark m-0">
                {modalMode === 'add' ? '🚘 Thêm phương tiện mới' : '⚙️ Chỉnh sửa phương tiện'}
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Biển số xe</label>
                <input 
                  type="text" required className="form-control"
                  value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: e.target.value})}
                  placeholder="Ví dụ: 30G12345"
                />
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Không chứa ký tự đặc biệt ngoài '-' hoặc '.'</small>
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Hãng xe / Nhãn hiệu</label>
                <input 
                  type="text" className="form-control"
                  value={formData.vehicleBrand} onChange={e => setFormData({...formData, vehicleBrand: e.target.value})}
                  placeholder="Ví dụ: VinFast, Honda"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Màu sắc xe</label>
                <input 
                  type="text" className="form-control"
                  value={formData.vehicleColor} onChange={e => setFormData({...formData, vehicleColor: e.target.value})}
                  placeholder="Ví dụ: Trắng, Đen, Đỏ"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Loại phương tiện</label>
                <select 
                  className="form-select"
                  value={formData.vehicleTypeId} onChange={e => setFormData({...formData, vehicleTypeId: e.target.value})}
                >
                  {vehicleTypes.map(type => (
                    <option key={type.vehicleTypeId} value={type.vehicleTypeId}>
                      {type.typeName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-light fw-bold" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn text-white fw-bold" style={{ backgroundColor: '#164e63' }} disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
