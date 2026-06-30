import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdDashboard, MdPeople, MdLock, MdSettings, MdPayment, MdComputer, MdListAlt, MdHelpOutline, MdHeadsetMic, MdAdd } from 'react-icons/md';

const AdminSidebar = () => {
  const menuItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: <MdDashboard /> },
    { path: '/admin/users', name: 'User Accounts', icon: <MdPeople /> },
    { path: '/admin/permissions', name: 'Permissions', icon: <MdLock /> },
    { path: '/admin/settings', name: 'System Settings', icon: <MdSettings /> },
    { path: '/admin/payments', name: 'Payments', icon: <MdPayment /> },
    { path: '/admin/ai-config', name: 'AI Configuration', icon: <MdComputer /> },
    { path: '/admin/logs', name: 'System Logs', icon: <MdListAlt /> },
  ];

  return (
    <div style={{ width: '260px', backgroundColor: '#2b2d42', color: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
      {/* Logo / Header Sidebar */}
      <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
        <div style={{ fontWeight: '700', fontSize: '16px', color: '#1b6eff' }}>Enterprise Admin</div>
        <div style={{ fontSize: '11px', color: '#787a91', fontWeight: '600', marginTop: '4px' }}>V 4.2.0</div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              backgroundColor: isActive ? '#e0f2fe' : 'transparent',
              color: isActive ? '#0ea5e9' : '#fff',
            })}
          >
            <span style={{ fontSize: '20px', display: 'flex' }}>{item.icon}</span>
            {item.name}
          </NavLink>
        ))}

        <div style={{ marginTop: '24px', paddingLeft: '16px', paddingRight: '16px' }}>
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#1b6eff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            <MdAdd style={{ fontSize: '18px' }} /> New System Audit
          </button>
        </div>
      </nav>

      {/* Footer Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '16px', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
          <MdHelpOutline style={{ fontSize: '18px' }} /> Documentation
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
          <MdHeadsetMic style={{ fontSize: '18px' }} /> Contact support
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;