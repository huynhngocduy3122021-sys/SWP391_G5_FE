import { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import authApi from '../../api/authApi';

export default function UsersSection() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ userFullName: '', userEmail: '', userPhone: '', userAddress: '' });

  const load = async () => {
    try { setUsers(await authApi.getAllUsers()); }
    catch { toast.error('Không tải được danh sách thành viên!'); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ userFullName: user.userFullName, userEmail: user.userEmail, userPhone: user.userPhone, userAddress: user.userAddress });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      await authApi.updateUser(editUser.userId, form);
      toast.success('Cập nhật thành công!');
      setShowModal(false);
      load();
    } catch { toast.error('Không thể cập nhật!'); }
  };

  const handleToggle = async (id) => {
    try { await authApi.deleteUser(id); toast.success('Đã thay đổi trạng thái!'); load(); }
    catch { toast.error('Lỗi thao tác!'); }
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="text-white fw-bold mb-0">Quản lý thành viên</h5>
        <button className="btn btn-outline-secondary btn-sm" onClick={load}>🔄 Làm mới</button>
      </div>

      <div className="rounded-4 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <table className="table table-dark table-hover mb-0">
          <thead>
            <tr className="text-white-50" style={{ fontSize: '0.85rem' }}>
              <th>ID</th><th>Họ tên</th><th>Email</th><th>Điện thoại</th>
              <th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.userId} className={user.deleted ? 'opacity-50' : ''}>
                <td className="text-white-50">{user.userId}</td>
                <td className="fw-bold text-white">{user.userFullName}</td>
                <td className="text-white-50">{user.userEmail}</td>
                <td className="text-white-50">{user.userPhone}</td>
                <td><span className={`badge ${user.userRole === 'ADMIN' ? 'bg-info' : 'bg-secondary'} bg-opacity-25 ${user.userRole === 'ADMIN' ? 'text-info' : 'text-secondary'}`}>
                  {user.userRole}
                </span></td>
                <td><span className={`badge ${user.deleted ? 'bg-danger' : 'bg-success'} bg-opacity-25 ${user.deleted ? 'text-danger' : 'text-success'}`}>
                  {user.deleted ? 'Đã khóa' : 'Hoạt động'}
                </span></td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(user)}>📝</button>
                  <button className={`btn btn-sm ${user.deleted ? 'btn-outline-success' : 'btn-outline-danger'}`}
                    onClick={() => handleToggle(user.userId)}>
                    {user.deleted ? '🔄' : '🚫'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ background: '#1e293b', borderColor: 'rgba(255,255,255,0.1)' }}>
          <Modal.Title className="text-white">Cập nhật thành viên</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#1e293b' }}>
          <Form>
            {[
              { label: 'Họ tên', field: 'userFullName' },
              { label: 'Email', field: 'userEmail' },
              { label: 'Điện thoại', field: 'userPhone' },
              { label: 'Địa chỉ', field: 'userAddress' },
            ].map(({ label, field }) => (
              <Form.Group className="mb-3" key={field}>
                <Form.Label className="text-white-50 small">{label}</Form.Label>
                <Form.Control className="bg-transparent text-white border-secondary"
                  value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
              </Form.Group>
            ))}
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
