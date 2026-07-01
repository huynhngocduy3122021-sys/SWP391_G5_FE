import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import parkingApi from '../../api/parkingApi';

const emptyForm = { slotCode: '', vehicleType: 'Ô tô', available: 'true' };

export default function SlotsSection() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const isAdmin = localStorage.getItem('role')?.toUpperCase() === 'ADMIN';

  const load = async () => {
    setLoading(true);
    try { setSlots(await parkingApi.getAllSlots()); }
    catch { toast.error('Không tải được danh sách slot!'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const total     = slots.length;
  const available = slots.filter(s => s.available).length;

  const openAdd  = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (slot) => {
    setEditId(slot.id);
    setForm({ slotCode: slot.slotCode, vehicleType: slot.vehicleType, available: String(slot.available) });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(`Xóa Slot ID ${id}?`)) return;
    try { await parkingApi.deleteSlot(id); toast.success('Đã xóa!'); load(); }
    catch { toast.error('Lỗi xóa slot!'); }
  };

  const handleSubmit = async () => {
    const data = { ...form, available: form.available === 'true' };
    try {
      if (editId) { await parkingApi.updateSlot(editId, data); toast.success(`Cập nhật Slot ID ${editId} thành công!`); }
      else { await parkingApi.createSlot(data); toast.success('Tạo slot thành công!'); }
      setShowModal(false);
      load();
    } catch { toast.error('Lỗi thao tác slot!'); }
  };

  const vehicleIcon = (type) => {
    if (type?.includes('máy')) return '🏍️';
    if (type?.includes('đạp')) return '🚲';
    return '🚗';
  };

  const stats = [
    { label: 'Tổng số slot', value: total,           icon: '🅿️', color: '#6366f1' },
    { label: 'Còn trống',   value: available,         icon: '🟢', color: '#10b981' },
    { label: 'Đã đỗ',       value: total - available, icon: '🔴', color: '#ef4444' },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="vin-card stat-card">
            <span className="stat-card__icon">{s.icon}</span>
            <div>
              <div className="stat-card__value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h5 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Sơ đồ bãi đỗ</h5>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="vin-btn vin-btn--secondary vin-btn--sm" onClick={load}>🔄 Làm mới</button>
          {isAdmin && <button className="vin-btn vin-btn--primary vin-btn--sm" onClick={openAdd}>+ Thêm Slot</button>}
        </div>
      </div>

      {/* Slot grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {loading
          ? <span style={{ color: 'rgba(255,255,255,0.5)' }}>Đang tải...</span>
          : slots.map(slot => (
            <div key={slot.id} className={`slot-cell ${slot.available ? 'slot-cell--free' : 'slot-cell--taken'}`}>
              <div className="slot-cell__id">ID: {slot.id}</div>
              <div className="slot-cell__icon">{slot.available ? '🟢' : vehicleIcon(slot.vehicleType)}</div>
              <div className="slot-cell__code">{slot.slotCode}</div>
              <div className={`slot-cell__status ${slot.available ? 'slot-cell__status--free' : 'slot-cell__status--taken'}`}>
                {slot.available ? 'Trống' : 'Đã đỗ'}
              </div>
              {isAdmin && (
                <div className="slot-cell__actions">
                  <button onClick={() => openEdit(slot)}>✏️</button>
                  <button onClick={() => handleDelete(slot.id)}>🗑</button>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Table */}
      <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.75rem' }}>Danh sách chi tiết</h5>
      <div className="vin-table-wrap">
        <table className="vin-table">
          <thead>
            <tr>
              <th>ID</th><th>Mã slot</th><th>Loại xe</th><th>Trạng thái</th>
              {isAdmin && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => (
              <tr key={slot.id}>
                <td style={{ color: 'rgba(255,255,255,0.5)' }}>{slot.id}</td>
                <td style={{ fontWeight: 700, color: '#fff' }}>{slot.slotCode}</td>
                <td style={{ color: 'rgba(255,255,255,0.5)' }}>{slot.vehicleType}</td>
                <td>
                  <span className={`vin-badge ${slot.available ? 'vin-badge--success' : 'vin-badge--danger'}`}>
                    {slot.available ? 'Còn trống' : 'Đã đỗ'}
                  </span>
                </td>
                {isAdmin && (
                  <td style={{ display: 'flex', gap: '0.35rem' }}>
                    <button className="vin-btn vin-btn--secondary vin-btn--sm" onClick={() => openEdit(slot)}>📝</button>
                    <button className="vin-btn vin-btn--danger    vin-btn--sm" onClick={() => handleDelete(slot.id)}>🗑️</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="vin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="vin-modal" onClick={e => e.stopPropagation()}>
            <div className="vin-modal__header">
              <h5>{editId ? 'Cập nhật Slot' : 'Thêm Slot Mới'}</h5>
              <button className="vin-modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="vin-modal__body">
              <div className="vin-field">
                <label>Mã Slot</label>
                <input value={form.slotCode} onChange={e => setForm({ ...form, slotCode: e.target.value })} />
              </div>
              <div className="vin-field">
                <label>Loại xe</label>
                <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
                  <option value="Ô tô">Ô tô</option>
                  <option value="Xe máy">Xe máy</option>
                  <option value="Xe đạp">Xe đạp</option>
                </select>
              </div>
              <div className="vin-field">
                <label>Trạng thái</label>
                <select value={form.available} onChange={e => setForm({ ...form, available: e.target.value })}>
                  <option value="true">Còn trống</option>
                  <option value="false">Đã đỗ</option>
                </select>
              </div>
            </div>
            <div className="vin-modal__footer">
              <button className="vin-btn vin-btn--secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="vin-btn vin-btn--primary"   onClick={handleSubmit}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
