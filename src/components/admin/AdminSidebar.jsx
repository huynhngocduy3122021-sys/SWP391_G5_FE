import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdDashboard, MdPeople, MdLock, MdSettings, MdPayment, MdComputer, MdListAlt } from 'react-icons/md';

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
    <div style={{ width: '260px', backgroundColor: '#111322', color: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
      {/* Logo / Header Sidebar */}
      <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
        <div style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '0.5px' }}>System Admin</div>
        <div style={{ fontSize: '11px', color: '#464962', fontWeight: '600', marginTop: '4px' }}>ENTERPRISE CONTROL</div>
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
              fontWeight: '500',
              transition: 'all 0.2s',
              backgroundColor: isActive ? '#1b6eff' : 'transparent',
              color: isActive ? '#fff' : '#787a91',
            })}
          >
            <span style={{ fontSize: '20px', display: 'flex' }}>{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Thông tin tài khoản Admin ở dưới cùng */}
      <div style={{ borderTop: '1px solid #1f2235', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2a2d44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1b6eff' }}>AU</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Admin User</div>
          <div style={{ fontSize: '11px', color: '#464962' }}>SUPER ADMIN</div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;