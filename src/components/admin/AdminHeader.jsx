import React, { useState, useRef, useEffect } from 'react';
import { MdSearch, MdNotificationsNone, MdOutlineSettings, MdKeyboardArrowDown, MdLogout, MdPerson } from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const initials = user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'AD';
  return (
    <div style={{ height: '64px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #eef0f3' }}>
      
      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f3f5f9', padding: '8px 16px', borderRadius: '8px', width: '320px' }}>
        <MdSearch style={{ color: '#9093a3', marginRight: '8px', fontSize: '20px' }} />
        <input 
          type="text" 
          placeholder="Search system entities..." 
          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: 'var(--vin-text-main)' }}
        />
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', cursor: 'pointer', color: '#5e6278', display: 'flex' }}>
          <MdNotificationsNone style={{ fontSize: '22px' }} />
          <span style={{ position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', backgroundColor: '#ff4d4f', borderRadius: '50%' }}></span>
        </div>
        <MdOutlineSettings style={{ fontSize: '22px', color: '#5e6278', cursor: 'pointer' }} />
        
        {/* User Profile Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--vin-primary)', color: 'var(--vin-text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' }}>
              {initials}
            </div>
            <MdKeyboardArrowDown style={{ color: '#5e6278', fontSize: '20px', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
          </div>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              backgroundColor: '#fff', border: '1px solid #eef0f3', borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.05)', minWidth: '200px', zIndex: 1000, overflow: 'hidden'
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #eef0f3' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--vin-text-main)' }}>{user?.fullName || 'Admin User'}</div>
                <div style={{ fontSize: '12px', color: '#9093a3', marginTop: '2px' }}>{user?.email || 'admin@system.com'}</div>
              </div>
              <div style={{ padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', color: '#5e6278', fontSize: '13px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#f3f5f9'; e.currentTarget.style.color = 'var(--vin-text-main)'}} onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#5e6278'}}>
                  <MdPerson style={{ fontSize: '18px' }} /> My Profile
                </div>
                <div 
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: '500', transition: 'background 0.2s', marginTop: '4px' }} 
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'} 
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <MdLogout style={{ fontSize: '18px' }} /> Logout
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;