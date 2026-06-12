import { Link } from 'react-router-dom';

export default function Navbar() {
  const navItems = [
    { label: 'Trang chủ', to: '/' },
    { label: 'Vị trí', to: '/locations' },
    { label: 'Bảng giá', to: '/pricing' },
    { label: 'Liên hệ', to: '/contact' }
  ];

  return (
    <header className="d-flex align-items-center justify-content-between px-5 py-3 sticky-top glass-nav z-3">
      <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
        <span className="fs-4">⚡</span>
        <span className="fw-bold fs-5 text-white">Vinparking</span>
      </Link>

      <nav className="d-flex gap-4">
        {navItems.map((item, i) => (
          <Link key={i} to={item.to} className="text-white-50 text-decoration-none hover-text-white transition-all small">
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-white bg-opacity-10">
          <span>🔍</span>
          <input className="bg-transparent border-0 text-white shadow-none" 
                 style={{ width: '140px' }} placeholder="Tìm bãi đỗ..." />
        </div>
        <Link to="/auth" className="btn btn-primary px-4 rounded-pill">Đăng nhập</Link>
      </div>
    </header>
  );
}