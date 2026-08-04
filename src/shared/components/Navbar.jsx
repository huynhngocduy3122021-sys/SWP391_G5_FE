// Navbar - Thanh điều hướng dùng chung cho cả trang public và user
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../shared/hooks/useAuth';

const NAV_ITEMS = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Vị trí', to: '/locations' },
  { label: 'Bảng giá', to: '/pricing' },
];

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const isLoggedIn = !!user;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fullName = user?.fullName || 'User';
  const email = user?.email || '';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=164e63&color=fff`;


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    logout();
    setDropdownOpen(false);
    toast.info('Đã đăng xuất!');
  };

  return (
    <header className="glass-nav">
      <Link to="/" className="nav-logo" style={{ textDecoration: 'none', gap: '8px' }}>
        <div style={{ background: '#164e63', color: '#fff', borderRadius: '4px', padding: '2px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="fw-bold" style={{ letterSpacing: '2px', fontSize: '1.2rem' }}>≡</span>
        </div>
        <span className="fw-bold m-0" style={{ color: '#164e63', fontSize: '1.4rem' }}>Vinparking</span>
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
          <input
            placeholder="Tìm bãi đỗ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate('/locations', { state: { searchQuery: searchQuery.trim() } });
                setSearchQuery('');
              }
            }}
          />
        </div>

        {isLoggedIn ? (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(22,78,99,0.85)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '999px', padding: '0.3rem 0.75rem 0.3rem 0.3rem',
                cursor: 'pointer', color: '#fff',
              }}
            >
              <img
                src={avatarUrl} alt="avatar"
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fullName}
              </span>
              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{dropdownOpen ? '▲' : '▼'}</span>
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                zIndex: 999, overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={avatarUrl} alt="avatar" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{fullName}</div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>{email}</div>
                    </div>
                  </div>
                </div>

                {/* Menu */}
                <div style={{ padding: '0.5rem' }}>
                   {[
                    { icon: '👤', label: 'Hồ sơ của tôi', to: role === 'staff' ? '/staff/profile' : '/user-dashboard', tab: 'profile' },
                    role !== 'staff' && { icon: '🚗', label: 'Phương tiện & Gói cước', to: '/user-dashboard', tab: 'vehicles' },
                    role !== 'staff' && { icon: '📅', label: 'Lịch sử giữ chỗ', to: '/user-dashboard', tab: 'bookings' },
                  ].filter(Boolean).map((item) => (
                    <Link key={item.label} to={item.to} state={{ activeTab: item.tab }}
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.65rem',
                        padding: '0.6rem 0.75rem', borderRadius: 8,
                        color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                        fontSize: '0.875rem', fontWeight: 500,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {item.icon} {item.label}
                    </Link>
                  ))}

                  {role === 'manager' && (
                    <Link to="/manager-dashboard"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.65rem',
                        padding: '0.6rem 0.75rem', borderRadius: 8,
                        color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                        fontSize: '0.875rem', fontWeight: 500,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      📊 Quản lý hệ thống
                    </Link>
                  )}

                  {role === 'admin' && (
                    <Link to="/admin/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.65rem',
                        padding: '0.6rem 0.75rem', borderRadius: 8,
                        color: '#38bdf8', textDecoration: 'none',
                        fontSize: '0.875rem', fontWeight: 700,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      🛡️ Admin Portal
                    </Link>
                  )}

                  {role === 'staff' && (
                    <>
                      <Link to="/staff/entry"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.65rem',
                          padding: '0.6rem 0.75rem', borderRadius: 8,
                          color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                          fontSize: '0.875rem', fontWeight: 500,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        📥 Quản lý Cổng vào
                      </Link>
                      <Link to="/staff/exit"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.65rem',
                          padding: '0.6rem 0.75rem', borderRadius: 8,
                          color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                          fontSize: '0.875rem', fontWeight: 500,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        📤 Quản lý Cổng ra
                      </Link>
                    </>
                  )}

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0.25rem 0' }} />

                  <button onClick={handleLogoutClick}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.65rem',
                      padding: '0.6rem 0.75rem', borderRadius: 8, width: '100%',
                      background: 'transparent', border: 'none',
                      color: '#f87171', fontSize: '0.875rem', fontWeight: 500,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/auth" className="vin-btn vin-btn--primary vin-btn--pill">Đăng nhập</Link>
        )}
      </div>
    </header>
  );
}
