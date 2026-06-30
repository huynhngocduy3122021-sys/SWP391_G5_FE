import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../../api/manager';

/* ── helpers ─────────────────────────────────── */
const vtId   = (v) => v?.vehicleTypeId || v?.id || '';
const vtName = (v) => v?.typeName || v?.vehicleTypeName || v?.name || `Loại ${vtId(v)}`;
const fmt    = (n) => Number(n || 0).toLocaleString('vi-VN');

const EMPTY_FORM = {
  policyName: '', basePrice: '', baseDurationMinutes: '', extraHourPrice: '', vehicleTypeId: '',
};

/* ── main component ───────────────────────────── */
export default function SettingsPanel() {
  const [vtypes,    setVtypes]    = useState([]);
  const [policies,  setPolicies]  = useState([]);
  const [activeVt,  setActiveVt]  = useState(null); // vehicleType object đang chọn
  const [loading,   setLoading]   = useState(false);

  // Modal tạo / sửa
  const [showModal, setShowModal]   = useState(false);
  const [editId,    setEditId]      = useState(null); // null = tạo mới
  const [form,      setForm]        = useState(EMPTY_FORM);
  const [saving,    setSaving]      = useState(false);
  const [formErr,   setFormErr]     = useState('');

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
    } catch {
      setVtypes([]); setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  /* ── derived ── */
  const filteredPolicies = activeVt
    ? policies.filter(p => {
        const pid = p?.vehicleType?.vehicleTypeId || p?.vehicleType?.id || p?.vehicleTypeId;
        return String(pid) === String(vtId(activeVt));
      })
    : policies;

  /* ── modal helpers ── */
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

  /* ── save ── */
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
      } else {
        await managerApi.createPricePolicy(payload);
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

  /* ── delete ── */
  const handleDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await managerApi.deletePricePolicy(delTarget.id);
      setDelTarget(null);
      fetchAll();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || 'Xóa thất bại!';
      alert(String(msg));
    } finally {
      setDeleting(false);
    }
  };

  /* ── render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: mt.text }}>Cấu hình Loại xe &amp; Bảng giá</div>
          <div style={{ fontSize: '0.8rem', color: mt.textMuted }}>Quản lý định nghĩa phương tiện và các quy tắc tính phí đỗ xe.</div>
        </div>
        <button type="button" onClick={openCreate}
          style={{ border: 'none', borderRadius: 8, padding: '0.6rem 1rem', background: mt.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
          + Thêm Chính Sách Giá
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>

        {/* Sidebar loại xe */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Danh sách loại xe</div>
            {loading ? (
              <div style={{ color: mt.textMuted, fontSize: '0.8rem' }}>Đang tải...</div>
            ) : vtypes.length === 0 ? (
              <div style={{ color: mt.textMuted, fontSize: '0.8rem' }}>Chưa có loại xe nào.</div>
            ) : vtypes.map((v) => {
              const isActive = String(vtId(v)) === String(vtId(activeVt));
              const count = policies.filter(p => {
                const pid = p?.vehicleType?.vehicleTypeId || p?.vehicleType?.id || p?.vehicleTypeId;
                return String(pid) === String(vtId(v));
              }).length;
              return (
                <button key={vtId(v)} type="button" onClick={() => setActiveVt(v)}
                  style={{
                    display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left',
                    padding: '0.6rem 0.75rem', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                    border: 'none', background: isActive ? mt.primary : '#f8fafc', color: isActive ? '#fff' : mt.text,
                  }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{vtName(v)}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>{count} chính sách giá</span>
                </button>
              );
            })}
          </div>

          <div style={{ ...card, background: mt.primary, color: '#fff' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>TRẠNG THÁI ÁP DỤNG</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>Chính sách Hiện hành</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 6 }}>&#9679; Đang áp dụng cho toàn hệ thống</div>
          </div>
        </div>

        {/* Bảng giá */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700 }}>
                Bảng giá: {activeVt ? vtName(activeVt) : 'Tất cả'}
              </div>
              <div style={{ fontSize: '0.7rem', color: mt.textMuted }}>
                {filteredPolicies.length} chính sách
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ color: mt.textMuted, fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
          ) : filteredPolicies.length === 0 ? (
            <div style={{ color: mt.textMuted, fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
              Chưa có chính sách giá. Bấm "+ Thêm" để tạo mới.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>TÊN CHÍNH SÁCH</th>
                  <th style={{ padding: '6px 8px' }}>GIÁ CƠ BẢN</th>
                  <th style={{ padding: '6px 8px' }}>THỜI GIAN CƠ BẢN</th>
                  <th style={{ padding: '6px 8px' }}>GIÁ THÊM GIỜ</th>
                  <th style={{ padding: '6px 8px' }}>HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((p) => (
                  <tr key={p.pricePolicyId || p.id} style={{ borderTop: `1px solid ${mt.border}` }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{p.policyName}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: mt.primary }}>{fmt(p.basePrice)} đ</td>
                    <td style={{ padding: '8px', color: mt.textMuted }}>{p.baseDurationMinutes} phút</td>
                    <td style={{ padding: '8px' }}>{fmt(p.extraHourPrice)} đ/giờ</td>
                    <td style={{ padding: '8px' }}>
                      <button type="button" onClick={() => openEdit(p)}
                        style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', marginRight: 6, fontSize: '0.75rem' }}>
                        ✎ Sửa
                      </button>
                      <button type="button"
                        onClick={() => setDelTarget({ id: p.pricePolicyId || p.id, name: p.policyName })}
                        style={{ border: `1px solid #fca5a5`, background: '#fff5f5', color: mt.danger, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>
                        🗑 Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ════ MODAL: Tạo / Sửa chính sách ════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {/* Modal header */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#0d9488)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700 }}>{editId ? '✎ Sửa chính sách giá' : '+ Tạo chính sách giá'}</div>
              <button onClick={closeModal} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formErr && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.5rem 0.75rem', color: mt.danger, fontSize: '0.8rem' }}>
                  ⚠ {formErr}
                </div>
              )}

              {[
                { label: 'Tên chính sách *', field: 'policyName', type: 'text', placeholder: 'VD: Giá xe máy ban ngày' },
                { label: 'Giá cơ bản (VND) *', field: 'basePrice', type: 'number', placeholder: 'VD: 5000' },
                { label: 'Thời gian cơ bản (phút) *', field: 'baseDurationMinutes', type: 'number', placeholder: 'VD: 60' },
                { label: 'Giá thêm mỗi giờ (VND) *', field: 'extraHourPrice', type: 'number', placeholder: 'VD: 2000' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{label}</label>
                  <input type={type} placeholder={placeholder} value={form[field]}
                    onChange={e => { setFormErr(''); setForm({ ...form, [field]: e.target.value }); }}
                    style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Loại xe *</label>
                <select value={form.vehicleTypeId}
                  onChange={e => { setFormErr(''); setForm({ ...form, vehicleTypeId: e.target.value }); }}
                  style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}>
                  <option value="">-- Chọn loại xe --</option>
                  {vtypes.map(v => <option key={vtId(v)} value={vtId(v)}>{vtName(v)}</option>)}
                </select>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${mt.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeModal} disabled={saving}
                style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}>Hủy</button>
              <button onClick={handleSave} disabled={saving}
                style={{ border: 'none', background: 'linear-gradient(135deg,#0f172a,#0d9488)', color: '#fff', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                {saving ? 'Đang lưu...' : (editId ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: Xác nhận xóa ════ */}
      {delTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'linear-gradient(135deg,#7f1d1d,#dc2626)', padding: '1rem 1.5rem', color: '#fff', fontWeight: 700 }}>🗑 Xóa chính sách giá</div>
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
