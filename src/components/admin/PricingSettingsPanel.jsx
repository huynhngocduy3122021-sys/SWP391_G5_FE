import { useState, useEffect } from 'react';
import managerApi from '../../api/manager';
import { toast } from 'react-toastify';
import { Modal, Form, Button, Table, Badge, Card, Row, Col, Nav } from 'react-bootstrap';

/* ── helpers ─────────────────────────────────── */
const vtId   = (v) => v?.vehicleTypeId || v?.id || '';
const vtName = (v) => v?.typeName || v?.vehicleTypeName || v?.name || `Loại ${vtId(v)}`;
const fmt    = (n) => Number(n || 0).toLocaleString('vi-VN');

const EMPTY_FORM = {
  policyName: '', basePrice: '', baseDurationMinutes: '', extraHourPrice: '', extraDurationMinutes: '60', vehicleTypeId: '',
};

const EMPTY_PACKAGE_FORM = {
  packageName: '', packageType: 'MONTHLY', basePrice: '', durationDays: '30', vehicleTypeId: '',
};

export default function PricingSettingsPanel() {
  const [vtypes,    setVtypes]    = useState([]);
  const [policies,  setPolicies]  = useState([]);
  const [activeVt,  setActiveVt]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState('hourly'); // 'hourly' | 'packages'

  // Modal tạo / sửa chính sách vé lượt
  const [showModal, setShowModal]   = useState(false);
  const [editId,    setEditId]      = useState(null);
  const [form,      setForm]        = useState(EMPTY_FORM);
  const [saving,    setSaving]      = useState(false);
  const [formErr,   setFormErr]     = useState('');

  // Modal tạo / sửa gói dịch vụ (Tháng & VIP)
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editPkgId,    setEditPkgId]    = useState(null);
  const [pkgForm,      setPkgForm]      = useState(EMPTY_PACKAGE_FORM);
  const [savingPkg,    setSavingPkg]    = useState(false);
  const [pkgFormErr,   setPkgFormErr]   = useState('');

  // Modal xoá
  const [delTarget, setDelTarget] = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  /* ── fetch ── */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [vt, pol] = await Promise.all([
        managerApi.getVehicleTypes(),
        managerApi.getPricePolicies(),
      ]);
      const vtArr = Array.isArray(vt) ? vt : [];
      setVtypes(vtArr);
      setPolicies(Array.isArray(pol) ? pol : []);
      if (vtArr.length > 0 && !activeVt) setActiveVt(vtArr[0]);
    } catch (err) {
      console.error(err);
      setVtypes([]); setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const isPackage = (p) => {
    const name = p.policyName || '';
    return name.startsWith('[Gói Tháng]') || name.startsWith('[Gói VIP President]');
  };

  const getPackageDetails = (p) => {
    const name = p.policyName || '';
    if (name.startsWith('[Gói Tháng]')) return { cleanName: name.replace('[Gói Tháng]', '').trim(), typeLabel: 'Gói Tháng', typeColor: 'text-primary', typeBg: 'bg-primary-subtle', typeKey: 'MONTHLY' };
    if (name.startsWith('[Gói VIP President]')) return { cleanName: name.replace('[Gói VIP President]', '').trim(), typeLabel: 'VIP President', typeColor: 'text-warning', typeBg: 'bg-warning-subtle', typeKey: 'VIP_PRESIDENT' };
    return { cleanName: name, typeLabel: 'Khác', typeColor: 'text-secondary', typeBg: 'bg-secondary-subtle', typeKey: 'OTHER' };
  };

  const filteredHourlyPolicies = activeVt
    ? policies.filter(p => {
        const pid = p?.vehicleType?.vehicleTypeId || p?.vehicleType?.id || p?.vehicleTypeId;
        return String(pid) === String(vtId(activeVt)) && !isPackage(p);
      })
    : policies.filter(p => !isPackage(p));

  /* ── modal helpers chính sách lượt ── */
  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, vehicleTypeId: String(vtId(activeVt) || '') });
    setFormErr('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditId(p.pricePolicyId || p.id);
    setForm({
      policyName:          p.policyName || '',
      basePrice:           String(p.basePrice || ''),
      baseDurationMinutes: String(p.baseDurationMinutes || ''),
      extraHourPrice:      String(p.extraHourPrice || ''),
      extraDurationMinutes: String(p.extraDurationMinutes || '60'),
      vehicleTypeId:       String(p?.vehicleType?.vehicleTypeId || p?.vehicleType?.id || p?.vehicleTypeId || ''),
    });
    setFormErr('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setFormErr(''); };

  /* ── modal helpers gói dịch vụ ── */
  const openCreatePkg = () => {
    setEditPkgId(null);
    setPkgForm({ ...EMPTY_PACKAGE_FORM, vehicleTypeId: String(vtId(activeVt) || '') });
    setPkgFormErr('');
    setShowPkgModal(true);
  };

  const openEditPkg = (p) => {
    const details = getPackageDetails(p);
    setEditPkgId(p.pricePolicyId || p.id);
    setPkgForm({
      packageName: details.cleanName,
      packageType: details.typeKey,
      basePrice: String(p.basePrice || ''),
      durationDays: String(Math.round((p.baseDurationMinutes || 0) / (24 * 60))),
      vehicleTypeId: String(p?.vehicleType?.vehicleTypeId || p?.vehicleType?.id || p?.vehicleTypeId || ''),
    });
    setPkgFormErr('');
    setShowPkgModal(true);
  };

  const closePkgModal = () => { setShowPkgModal(false); setPkgFormErr(''); };

  /* ── save chính sách lượt ── */
  const handleSave = async () => {
    if (!form.policyName.trim())          return setFormErr('Vui lòng nhập tên chính sách.');
    if (!form.vehicleTypeId)              return setFormErr('Vui lòng chọn loại xe.');
    if (Number(form.basePrice) <= 0)      return setFormErr('Giá cơ bản phải lớn hơn 0.');
    if (Number(form.baseDurationMinutes) <= 0) return setFormErr('Thời gian cơ bản phải lớn hơn 0.');
    if (Number(form.extraHourPrice) < 0)  return setFormErr('Giá tính thêm không được âm.');
    if (Number(form.extraDurationMinutes) <= 0) return setFormErr('Thời gian tính thêm tiền (phút) phải lớn hơn 0.');

    const payload = {
      policyName:          form.policyName.trim(),
      basePrice:           Number(form.basePrice),
      baseDurationMinutes: Number(form.baseDurationMinutes),
      extraHourPrice:      Number(form.extraHourPrice),
      extraDurationMinutes: Number(form.extraDurationMinutes),
      vehicleTypeId:       Number(form.vehicleTypeId),
    };

    setSaving(true);
    try {
      if (editId) {
        await managerApi.updatePricePolicy(editId, payload);
        toast.success('Đã cập nhật chính sách giá!');
      } else {
        await managerApi.createPricePolicy(payload);
        toast.success('Đã tạo chính sách giá mới!');
      }
      closeModal();
      fetchAll();
    } catch (err) {
      setFormErr(String(err?.response?.data?.message || err?.response?.data || 'Có lỗi xảy ra!'));
    } finally {
      setSaving(false);
    }
  };

  /* ── save gói dịch vụ ── */
  const handleSavePkg = async () => {
    if (!pkgForm.packageName.trim()) return setPkgFormErr('Vui lòng nhập tên gói dịch vụ.');
    if (!pkgForm.vehicleTypeId)     return setPkgFormErr('Vui lòng chọn loại xe áp dụng.');
    if (Number(pkgForm.basePrice) <= 0) return setPkgFormErr('Giá gói dịch vụ phải lớn hơn 0.');
    if (Number(pkgForm.durationDays) <= 0) return setPkgFormErr('Thời hạn gói (ngày) phải lớn hơn 0.');

    const prefix = pkgForm.packageType === 'MONTHLY' ? '[Gói Tháng] ' : '[Gói VIP President] ';
    const policyName = prefix + pkgForm.packageName.trim();

    const payload = {
      policyName: policyName,
      basePrice: Number(pkgForm.basePrice),
      baseDurationMinutes: Number(pkgForm.durationDays) * 24 * 60,
      extraHourPrice: 0,
      vehicleTypeId: Number(pkgForm.vehicleTypeId)
    };

    setSavingPkg(true);
    try {
      if (editPkgId) {
        await managerApi.updatePricePolicy(editPkgId, payload);
        toast.success('Đã cập nhật cấu hình gói dịch vụ!');
      } else {
        await managerApi.createPricePolicy(payload);
        toast.success('Đã tạo gói dịch vụ mới!');
      }
      closePkgModal();
      fetchAll();
    } catch (err) {
      setPkgFormErr(String(err?.response?.data?.message || err?.response?.data || 'Có lỗi xảy ra!'));
    } finally {
      setSavingPkg(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await managerApi.deletePricePolicy(delTarget.id);
      toast.success(`Đã xóa chính sách "${delTarget.name}" thành công!`);
      setDelTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(String(err?.response?.data?.message || err?.response?.data || 'Xóa thất bại!'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-3 text-dark" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h3 className="h4 fw-bold m-0 text-primary">Cấu hình Bảng giá &amp; Gói cước</h3>
          <div className="small text-muted">Thiết lập bảng giá vé lượt và gói đăng ký (Tháng &amp; VIP President) dành cho hệ thống.</div>
        </div>
        <Button variant="primary" className="fw-bold" onClick={activeTab === 'hourly' ? openCreate : openCreatePkg}>
          {activeTab === 'hourly' ? '+ Thêm Vé Lượt' : '+ Thêm Gói Dịch Vụ'}
        </Button>
      </div>

      {/* Tabs */}
      <Nav variant="tabs" className="mb-2 border-bottom-0">
        <Nav.Item>
          <Nav.Link 
            className={`fw-bold border-0 border-bottom border-3 ${activeTab === 'hourly' ? 'text-primary border-primary' : 'text-muted border-transparent'}`} 
            onClick={() => setActiveTab('hourly')}
          >
            🎫 BẢNG GIÁ VÉ LƯỢT
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            className={`fw-bold border-0 border-bottom border-3 ${activeTab === 'packages' ? 'text-primary border-primary' : 'text-muted border-transparent'}`} 
            onClick={() => setActiveTab('packages')}
          >
            💎 GÓI DỊCH VỤ (THÁNG &amp; VIP PRESIDENT)
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <Row className="g-3">
        {/* Hourly Tab Content */}
        {activeTab === 'hourly' && (
          <>
            <Col md={3}>
              <Card className="border shadow-sm p-3">
                <div className="fw-bold small text-muted text-uppercase mb-3">Bộ lọc theo xe</div>
                {loading ? <div className="small text-muted">Đang tải...</div> : vtypes.length === 0 ? <div className="small text-muted">Chưa có loại xe nào.</div> : (
                  <div className="d-flex flex-column gap-2">
                    {vtypes.map((v) => {
                      const isActive = String(vtId(v)) === String(vtId(activeVt));
                      const count = policies.filter(p => String(p?.vehicleType?.vehicleTypeId || p?.vehicleType?.id || p?.vehicleTypeId) === String(vtId(v)) && !isPackage(p)).length;
                      return (
                        <Button key={vtId(v)} variant={isActive ? 'primary' : 'light'} className="text-start d-flex flex-column rounded border-0 p-2" onClick={() => setActiveVt(v)}>
                          <span className="fw-bold small">{vtName(v)}</span>
                          <span className="small opacity-75" style={{fontSize: '0.7rem'}}>{count} chính sách</span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </Card>
            </Col>
            
            <Col md={9}>
              <Card className="border shadow-sm p-3">
                <div className="mb-3">
                  <h3 className="h6 fw-bold text-primary m-0">Bảng giá lượt: {activeVt ? vtName(activeVt) : 'Tất cả'}</h3>
                  <span className="small text-muted">{filteredHourlyPolicies.length} chính sách đang áp dụng</span>
                </div>

                {loading ? (
                  <div className="text-center p-4 text-muted small">Đang tải dữ liệu...</div>
                ) : filteredHourlyPolicies.length === 0 ? (
                  <div className="text-center p-4 text-muted small fst-italic">Chưa cấu hình bảng giá lượt cho loại xe này.</div>
                ) : (
                  <Table hover responsive className="align-middle border-top mb-0 small">
                    <thead className="table-light text-muted">
                      <tr><th>TÊN CHÍNH SÁCH</th><th>GIÁ CƠ BẢN</th><th>THỜI GIAN CƠ BẢN</th><th>GIÁ TÍNH THÊM</th><th className="text-end">THAO TÁC</th></tr>
                    </thead>
                    <tbody>
                      {filteredHourlyPolicies.map((p) => (
                        <tr key={p.pricePolicyId || p.id}>
                          <td className="fw-bold">{p.policyName}</td>
                          <td className="fw-bold text-primary">{fmt(p.basePrice)} đ</td>
                          <td className="text-muted">{p.baseDurationMinutes} phút</td>
                          <td>{fmt(p.extraHourPrice)} đ / {p.extraDurationMinutes || 60} phút</td>
                          <td className="text-end">
                            <Button variant="outline-primary" size="sm" className="me-2 fw-bold" onClick={() => openEdit(p)}>Sửa</Button>
                            <Button variant="outline-danger" size="sm" className="fw-bold" onClick={() => setDelTarget({ id: p.pricePolicyId || p.id, name: p.policyName })}>Xóa</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </Col>
          </>
        )}

        {/* Packages Tab Content */}
        {activeTab === 'packages' && (
          <>
            <Col md={6}>
              <Card className="border shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                  <h3 className="h6 fw-bold text-primary m-0">📥 DANH SÁCH GÓI VÉ THÁNG</h3>
                  <span className="fw-bold small text-muted">{policies.filter(p => (p.policyName || '').startsWith('[Gói Tháng]')).length} gói</span>
                </div>
                {loading ? <div className="text-center p-3 text-muted small">Đang tải...</div> : policies.filter(p => (p.policyName || '').startsWith('[Gói Tháng]')).length === 0 ? <div className="text-center p-4 text-muted small fst-italic">Chưa cấu hình gói vé tháng.</div> : (
                  <div className="d-flex flex-column gap-2">
                    {policies.filter(p => (p.policyName || '').startsWith('[Gói Tháng]')).map((p) => {
                      const details = getPackageDetails(p);
                      const days = Math.round((p.baseDurationMinutes || 0) / (24 * 60));
                      return (
                        <div key={p.pricePolicyId || p.id} className="border rounded p-2 bg-light d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold text-dark small">{details.cleanName}</div>
                            <div className="d-flex align-items-center gap-1 mt-1">
                              <Badge className={`${details.typeBg} ${details.typeColor}`}>{details.typeLabel}</Badge>
                              <span className="small text-muted" style={{fontSize: '0.7rem'}}>Hạn: {days} ngày • {p.vehicleType?.typeName || 'Mọi xe'}</span>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-primary">{fmt(p.basePrice)} đ</div>
                            <div className="mt-1">
                              <Button variant="link" size="sm" className="text-primary fw-bold text-decoration-none px-1 p-0 me-2" onClick={() => openEditPkg(p)}>Sửa</Button>
                              <Button variant="link" size="sm" className="text-danger fw-bold text-decoration-none px-1 p-0" onClick={() => setDelTarget({ id: p.pricePolicyId || p.id, name: p.policyName })}>Xóa</Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                  <h3 className="h6 fw-bold text-warning m-0">👑 GÓI ĐẶC QUYỀN VIP PRESIDENT</h3>
                  <span className="fw-bold small text-muted">{policies.filter(p => (p.policyName || '').startsWith('[Gói VIP President]')).length} gói</span>
                </div>
                {loading ? <div className="text-center p-3 text-muted small">Đang tải...</div> : policies.filter(p => (p.policyName || '').startsWith('[Gói VIP President]')).length === 0 ? <div className="text-center p-4 text-muted small fst-italic">Chưa cấu hình gói đặc quyền VIP.</div> : (
                  <div className="d-flex flex-column gap-2">
                    {policies.filter(p => (p.policyName || '').startsWith('[Gói VIP President]')).map((p) => {
                      const details = getPackageDetails(p);
                      const days = Math.round((p.baseDurationMinutes || 0) / (24 * 60));
                      return (
                        <div key={p.pricePolicyId || p.id} className="border border-warning bg-warning bg-opacity-10 rounded p-2 d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold text-dark small" style={{color: '#78350f'}}>{details.cleanName}</div>
                            <div className="d-flex align-items-center gap-1 mt-1">
                              <Badge className={`${details.typeBg} ${details.typeColor}`}>{details.typeLabel}</Badge>
                              <span className="small text-warning" style={{fontSize: '0.7rem'}}>Hạn: {days} ngày • {p.vehicleType?.typeName || 'Mọi xe'}</span>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-warning">{fmt(p.basePrice)} đ</div>
                            <div className="mt-1">
                              <Button variant="link" size="sm" className="text-primary fw-bold text-decoration-none px-1 p-0 me-2" onClick={() => openEditPkg(p)}>Sửa</Button>
                              <Button variant="link" size="sm" className="text-danger fw-bold text-decoration-none px-1 p-0" onClick={() => setDelTarget({ id: p.pricePolicyId || p.id, name: p.policyName })}>Xóa</Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* Modal: Thêm / Sửa Vé Lượt */}
      <Modal show={showModal} onHide={closeModal} centered>
        <Form>
          <Modal.Header closeButton><Modal.Title className="fs-6 fw-bold">{editId ? 'Chỉnh sửa chính sách vé lượt' : 'Thêm mới chính sách vé lượt'}</Modal.Title></Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            {formErr && <div className="alert alert-danger p-2 small m-0">{formErr}</div>}
            <Form.Group><Form.Label className="small fw-bold text-muted mb-1">TÊN CHÍNH SÁCH *</Form.Label><Form.Control type="text" placeholder="Ví dụ: Vé lượt xe máy ban ngày, ban đêm..." value={form.policyName} onChange={e => setForm({ ...form, policyName: e.target.value })} /></Form.Group>
            <Form.Group><Form.Label className="small fw-bold text-muted mb-1">LOẠI XE ÁP DỤNG *</Form.Label><Form.Select value={form.vehicleTypeId} onChange={e => setForm({ ...form, vehicleTypeId: e.target.value })}><option value="">-- Chọn loại xe --</option>{vtypes.map(v => <option key={vtId(v)} value={vtId(v)}>{vtName(v)}</option>)}</Form.Select></Form.Group>
            <Row className="g-2">
              <Col><Form.Group><Form.Label className="small fw-bold text-muted mb-1">GIÁ CƠ BẢN (ĐỒNG) *</Form.Label><Form.Control type="number" min="0" placeholder="Ví dụ: 5000" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold text-muted mb-1">HẠN MỨC (PHÚT) *</Form.Label><Form.Control type="number" min="1" placeholder="Ví dụ: 240 (4 tiếng)" value={form.baseDurationMinutes} onChange={e => setForm({ ...form, baseDurationMinutes: e.target.value })} /></Form.Group></Col>
            </Row>
            <Row className="g-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted mb-1">GIÁ TÍNH THÊM (ĐỒNG) *</Form.Label>
                  <Form.Control type="number" min="0" placeholder="Ví dụ: 2000" value={form.extraHourPrice} onChange={e => setForm({ ...form, extraHourPrice: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted mb-1">CHO MỖI KHOẢNG (PHÚT) *</Form.Label>
                  <Form.Control type="number" min="1" placeholder="Ví dụ: 60" value={form.extraDurationMinutes} onChange={e => setForm({ ...form, extraDurationMinutes: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer><Button variant="outline-secondary" onClick={closeModal} disabled={saving}>Hủy bỏ</Button><Button variant="primary" className="fw-bold" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu lại'}</Button></Modal.Footer>
        </Form>
      </Modal>

      {/* Modal: Thêm / Sửa Gói Dịch Vụ */}
      <Modal show={showPkgModal} onHide={closePkgModal} centered>
        <Form>
          <Modal.Header closeButton><Modal.Title className="fs-6 fw-bold">{editPkgId ? 'Chỉnh sửa gói cước đăng ký' : 'Tạo gói cước đăng ký mới'}</Modal.Title></Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            {pkgFormErr && <div className="alert alert-danger p-2 small m-0">{pkgFormErr}</div>}
            <Form.Group><Form.Label className="small fw-bold text-muted mb-1">TÊN GÓI ĐĂNG KÝ *</Form.Label><Form.Control type="text" placeholder="Ví dụ: Gói xe máy Standard, VIP Oto..." value={pkgForm.packageName} onChange={e => setPkgForm({ ...pkgForm, packageName: e.target.value })} /></Form.Group>
            <Form.Group><Form.Label className="small fw-bold text-muted mb-1">LOẠI ĐĂNG KÝ (PHÂN KHÚC) *</Form.Label><Form.Select value={pkgForm.packageType} onChange={e => setPkgForm({ ...pkgForm, packageType: e.target.value })}><option value="MONTHLY">Gói cước Tháng (Monthly Package)</option><option value="VIP_PRESIDENT">Gói cước VIP President (Đặc quyền tối cao)</option></Form.Select></Form.Group>
            <Form.Group><Form.Label className="small fw-bold text-muted mb-1">LOẠI PHƯƠNG TIỆN ÁP DỤNG *</Form.Label><Form.Select value={pkgForm.vehicleTypeId} onChange={e => setPkgForm({ ...pkgForm, vehicleTypeId: e.target.value })}><option value="">-- Chọn loại xe --</option>{vtypes.map(v => <option key={vtId(v)} value={vtId(v)}>{vtName(v)}</option>)}</Form.Select></Form.Group>
            <Row className="g-2">
              <Col><Form.Group><Form.Label className="small fw-bold text-muted mb-1">ĐƠN GIÁ GÓI (ĐỒNG) *</Form.Label><Form.Control type="number" min="1" placeholder="Ví dụ: 120000" value={pkgForm.basePrice} onChange={e => setPkgForm({ ...pkgForm, basePrice: e.target.value })} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold text-muted mb-1">THỜI HẠN HIỆU LỰC (NGÀY) *</Form.Label><Form.Control type="number" min="1" placeholder="Ví dụ: 30" value={pkgForm.durationDays} onChange={e => setPkgForm({ ...pkgForm, durationDays: e.target.value })} /></Form.Group></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer><Button variant="outline-secondary" onClick={closePkgModal} disabled={savingPkg}>Hủy bỏ</Button><Button variant="primary" className="fw-bold" onClick={handleSavePkg} disabled={savingPkg}>{savingPkg ? 'Đang tạo...' : 'Lưu lại'}</Button></Modal.Footer>
        </Form>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <Modal show={!!delTarget} onHide={() => setDelTarget(null)} centered>
        <Modal.Body className="text-center p-4">
          <h4 className="text-danger fw-bold mb-3">Xác nhận xóa</h4>
          <p className="text-muted mb-4">Bạn có chắc chắn muốn xóa chính sách <strong className="text-danger">"{delTarget?.name}"</strong>? Hành động này sẽ loại bỏ bảng giá này khỏi hệ thống ngay lập tức và không thể khôi phục.</p>
          <div className="d-flex justify-content-center gap-2">
            <Button variant="outline-secondary" onClick={() => setDelTarget(null)} disabled={deleting}>Hủy</Button>
            <Button variant="danger" className="fw-bold" onClick={handleDelete} disabled={deleting}>{deleting ? 'Đang xóa...' : 'Xác nhận xóa'}</Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
