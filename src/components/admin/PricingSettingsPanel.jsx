import { useState, useEffect } from 'react';
import { mt, card } from '../manager/managerTheme';
import managerApi from '../../api/manager';
import { toast } from 'react-toastify';

/* ── helpers ─────────────────────────────────── */
const vtId   = (v) => v?.vehicleTypeId || v?.id || '';
const vtName = (v) => v?.typeName || v?.vehicleTypeName || v?.name || `Loại ${vtId(v)}`;
const fmt    = (n) => Number(n || 0).toLocaleString('vi-VN');

const EMPTY_FORM = {
  policyName: '', basePrice: '', baseDurationMinutes: '', extraHourPrice: '', vehicleTypeId: '',
};

const EMPTY_PACKAGE_FORM = {
  packageName: '', packageType: 'MONTHLY', basePrice: '', durationDays: '30', vehicleTypeId: '',
};

export default function PricingSettingsPanel() {
  const [vtypes,    setVtypes]    = useState([]);
  const [policies,  setPolicies]  = useState([]);
  const [activeVt,  setActiveVt]  = useState(null); // vehicleType object đang chọn
  const [loading,   setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState('hourly'); // 'hourly' | 'packages'

  // Modal tạo / sửa chính sách vé lượt
  const [showModal, setShowModal]   = useState(false);
  const [editId,    setEditId]      = useState(null); // null = tạo mới
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
  const [delTarget, setDelTarget] = useState(null); // { id, name }
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

  // Phân loại chính sách:
  // - Gói dịch vụ: chính sách có tên bắt đầu bằng "[Gói Tháng]" hoặc "[Gói VIP President]"
  const isPackage = (p) => {
    const name = p.policyName || '';
    return name.startsWith('[Gói Tháng]') || name.startsWith('[Gói VIP President]');
  };

  const getPackageDetails = (p) => {
    const name = p.policyName || '';
    if (name.startsWith('[Gói Tháng]')) {
      return {
        cleanName: name.replace('[Gói Tháng]', '').trim(),
        typeLabel: 'Gói Tháng',
        typeColor: '#2563eb',
        typeBg: '#eff6ff',
        typeKey: 'MONTHLY'
      };
    }
    if (name.startsWith('[Gói VIP President]')) {
      return {
        cleanName: name.replace('[Gói VIP President]', '').trim(),
        typeLabel: 'VIP President',
        typeColor: '#d97706',
        typeBg: '#fef3c7',
        typeKey: 'VIP_PRESIDENT'
      };
    }
    return { cleanName: name, typeLabel: 'Khác', typeColor: '#64748b', typeBg: '#f1f5f9', typeKey: 'OTHER' };
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
    if (Number(form.extraHourPrice) < 0)  return setFormErr('Giá thêm giờ không được âm.');

    const payload = {
      policyName:          form.policyName.trim(),
      basePrice:           Number(form.basePrice),
      baseDurationMinutes: Number(form.baseDurationMinutes),
      extraHourPrice:      Number(form.extraHourPrice),
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
      const msg = err?.response?.data?.message || err?.response?.data || 'Có lỗi xảy ra!';
      setFormErr(String(msg));
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
      const msg = err?.response?.data?.message || err?.response?.data || 'Có lỗi xảy ra!';
      setPkgFormErr(String(msg));
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
      const msg = err?.response?.data?.message || err?.response?.data || 'Xóa thất bại!';
      toast.error(String(msg));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'Inter, sans-serif', color: '#0f172a' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>Cấu hình Bảng giá &amp; Gói cước</h3>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Thiết lập bảng giá vé lượt và gói đăng ký (Tháng &amp; VIP President) dành cho hệ thống.</div>
        </div>
        <button 
          type="button" 
          onClick={activeTab === 'hourly' ? openCreate : openCreatePkg}
          style={{ border: 'none', borderRadius: 8, padding: '10px 18px', background: 'var(--vin-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
        >
          {activeTab === 'hourly' ? '+ Thêm Vé Lượt' : '+ Thêm Gói Dịch Vụ'}
        </button>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', borderBottom: `1px solid #cbd5e1`, gap: '1.5rem', marginBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('hourly')}
          style={{
            background: 'none', border: 'none', padding: '10px 4px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            color: activeTab === 'hourly' ? 'var(--vin-primary)' : '#64748b',
            borderBottom: activeTab === 'hourly' ? `3px solid var(--vin-primary)` : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          🎫 BẢNG GIÁ VÉ LƯỢT
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          style={{
            background: 'none', border: 'none', padding: '10px 4px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            color: activeTab === 'packages' ? 'var(--vin-primary)' : '#64748b',
            borderBottom: activeTab === 'packages' ? `3px solid var(--vin-primary)` : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          💎 GÓI DỊCH VỤ (THÁNG &amp; VIP PRESIDENT)
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: activeTab === 'hourly' ? '1fr 3fr' : '1fr', 
        gap: '1.25rem' 
      }}>

        {/* Sidebar loại xe - chỉ hiện khi ở tab Vé Lượt */}
        {activeTab === 'hourly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Bộ lọc theo xe</div>
              {loading ? (
                <div style={{ color: '#64748b', fontSize: '12px' }}>Đang tải...</div>
              ) : vtypes.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '12px' }}>Chưa có loại xe nào.</div>
              ) : vtypes.map((v) => {
                const isActive = String(vtId(v)) === String(vtId(activeVt));
                const count = policies.filter(p => {
                  const pid = p?.vehicleType?.vehicleTypeId || p?.vehicleType?.id || p?.vehicleTypeId;
                  const matchesType = String(pid) === String(vtId(v));
                  return matchesType && !isPackage(p);
                }).length;
                return (
                  <button key={vtId(v)} type="button" onClick={() => setActiveVt(v)}
                    style={{
                      display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left',
                      padding: '8px 12px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                      border: 'none', background: isActive ? 'var(--vin-primary)' : '#f8fafc', color: isActive ? '#fff' : '#0f172a',
                      transition: 'all 0.2s'
                    }}>
                    <span style={{ fontWeight: 700, fontSize: '12px' }}>{vtName(v)}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>{count} chính sách</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Khu vực bảng hiển thị */}
        {activeTab === 'hourly' ? (
          <div style={{ padding: '16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 8 }}>
            {/* ──── HIỂN THỊ BẢNG GIÁ VÉ LƯỢT ──── */}
            <div>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: 'var(--vin-primary)' }}>
                  Bảng giá lượt: {activeVt ? vtName(activeVt) : 'Tất cả'}
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {filteredHourlyPolicies.length} chính sách đang áp dụng
                </span>
              </div>

              {loading ? (
                <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
              ) : filteredHourlyPolicies.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                  Chưa cấu hình bảng giá lượt cho loại xe này.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: `2px solid #cbd5e1` }}>
                      <th style={{ padding: '10px 8px' }}>TÊN CHÍNH SÁCH</th>
                      <th style={{ padding: '10px 8px' }}>GIÁ CƠ BẢN</th>
                      <th style={{ padding: '10px 8px' }}>THỜI GIAN CƠ BẢN</th>
                      <th style={{ padding: '10px 8px' }}>GIÁ THÊM GIỜ</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHourlyPolicies.map((p) => (
                      <tr key={p.pricePolicyId || p.id} style={{ borderBottom: `1px solid #cbd5e1` }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{p.policyName}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: '#1b6eff' }}>{fmt(p.basePrice)} đ</td>
                        <td style={{ padding: '12px 8px', color: '#64748b' }}>{p.baseDurationMinutes} phút</td>
                        <td style={{ padding: '12px 8px' }}>{fmt(p.extraHourPrice)} đ/giờ</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button type="button" onClick={() => openEdit(p)}
                            style={{ border: `1px solid #3b82f6`, background: '#fff', color: '#3b82f6', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', marginRight: 6, fontSize: '11px', fontWeight: '600' }}>
                            Sửa
                          </button>
                          <button type="button"
                            onClick={() => setDelTarget({ id: p.pricePolicyId || p.id, name: p.policyName })}
                            style={{ border: `1px solid #fca5a5`, background: '#fff5f5', color: '#ef4444', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          /* ──── HIỂN THỊ GÓI DỊCH VỤ (THÁNG & VIP PRESIDENT) - 2 BẢNG BẰNG NHAU SONG SONG ──── */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* BẢNG 1: GÓI VÉ THÁNG */}
            <div style={{ padding: '16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid #cbd5e1`, paddingBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#2563eb' }}>
                  📥 DANH SÁCH GÓI VÉ THÁNG
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
                  {policies.filter(p => (p.policyName || '').startsWith('[Gói Tháng]')).length} gói
                </span>
              </div>

              {loading ? (
                <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '1rem' }}>Đang tải...</div>
              ) : policies.filter(p => (p.policyName || '').startsWith('[Gói Tháng]')).length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>Chưa cấu hình gói vé tháng.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {policies.filter(p => (p.policyName || '').startsWith('[Gói Tháng]')).map((p) => {
                    const details = getPackageDetails(p);
                    const days = Math.round((p.baseDurationMinutes || 0) / (24 * 60));
                    return (
                      <div key={p.pricePolicyId || p.id} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{details.cleanName}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                            <span style={{ backgroundColor: details.typeBg, color: details.typeColor, padding: '2px 6px', borderRadius: 4, fontSize: '9px', fontWeight: '700' }}>{details.typeLabel}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Hạn: {days} ngày</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>•</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{p.vehicleType?.typeName || 'Mọi xe'}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--vin-primary)' }}>{fmt(p.basePrice)} đ</div>
                          <div style={{ marginTop: 6 }}>
                            <button type="button" onClick={() => openEditPkg(p)}
                              style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: '700', fontSize: '11px', cursor: 'pointer', marginRight: 10 }}>
                              Sửa
                            </button>
                            <button type="button" onClick={() => setDelTarget({ id: p.pricePolicyId || p.id, name: p.policyName })}
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BẢNG 2: GÓI VIP PRESIDENT */}
            <div style={{ padding: '16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid #cbd5e1`, paddingBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#d97706' }}>
                  👑 GÓI ĐẶC QUYỀN VIP PRESIDENT
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
                  {policies.filter(p => (p.policyName || '').startsWith('[Gói VIP President]')).length} gói
                </span>
              </div>

              {loading ? (
                <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '1rem' }}>Đang tải...</div>
              ) : policies.filter(p => (p.policyName || '').startsWith('[Gói VIP President]')).length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>Chưa cấu hình gói đặc quyền VIP.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {policies.filter(p => (p.policyName || '').startsWith('[Gói VIP President]')).map((p) => {
                    const details = getPackageDetails(p);
                    const days = Math.round((p.baseDurationMinutes || 0) / (24 * 60));
                    return (
                      <div key={p.pricePolicyId || p.id} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fffbeb' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#78350f' }}>{details.cleanName}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                            <span style={{ backgroundColor: details.typeBg, color: details.typeColor, padding: '2px 6px', borderRadius: 4, fontSize: '9px', fontWeight: '700' }}>{details.typeLabel}</span>
                            <span style={{ fontSize: '11px', color: '#b45309' }}>Hạn: {days} ngày</span>
                            <span style={{ fontSize: '11px', color: '#b45309' }}>•</span>
                            <span style={{ fontSize: '11px', color: '#b45309' }}>{p.vehicleType?.typeName || 'Mọi xe'}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: '#d97706' }}>{fmt(p.basePrice)} đ</div>
                          <div style={{ marginTop: 6 }}>
                            <button type="button" onClick={() => openEditPkg(p)}
                              style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: '700', fontSize: '11px', cursor: 'pointer', marginRight: 10 }}>
                              Sửa
                            </button>
                            <button type="button" onClick={() => setDelTarget({ id: p.pricePolicyId || p.id, name: p.policyName })}
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ════ MODAL: THÊM / SỬA VÉ LƯỢT ════ */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 450, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
              {editId ? 'Chỉnh sửa chính sách vé lượt' : 'Thêm mới chính sách vé lượt'}
            </h3>
            {formErr && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: 8, borderRadius: 6, fontSize: '12px', marginBottom: 12 }}>{formErr}</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>TÊN CHÍNH SÁCH *</label>
                <input type="text" value={form.policyName} onChange={e => setForm({ ...form, policyName: e.target.value })}
                  placeholder="Ví dụ: Vé lượt xe máy ban ngày, ban đêm..."
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>LOẠI XE ÁP DỤNG *</label>
                <select value={form.vehicleTypeId} onChange={e => setForm({ ...form, vehicleTypeId: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}>
                  <option value="">-- Chọn loại xe --</option>
                  {vtypes.map(v => <option key={vtId(v)} value={vtId(v)}>{vtName(v)}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>GIÁ CƠ BẢN (ĐỒNG) *</label>
                  <input type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })}
                    placeholder="Ví dụ: 5000" min="0"
                    style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>HẠN MỨC CƠ BẢN (PHÚT) *</label>
                  <input type="number" value={form.baseDurationMinutes} onChange={e => setForm({ ...form, baseDurationMinutes: e.target.value })}
                    placeholder="Ví dụ: 240 (4 tiếng)" min="1"
                    style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>GIÁ CỘNG THÊM MỖI GIỜ TIẾP THEO (ĐỒNG) *</label>
                <input type="number" value={form.extraHourPrice} onChange={e => setForm({ ...form, extraHourPrice: e.target.value })}
                  placeholder="Ví dụ: 2000" min="0"
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" onClick={closeModal} disabled={saving}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '13px', cursor: 'pointer' }}>
                Hủy bỏ
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                style={{ padding: '8px 16px', backgroundColor: 'var(--vin-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {saving ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: THÊM / SỬA GÓI DỊCH VỤ ════ */}
      {showPkgModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 450, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
              {editPkgId ? 'Chỉnh sửa gói cước đăng ký' : 'Tạo gói cước đăng ký mới'}
            </h3>
            {pkgFormErr && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: 8, borderRadius: 6, fontSize: '12px', marginBottom: 12 }}>{pkgFormErr}</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>TÊN GÓI ĐĂNG KÝ *</label>
                <input type="text" value={pkgForm.packageName} onChange={e => setPkgForm({ ...pkgForm, packageName: e.target.value })}
                  placeholder="Ví dụ: Gói xe máy Standard, VIP Oto..."
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>LOẠI ĐĂNG KÝ (PHÂN KHÚC) *</label>
                <select value={pkgForm.packageType} onChange={e => setPkgForm({ ...pkgForm, packageType: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}>
                  <option value="MONTHLY">Gói cước Tháng (Monthly Package)</option>
                  <option value="VIP_PRESIDENT">Gói cước VIP President (Đặc quyền tối cao)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>LOẠI PHƯƠNG TIỆN ÁP DỤNG *</label>
                <select value={pkgForm.vehicleTypeId} onChange={e => setPkgForm({ ...pkgForm, vehicleTypeId: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}>
                  <option value="">-- Chọn loại xe --</option>
                  {vtypes.map(v => <option key={vtId(v)} value={vtId(v)}>{vtName(v)}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>ĐƠN GIÁ GÓI (ĐỒNG) *</label>
                  <input type="number" value={pkgForm.basePrice} onChange={e => setPkgForm({ ...pkgForm, basePrice: e.target.value })}
                    placeholder="Ví dụ: 120000" min="1"
                    style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>THỜI HẠN HIỆU LỰC (NGÀY) *</label>
                  <input type="number" value={pkgForm.durationDays} onChange={e => setPkgForm({ ...pkgForm, durationDays: e.target.value })}
                    placeholder="Ví dụ: 30" min="1"
                    style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" onClick={closePkgModal} disabled={savingPkg}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '13px', cursor: 'pointer' }}>
                Hủy bỏ
              </button>
              <button type="button" onClick={handleSavePkg} disabled={savingPkg}
                style={{ padding: '8px 16px', backgroundColor: 'var(--vin-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {savingPkg ? 'Đang tạo...' : 'Lưu lại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: XÁC NHẬN XOÁ ════ */}
      {delTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#991b1b' }}>Xác nhận xóa chính sách</h3>
            <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 20px 0' }}>
              Bạn có chắc chắn muốn xóa chính sách <strong style={{ color: '#ef4444' }}>"{delTarget.name}"</strong>? Hành động này sẽ loại bỏ bảng giá này khỏi hệ thống ngay lập tức và không thể khôi phục.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDelTarget(null)} disabled={deleting}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '13px', cursor: 'pointer' }}>
                Hủy
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
