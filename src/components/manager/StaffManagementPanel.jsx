import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import authApi from '../../api/authApi';

/* ── helpers ─────────────────────────────────── */
const ROLE_LABELS = { ADMIN: 'Quản trị', MANAGER: 'Quản lý', STAFF: 'Nhân viên', USER: 'Khách hàng' };
const roleColor = (r) => ({ ADMIN: '#7c3aed', MANAGER: '#0d9488', STAFF: '#1f6a85', USER: '#94a3b8' }[r] || '#94a3b8');

const EMPTY_FORM = { userFullName: '', userEmail: '', userPhone: '', userAddress: '' };

/* ── main component ───────────────────────────── */
export default function StaffManagementPanel() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal sửa
  const [editTarget, setEditTarget] = useState(null); // user object
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formErr,    setFormErr]    = useState('');

  // Modal xóa
  const [delTarget, setDelTarget] = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  /* ── fetch ── */
  const fetchUsers = async () => {
    setLoading(true);
    const managerBranchId = localStorage.getItem('parkingBranchId');
    try {
      const data = await authApi.getAllUsers();
      const parsed = Array.isArray(data) ? data : [];
      setUsers(managerBranchId 
        ? parsed.filter(u => String(u.parkingBranchId) === String(managerBranchId))
        : parsed
      );
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  /* ── derived ── */
  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'ALL' || u.userRole === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || u.userFullName?.toLowerCase().includes(q)
      || u.userEmail?.toLowerCase().includes(q)
      || u.userPhone?.includes(q);
    return matchRole && matchSearch;
  });

  const staffCount = users.filter(u => u.userRole === 'STAFF').length;
  const activeCount = users.filter(u => !u.deleted && !u.locked).length;

  /* ── modal helpers ── */
  const openEdit = (u) => {
    setEditTarget(u);
    setForm({
      userFullName: u.userFullName || '',
      userEmail:    u.userEmail    || '',
      userPhone:    u.userPhone    || '',
      userAddress:  u.userAddress  || '',
    });
    setFormErr('');
  };

  const closeEdit = () => { setEditTarget(null); setFormErr(''); };

  /* ── save ── */
  const handleSave = async () => {
    if (!form.userFullName.trim()) return setFormErr('Vui lòng nhập họ tên.');
    if (!form.userEmail.trim())    return setFormErr('Vui lòng nhập email.');
    if (!form.userPhone.trim())    return setFormErr('Vui lòng nhập số điện thoại.');
    if (!form.userAddress.trim())  return setFormErr('Vui lòng nhập địa chỉ.');

    setSaving(true);
    try {
      await authApi.updateUser(editTarget.userId, form);
      closeEdit();
      fetchUsers();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || 'Cập nhật thất bại!';
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
      await authApi.deleteUser(delTarget.userId);
      setDelTarget(null);
      fetchUsers();
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

      {/* Stats banner */}
      <div style={{ ...card, background: mt.primary, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Quản lý Người dùng &amp; Nhân sự</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Xem, chỉnh sửa và quản lý toàn bộ tài khoản hệ thống.</div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{users.length}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>TỔNG TÀI KHOẢN</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{staffCount}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>NHÂN VIÊN</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeCount}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>ĐANG HOẠT ĐỘNG</div>
          </div>
        </div>
      </div>

      {/* Bộ lọc + tìm kiếm */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="🔍 Tìm theo tên, email, SĐT..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
        />
        {['ALL', 'ADMIN', 'MANAGER', 'STAFF', 'USER'].map(r => (
          <button key={r} type="button" onClick={() => setRoleFilter(r)}
            style={{
              border: `1px solid ${roleFilter === r ? mt.primary : mt.border}`,
              background: roleFilter === r ? mt.primary : '#fff',
              color: roleFilter === r ? '#fff' : mt.text,
              borderRadius: 20, padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
            }}>
            {r === 'ALL' ? 'Tất cả' : ROLE_LABELS[r]}
          </button>
        ))}
        <button type="button" onClick={fetchUsers}
          style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 8, padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>
          🔄 Làm mới
        </button>
      </div>

      {/* Bảng danh sách */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: mt.text }}>
            Danh sách người dùng
            <span style={{ fontSize: '0.75rem', color: mt.textMuted, fontWeight: 400, marginLeft: 8 }}>
              ({filtered.length} / {users.length} tài khoản)
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: mt.textMuted, padding: '2rem' }}>Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: mt.textMuted, padding: '2rem' }}>Không tìm thấy tài khoản nào.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: mt.textMuted, textAlign: 'left', borderBottom: `2px solid ${mt.border}` }}>
                <th style={{ padding: '8px' }}>HỌ TÊN</th>
                <th style={{ padding: '8px' }}>EMAIL</th>
                <th style={{ padding: '8px' }}>SỐ ĐIỆN THOẠI</th>
                <th style={{ padding: '8px' }}>VAI TRÒ</th>
                <th style={{ padding: '8px' }}>TRẠNG THÁI</th>
                <th style={{ padding: '8px' }}>VI PHẠM</th>
                <th style={{ padding: '8px' }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.userId} style={{ borderBottom: `1px solid ${mt.border}` }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{u.userFullName || '—'}</td>
                  <td style={{ padding: '8px', color: mt.textMuted }}>{u.userEmail || '—'}</td>
                  <td style={{ padding: '8px' }}>{u.userPhone || '—'}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      background: roleColor(u.userRole) + '20', color: roleColor(u.userRole),
                      borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700,
                    }}>
                      {ROLE_LABELS[u.userRole] || u.userRole}
                    </span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    {u.deleted ? (
                      <span style={{ color: mt.danger, fontWeight: 600 }}>● Đã xóa</span>
                    ) : u.locked ? (
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>🔒 Bị khóa</span>
                    ) : (
                      <span style={{ color: mt.success, fontWeight: 600 }}>● Hoạt động</span>
                    )}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{
                      background: u.violationCount > 0 ? '#fef2f2' : '#f0fdf4',
                      color: u.violationCount > 0 ? mt.danger : mt.success,
                      borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700,
                    }}>
                      {u.violationCount}
                    </span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button type="button" onClick={() => openEdit(u)}
                      style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', marginRight: 6, fontSize: '0.75rem' }}>
                      ✎ Sửa
                    </button>
                    <button type="button" onClick={() => setDelTarget(u)}
                      style={{ border: '1px solid #fca5a5', background: '#fff5f5', color: mt.danger, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>
                      🗑 Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ════ MODAL: Sửa user ════ */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1f6a85)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700 }}>✎ Cập nhật thông tin</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem' }}>ID: {editTarget.userId} — {editTarget.userEmail}</div>
              </div>
              <button onClick={closeEdit} disabled={saving}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formErr && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.5rem 0.75rem', color: mt.danger, fontSize: '0.8rem' }}>
                  ⚠ {formErr}
                </div>
              )}
              {[
                { label: 'Họ và tên *',    field: 'userFullName', type: 'text' },
                { label: 'Email *',        field: 'userEmail',    type: 'email' },
                { label: 'Số điện thoại *', field: 'userPhone',   type: 'tel' },
                { label: 'Địa chỉ *',      field: 'userAddress',  type: 'text' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{label}</label>
                  <input type={type} value={form[field]}
                    onChange={e => { setFormErr(''); setForm({ ...form, [field]: e.target.value }); }}
                    style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${mt.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeEdit} disabled={saving}
                style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleSave} disabled={saving}
                style={{ border: 'none', background: 'linear-gradient(135deg,#0f172a,#1f6a85)', color: '#fff', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 700 }}>
                {saving ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: Xác nhận xóa ════ */}
      {delTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'linear-gradient(135deg,#7f1d1d,#dc2626)', padding: '1rem 1.5rem', color: '#fff', fontWeight: 700 }}>
              🗑 Xóa tài khoản
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p>Bạn có chắc muốn xóa tài khoản <strong style={{ color: mt.danger }}>"{delTarget.userFullName}"</strong>?</p>
              <p style={{ fontSize: '0.8rem', color: mt.textMuted }}>Email: {delTarget.userEmail}</p>
              <p style={{ fontSize: '0.8rem', color: mt.textMuted }}>Hành động này không thể hoàn tác.</p>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${mt.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDelTarget(null)} disabled={deleting}
                style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ border: 'none', background: '#dc2626', color: '#fff', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 700 }}>
                {deleting ? 'Đang xóa...' : 'Xóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
