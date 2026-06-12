export default function Sidebar({ activeTab, onTabChange, onLogout }) {
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName') || 'User';
  const email = localStorage.getItem('email') || '';

  const navItems = [
    { id: 'slots', label: 'Vị trí đỗ xe', icon: '🅿️' },
    ...(role === 'ADMIN' ? [{ id: 'users', label: 'Thành viên', icon: '👥' }] : []),
  ];

  return (
    <aside className="d-flex flex-column p-3"
      style={{ width: 240, minHeight: '100vh', background: 'rgba(15,23,42,0.95)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Logo */}
      <div className="d-flex align-items-center gap-2 px-2 py-3 mb-4">
        <span style={{ fontSize: '1.5rem' }}>⚡</span>
        <span className="fw-bold text-white fs-5">Vinparking</span>
      </div>

      {/* Nav */}
      <nav className="flex-grow-1">
        {navItems.map(item => (
          <button key={item.id}
            className={`btn w-100 text-start d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded-3 ${activeTab === item.id ? 'btn-primary' : 'text-white-50'}`}
            style={{ background: activeTab === item.id ? undefined : 'transparent', fontSize: '0.95rem' }}
            onClick={() => onTabChange(item.id)}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>

      {/* User info */}
      <div className="border-top pt-3" style={{ borderColor: 'rgba(255,255,255,0.08) !important' }}>
        <div className="d-flex align-items-center gap-3 px-2 mb-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
            style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366f1,#a855f7)', fontSize: '1rem' }}>
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="text-white fw-semibold small text-truncate">{email}</div>
            <div className="text-white-50" style={{ fontSize: '0.75rem' }}>
              {role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}
            </div>
          </div>
        </div>
        <button className="btn btn-outline-danger btn-sm w-100" onClick={onLogout}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
