import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Vị trí',    to: '/locations' },
  { label: 'Bảng giá',  to: '/pricing' },
  { label: 'Liên hệ',   to: '/contact' },
];

export default function Navbar() {
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
        <Link to="/auth" className="vin-btn vin-btn--primary vin-btn--pill">Đăng nhập</Link>
      </div>
    </header>
  );
}
