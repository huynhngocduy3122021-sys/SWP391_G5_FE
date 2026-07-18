// UsersSection - Hiển thị và quản lý thông tin người dùng trong dashboard
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import authApi from '../../auth/api/authApi';

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

  const fields = [
    { label: 'Họ tên',     field: 'userFullName' },
    { label: 'Email',      field: 'userEmail' },
    { label: 'Điện thoại', field: 'userPhone' },
    { label: 'Địa chỉ',   field: 'userAddress' },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h5 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Quản lý thành viên</h5>
        <button className="vin-btn vin-btn--secondary vin-btn--sm" onClick={load}>🔄 Làm mới</button>
      </div>

      <div className="vin-table-wrap">
        <table className="vin-table">
          <thead>
            <tr>
              <th>ID</th><th>Họ tên</th><th>Email</th><th>Điện thoại</th>
              <th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.userId} style={{ opacity: user.deleted ? 0.5 : 1 }}>
                <td style={{ color: 'rgba(255,255,255,0.5)' }}>{user.userId}</td>
                <td style={{ fontWeight: 700, color: '#fff' }}>{user.userFullName}</td>
                <td style={{ color: 'rgba(255,255,255,0.5)' }}>{user.userEmail}</td>
                <td style={{ color: 'rgba(255,255,255,0.5)' }}>{user.userPhone}</td>
                <td>
                  <span className={`vin-badge ${user.userRole === 'ADMIN' ? 'vin-badge--info' : 'vin-badge--secondary'}`}>
                    {user.userRole}
                  </span>
                </td>
                <td>
                  <span className={`vin-badge ${user.deleted ? 'vin-badge--danger' : 'vin-badge--success'}`}>
                    {user.deleted ? 'Đã khóa' : 'Hoạt động'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="vin-btn vin-btn--secondary vin-btn--sm" onClick={() => openEdit(user)}>📝</button>
                  <button
                    className={`vin-btn vin-btn--sm ${user.deleted ? 'vin-btn--success' : 'vin-btn--danger'}`}
                    onClick={() => handleToggle(user.userId)}>
                    {user.deleted ? '🔄' : '🚫'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="vin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="vin-modal" onClick={e => e.stopPropagation()}>
            <div className="vin-modal__header">
              <h5>Cập nhật thành viên</h5>
              <button className="vin-modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="vin-modal__body">
              {fields.map(({ label, field }) => (
                <div className="vin-field" key={field}>
                  <label>{label}</label>
                  <input value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
                </div>
              ))}
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
