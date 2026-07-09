import { useState, useEffect, useRef } from 'react';
import { mt } from './managerTheme';

export default function ManagerTopbar({ title, onProfileClick }) {
  const fullName = localStorage.getItem('fullName') || 'Manager';
  const role = localStorage.getItem('role') || 'manager';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'M';

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/auth';
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 1.5rem', background: '#fff', borderBottom: `1px solid ${mt.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: mt.text, margin: 0, whiteSpace: 'nowrap' }}>
          {title || 'Manager Dashboard'}
        </h1>
        <div style={{
          flex: 1, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 8,
          background: '#f1f5f9', borderRadius: 8, padding: '0.45rem 0.75rem',
        }}>
          <span style={{ color: mt.textMuted, fontSize: '0.85rem' }}>&#9906;</span>
          <input
            type="text"
            placeholder="Tim kiem bien so, ma the..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button type="button" style={{
          position: 'relative', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem',
        }}>
          &#128276;
        </button>
        
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)} 
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            title="Tài khoản"
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#dbeafe', color: '#1e3a8a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem',
            }}>{initials}</div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: mt.text }}>{fullName}</div>
              <div style={{ fontSize: '0.7rem', color: mt.textMuted }}>{role}</div>
            </div>
          </div>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#ffffff', border: `1px solid ${mt.border}`,
              borderRadius: 8, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              zIndex: 999, overflow: 'hidden'
            }}>
              <div style={{ padding: '0.5rem' }}>
                <button onClick={() => { setDropdownOpen(false); onProfileClick(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 0.75rem', borderRadius: 6, width: '100%',
                    background: 'transparent', border: 'none',
                    color: mt.text, fontSize: '0.85rem', fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  👤 Hồ sơ của tôi
                </button>
                <div style={{ borderTop: `1px solid ${mt.border}`, margin: '0.25rem 0' }} />
                <button onClick={() => { setDropdownOpen(false); handleLogout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 0.75rem', borderRadius: 6, width: '100%',
                    background: 'transparent', border: 'none',
                    color: mt.danger, fontSize: '0.85rem', fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
