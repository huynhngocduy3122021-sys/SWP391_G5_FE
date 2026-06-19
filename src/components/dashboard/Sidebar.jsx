export default function Sidebar({ activeTab, onTabChange, onLogout }) {
  const role     = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName') || 'User';
  const email    = localStorage.getItem('email')    || '';

  const navItems = [
    { id: 'slots', label: 'Vị trí đỗ xe', icon: '🅿️' },
    ...(role === 'ADMIN' ? [{ id: 'users', label: 'Thành viên', icon: '👥' }] : []),
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: '1.5rem' }}>⚡</span>
        <span>Vinparking</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button key={item.id}
            className={`sidebar-btn ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem', marginBottom: '0.75rem' }}>
          <div className="sidebar-avatar">{fullName.charAt(0).toUpperCase()}</div>
          <div className="vin-truncate">
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }} className="vin-truncate">{email}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              {role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}
            </div>
          </div>
        </div>
        <button className="vin-btn vin-btn--danger vin-btn--full" onClick={onLogout}>Đăng xuất</button>
      </div>
    </aside>
  );
}
