import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Vị trí',    to: '/locations' },
  { label: 'Bảng giá',  to: '/pricing' },
  { label: 'Liên hệ',   to: '/contact' },
];

export default function Navbar() {
  const isLoggedIn = !!localStorage.getItem('token');
  const fullName = localStorage.getItem('fullName') || 'User';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=164e63&color=fff`;

  return (
    <header className="glass-nav">
      <Link to="/" className="nav-logo">
        <span style={{ fontSize: '1.4rem' }}>⚡</span>
        <span>Vinparking</span>
      </Link>

      <nav>
        <ul className="nav-links">
          {NAV_ITEMS.map((item, i) => (
            <li key={i}><Link to={item.to}>{item.label}</Link></li>
          ))}
        </ul>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="nav-search">
          <span>🔍</span>
          <input placeholder="Tìm bãi đỗ..." />
        </div>
        
        {isLoggedIn ? (
          <Link to="/user-dashboard" className="text-decoration-none d-flex align-items-center gap-2 px-3 py-1 rounded-pill ms-2" style={{ backgroundColor: '#164e63' }}>
            <span className="text-white fw-bold small d-none d-md-block">{fullName}</span>
            <div className="rounded-circle overflow-hidden bg-white" style={{ width: '28px', height: '28px' }}>
              <img src={avatarUrl} alt="User" className="w-100 h-100 object-fit-cover" />
            </div>
          </Link>
        ) : (
          <Link to="/auth" className="vin-btn vin-btn--primary vin-btn--pill">Đăng nhập</Link>
        )}
      </div>
    </header>
  );
}
