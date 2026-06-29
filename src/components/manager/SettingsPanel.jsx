import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
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

/* ── main component ───────────────────────────── */
export default function SettingsPanel() {
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

  const filteredPackagePolicies = activeVt
    ? policies.filter(p => {
        const pid = p?.vehicleType?.vehicleTypeId || p?.vehicleType?.id || p?.vehicleTypeId;
        return String(pid) === String(vtId(activeVt)) && isPackage(p);
      })
    : policies.filter(p => isPackage(p));

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

    // Định dạng tên lưu trữ: [Gói Tháng] Tên hoặc [Gói VIP President] Tên
    const prefix = pkgForm.packageType === 'MONTHLY' ? '[Gói Tháng] ' : '[Gói VIP President] ';
    const policyName = prefix + pkgForm.packageName.trim();

    const payload = {
      policyName: policyName,
      basePrice: Number(pkgForm.basePrice),
      baseDurationMinutes: Number(pkgForm.durationDays) * 24 * 60, // Đổi từ ngày sang phút
      extraHourPrice: 0, // Gói dịch vụ đăng ký không áp dụng phí thêm giờ lẻ
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: mt.primary }}>Cấu hình hệ thống</div>
          <div style={{ fontSize: '0.85rem', color: mt.textMuted }}>Thiết lập bảng giá vé lượt và gói đăng ký (Tháng &amp; VIP President)</div>
        </div>
        <button 
          type="button" 
          onClick={activeTab === 'hourly' ? openCreate : openCreatePkg}
          style={{ border: 'none', borderRadius: 8, padding: '10px 18px', background: mt.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
        >
          {activeTab === 'hourly' ? '+ Thêm Vé Lượt' : '+ Thêm Gói Dịch Vụ'}
        </button>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${mt.border}`, gap: '1.5rem', marginBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('hourly')}
          style={{
            background: 'none', border: 'none', padding: '10px 4px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            color: activeTab === 'hourly' ? mt.primary : mt.textMuted,
            borderBottom: activeTab === 'hourly' ? `3px solid ${mt.primary}` : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          🎫 BẢNG GIÁ VÉ LƯỢT
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          style={{
            background: 'none', border: 'none', padding: '10px 4px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            color: activeTab === 'packages' ? mt.primary : mt.textMuted,
            borderBottom: activeTab === 'packages' ? `3px solid ${mt.primary}` : '3px solid transparent',
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
            <div style={card}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '13px', color: mt.textMuted, textTransform: 'uppercase' }}>Bộ lọc theo xe</div>
              {loading ? (
                <div style={{ color: mt.textMuted, fontSize: '13px' }}>Đang tải...</div>
              ) : vtypes.length === 0 ? (
                <div style={{ color: mt.textMuted, fontSize: '13px' }}>Chưa có loại xe nào.</div>
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
                      border: 'none', background: isActive ? mt.primary : '#f8fafc', color: isActive ? '#fff' : mt.text,
                      transition: 'all 0.2s'
                    }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{vtName(v)}</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>{count} chính sách</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Khu vực bảng hiển thị */}
        {activeTab === 'hourly' ? (
          <div style={card}>
            {/* ──── HIỂN THỊ BẢNG GIÁ VÉ LƯỢT ──── */}
            <div>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: mt.primary }}>
                  Bảng giá lượt: {activeVt ? vtName(activeVt) : 'Tất cả'}
                </h3>
                <span style={{ fontSize: '12px', color: mt.textMuted }}>
                  {filteredHourlyPolicies.length} chính sách đang áp dụng
                </span>
              </div>

              {loading ? (
                <div style={{ color: mt.textMuted, fontSize: '13px', textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
              ) : filteredHourlyPolicies.length === 0 ? (
                <div style={{ color: mt.textMuted, fontSize: '13px', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                  Chưa cấu hình bảng giá lượt cho loại xe này.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ color: mt.textMuted, textAlign: 'left', borderBottom: `2px solid ${mt.border}` }}>
                      <th style={{ padding: '10px 8px' }}>TÊN CHÍNH SÁCH</th>
                      <th style={{ padding: '10px 8px' }}>GIÁ CƠ BẢN</th>
                      <th style={{ padding: '10px 8px' }}>THỜI GIAN CƠ BẢN</th>
                      <th style={{ padding: '10px 8px' }}>GIÁ THÊM GIỜ</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHourlyPolicies.map((p) => (
                      <tr key={p.pricePolicyId || p.id} style={{ borderBottom: `1px solid ${mt.border}` }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{p.policyName}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: mt.primary }}>{fmt(p.basePrice)} đ</td>
                        <td style={{ padding: '12px 8px', color: mt.textMuted }}>{p.baseDurationMinutes} phút</td>
                        <td style={{ padding: '12px 8px' }}>{fmt(p.extraHourPrice)} đ/giờ</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button type="button" onClick={() => openEdit(p)}
                            style={{ border: `1px solid #3b82f6`, background: '#fff', color: '#3b82f6', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', marginRight: 6, fontSize: '11px', fontWeight: '600' }}>
                            Sửa
                          </button>
                          <button type="button"
                            onClick={() => setDelTarget({ id: p.pricePolicyId || p.id, name: p.policyName })}
                            style={{ border: `1px solid #fca5a5`, background: '#fff5f5', color: mt.danger, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
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
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${mt.border}`, paddingBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#2563eb' }}>
                  📥 DANH SÁCH GÓI VÉ THÁNG
                </h3>
                <span style={{ fontSize: '11px', color: mt.textMuted, fontWeight: '700' }}>
                  {policies.filter(p => (p.policyName || '').startsWith('[Gói Tháng]')).length} gói
                </span>
              </div>

              {loading ? (
                <div style={{ color: mt.textMuted, fontSize: '13px', textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
              ) : policies.filter(p => (p.policyName || '').startsWith('[Gói Tháng]')).length === 0 ? (
                <div style={{ color: mt.textMuted, fontSize: '13px', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                  Chưa cấu hình gói vé tháng nào.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ color: mt.textMuted, textAlign: 'left', borderBottom: `2px solid ${mt.border}` }}>
                      <th style={{ padding: '8px 4px' }}>LOẠI XE</th>
                      <th style={{ padding: '8px 4px' }}>TÊN GÓI</th>
                      <th style={{ padding: '8px 4px' }}>THỜI HẠN</th>
                      <th style={{ padding: '8px 4px' }}>ĐƠN GIÁ</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies
                      .filter(p => (p.policyName || '').startsWith('[Gói Tháng]'))
                      .map((p) => {
                        const details = getPackageDetails(p);
                        const durationDays = Math.round((p.baseDurationMinutes || 0) / (24 * 60));
                        return (
                          <tr key={p.pricePolicyId || p.id} style={{ borderBottom: `1px solid ${mt.border}` }}>
                            <td style={{ padding: '10px 4px', fontWeight: '700', color: mt.primary }}>
                              {vtName(p.vehicleType)}
                            </td>
                            <td style={{ padding: '10px 4px', fontWeight: '600' }}>{details.cleanName}</td>
                            <td style={{ padding: '10px 4px', color: mt.textMuted }}>{durationDays} ngày</td>
                            <td style={{ padding: '10px 4px', fontWeight: '700', color: '#2563eb' }}>{fmt(p.basePrice)} đ</td>
                            <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                              <button type="button" onClick={() => openEditPkg(p)}
                                style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: 8, fontSize: '11px', fontWeight: '700' }}>
                                Sửa
                              </button>
                              <button type="button"
                                onClick={() => setDelTarget({ id: p.pricePolicyId || p.id, name: p.policyName })}
                                style={{ border: 'none', background: 'none', color: mt.danger, cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>

            {/* BẢNG 2: GÓI VIP PRESIDENT */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${mt.border}`, paddingBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#d97706' }}>
                  💎 GÓI VIP PRESIDENT
                </h3>
                <span style={{ fontSize: '11px', color: mt.textMuted, fontWeight: '700' }}>
                  {policies.filter(p => (p.policyName || '').startsWith('[Gói VIP President]')).length} gói
                </span>
              </div>

              {loading ? (
                <div style={{ color: mt.textMuted, fontSize: '13px', textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
              ) : policies.filter(p => (p.policyName || '').startsWith('[Gói VIP President]')).length === 0 ? (
                <div style={{ color: mt.textMuted, fontSize: '13px', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                  Chưa cấu hình gói VIP President nào.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ color: mt.textMuted, textAlign: 'left', borderBottom: `2px solid ${mt.border}` }}>
                      <th style={{ padding: '8px 4px' }}>LOẠI XE</th>
                      <th style={{ padding: '8px 4px' }}>TÊN GÓI</th>
                      <th style={{ padding: '8px 4px' }}>THỜI HẠN</th>
                      <th style={{ padding: '8px 4px' }}>ĐƠN GIÁ</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies
                      .filter(p => (p.policyName || '').startsWith('[Gói VIP President]'))
                      .map((p) => {
                        const details = getPackageDetails(p);
                        const durationDays = Math.round((p.baseDurationMinutes || 0) / (24 * 60));
                        return (
                          <tr key={p.pricePolicyId || p.id} style={{ borderBottom: `1px solid ${mt.border}` }}>
                            <td style={{ padding: '10px 4px', fontWeight: '700', color: mt.primary }}>
                              {vtName(p.vehicleType)}
                            </td>
                            <td style={{ padding: '10px 4px', fontWeight: '600' }}>{details.cleanName}</td>
                            <td style={{ padding: '10px 4px', color: mt.textMuted }}>{durationDays} ngày</td>
                            <td style={{ padding: '10px 4px', fontWeight: '700', color: '#d97706' }}>{fmt(p.basePrice)} đ</td>
                            <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                              <button type="button" onClick={() => openEditPkg(p)}
                                style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: 8, fontSize: '11px', fontWeight: '700' }}>
                                Sửa
                              </button>
                              <button type="button"
                                onClick={() => setDelTarget({ id: p.pricePolicyId || p.id, name: p.policyName })}
                                style={{ border: 'none', background: 'none', color: mt.danger, cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ════ MODAL: Tạo / Sửa chính sách vé lượt ════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#2563eb)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700 }}>{editId ? '✎ Sửa chính sách giá lượt' : '+ Tạo chính sách giá lượt'}</div>
              <button onClick={closeModal} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formErr && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.5rem 0.75rem', color: mt.danger, fontSize: '13px' }}>
                  ⚠️ {formErr}
                </div>
              )}

              {[
                { label: 'Tên chính sách *', field: 'policyName', type: 'text', placeholder: 'VD: Giá xe máy ban ngày' },
                { label: 'Giá cơ bản (VND) *', field: 'basePrice', type: 'number', placeholder: 'VD: 5000' },
                { label: 'Thời gian cơ bản (phút) *', field: 'baseDurationMinutes', type: 'number', placeholder: 'VD: 60' },
                { label: 'Giá thêm mỗi giờ (VND) *', field: 'extraHourPrice', type: 'number', placeholder: 'VD: 2000' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{label}</label>
                  <input type={type} placeholder={placeholder} value={form[field]}
                    onChange={e => { setFormErr(''); setForm({ ...form, [field]: e.target.value }); }}
                    style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Loại xe *</label>
                <select value={form.vehicleTypeId}
                  onChange={e => { setFormErr(''); setForm({ ...form, vehicleTypeId: e.target.value }); }}
                  style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}>
                  <option value="">-- Chọn loại xe --</option>
                  {vtypes.map(v => <option key={vtId(v)} value={vtId(v)}>{vtName(v)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${mt.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeModal} disabled={saving}
                style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
              <button onClick={handleSave} disabled={saving}
                style={{ border: 'none', background: mt.primary, color: '#fff', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                {saving ? 'Đang lưu...' : (editId ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: Tạo / Sửa gói dịch vụ (Tháng & VIP) ════ */}
      {showPkgModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#d97706)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700 }}>{editPkgId ? '✎ Sửa Gói Dịch Vụ' : '+ Tạo Gói Dịch Vụ Mới'}</div>
              <button onClick={closePkgModal} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pkgFormErr && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.5rem 0.75rem', color: mt.danger, fontSize: '13px' }}>
                  ⚠️ {pkgFormErr}
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Tên gói dịch vụ *</label>
                <input type="text" placeholder="VD: Gói phổ thông, VIP Premium" value={pkgForm.packageName}
                  onChange={e => { setPkgFormErr(''); setPkgForm({ ...pkgForm, packageName: e.target.value }); }}
                  style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Phân loại gói *</label>
                  <select value={pkgForm.packageType}
                    onChange={e => { setPkgFormErr(''); setPkgForm({ ...pkgForm, packageType: e.target.value }); }}
                    style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}>
                    <option value="MONTHLY">Gói Vé Tháng</option>
                    <option value="VIP_PRESIDENT">Gói VIP President</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Thời hạn (Ngày) *</label>
                  <input type="number" placeholder="VD: 30, 90, 365" value={pkgForm.durationDays}
                    onChange={e => { setPkgFormErr(''); setPkgForm({ ...pkgForm, durationDays: e.target.value }); }}
                    style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Giá đăng ký (VND) *</label>
                  <input type="number" placeholder="VD: 200000" value={pkgForm.basePrice}
                    onChange={e => { setPkgFormErr(''); setPkgForm({ ...pkgForm, basePrice: e.target.value }); }}
                    style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Loại xe áp dụng *</label>
                  <select value={pkgForm.vehicleTypeId}
                    onChange={e => { setPkgFormErr(''); setPkgForm({ ...pkgForm, vehicleTypeId: e.target.value }); }}
                    style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}>
                    <option value="">-- Chọn loại xe --</option>
                    {vtypes.map(v => <option key={vtId(v)} value={vtId(v)}>{vtName(v)}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${mt.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closePkgModal} disabled={savingPkg}
                style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
              <button onClick={handleSavePkg} disabled={savingPkg}
                style={{ border: 'none', background: '#d97706', color: '#fff', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                {savingPkg ? 'Đang lưu...' : (editPkgId ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: Xác nhận xóa chính sách ════ */}
      {delTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'linear-gradient(135deg,#7f1d1d,#dc2626)', padding: '1rem 1.5rem', color: '#fff', fontWeight: 700 }}>🗑 Xóa chính sách/gói giá</div>
            <div style={{ padding: '1.5rem' }}>
              <p>Bạn có chắc muốn xóa chính sách <strong style={{ color: mt.danger }}>"{delTarget.name}"</strong>?</p>
              <p style={{ fontSize: '0.8rem', color: mt.textMuted }}>Hành động này không thể hoàn tác.</p>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${mt.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDelTarget(null)} disabled={deleting}
                style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ border: 'none', background: '#dc2626', color: '#fff', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 700 }}>
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
