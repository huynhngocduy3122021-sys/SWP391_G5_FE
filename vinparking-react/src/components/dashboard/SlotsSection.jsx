import { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import parkingApi from '../../api/parkingApi';

const emptyForm = { slotCode: '', vehicleType: 'Ô tô', available: 'true' };

export default function SlotsSection() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const role = localStorage.getItem('role');
  const isAdmin = role === 'ADMIN';

  const load = async () => {
    setLoading(true);
    try { setSlots(await parkingApi.getAllSlots()); }
    catch { toast.error('Không tải được danh sách slot!'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const total = slots.length;
  const available = slots.filter(s => s.available).length;

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
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

  return (
    <div className="p-4">
      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Tổng số slot', value: total, icon: '🅿️', color: '#6366f1' },
          { label: 'Còn trống', value: available, icon: '🟢', color: '#10b981' },
          { label: 'Đã đỗ', value: total - available, icon: '🔴', color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="col-md-4">
            <div className="rounded-4 p-4 d-flex align-items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '2rem' }}>{s.icon}</span>
              <div>
                <div style={{ color: s.color, fontSize: '1.8rem', fontWeight: 700 }}>{s.value}</div>
                <div className="text-white-50 small">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid visual */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="text-white fw-bold mb-0">Sơ đồ bãi đỗ</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={load}>🔄 Làm mới</button>
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Thêm Slot</button>}
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        {loading
          ? <div className="text-white-50">Đang tải...</div>
          : slots.map(slot => (
            <div key={slot.id} className="rounded-3 p-2 text-center position-relative"
              style={{ width: 90, background: slot.available ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${slot.available ? '#10b981' : '#ef4444'}`, cursor: 'default' }}>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>ID: {slot.id}</div>
              <div style={{ fontSize: '1.4rem' }}>{slot.available ? '🟢' : vehicleIcon(slot.vehicleType)}</div>
              <div className="fw-bold text-white" style={{ fontSize: '0.75rem' }}>{slot.slotCode}</div>
              <div style={{ fontSize: '0.65rem', color: slot.available ? '#10b981' : '#ef4444' }}>
                {slot.available ? 'Trống' : 'Đã đỗ'}
              </div>
              {isAdmin && (
                <div className="d-flex gap-1 mt-1 justify-content-center">
                  <button className="btn btn-sm p-0 px-1 text-white-50" style={{ fontSize: '0.7rem' }} onClick={() => openEdit(slot)}>✏️</button>
                  <button className="btn btn-sm p-0 px-1 text-danger" style={{ fontSize: '0.7rem' }} onClick={() => handleDelete(slot.id)}>🗑</button>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Table */}
      <h5 className="text-white fw-bold mb-3">Danh sách chi tiết</h5>
      <div className="rounded-4 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <table className="table table-dark table-hover mb-0">
          <thead>
            <tr className="text-white-50" style={{ fontSize: '0.85rem' }}>
              <th>ID</th><th>Mã slot</th><th>Loại xe</th><th>Trạng thái</th>
              {isAdmin && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => (
              <tr key={slot.id}>
                <td className="text-white-50">{slot.id}</td>
                <td className="fw-bold text-white">{slot.slotCode}</td>
                <td className="text-white-50">{slot.vehicleType}</td>
                <td><span className={`badge ${slot.available ? 'bg-success' : 'bg-danger'} bg-opacity-25 ${slot.available ? 'text-success' : 'text-danger'}`}>
                  {slot.available ? 'Còn trống' : 'Đã đỗ'}
                </span></td>
                {isAdmin && (
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(slot)}>📝</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(slot.id)}>🗑️</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ background: '#1e293b', borderColor: 'rgba(255,255,255,0.1)' }}>
          <Modal.Title className="text-white">{editId ? 'Cập nhật Slot' : 'Thêm Slot Mới'}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#1e293b' }}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="text-white-50 small">Mã Slot</Form.Label>
              <Form.Control className="bg-transparent text-white border-secondary"
                value={form.slotCode} onChange={e => setForm({ ...form, slotCode: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-white-50 small">Loại xe</Form.Label>
              <Form.Select className="bg-transparent text-white border-secondary"
                value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
                <option value="Ô tô">Ô tô</option>
                <option value="Xe máy">Xe máy</option>
                <option value="Xe đạp">Xe đạp</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="text-white-50 small">Trạng thái</Form.Label>
              <Form.Select className="bg-transparent text-white border-secondary"
                value={form.available} onChange={e => setForm({ ...form, available: e.target.value })}>
                <option value="true">Còn trống</option>
                <option value="false">Đã đỗ</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ background: '#1e293b', borderColor: 'rgba(255,255,255,0.1)' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmit}>Lưu</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
