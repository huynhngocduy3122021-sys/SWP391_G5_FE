import { NavLink } from 'react-router-dom';
import { MdDashboard, MdPeople, MdLock, MdSettings, MdComputer, MdListAlt } from 'react-icons/md';

export default function AdminSidebar() {
  const menuItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: <MdDashboard size={20} /> },
    { path: '/admin/users', name: 'User Accounts', icon: <MdPeople size={20} /> },
    { path: '/admin/permissions', name: 'Permissions', icon: <MdLock size={20} /> },
    { path: '/admin/settings', name: 'System Settings', icon: <MdSettings size={20} /> },
    { path: '/admin/ai-config', name: 'AI Configuration', icon: <MdComputer size={20} /> },
    { path: '/admin/logs', name: 'System Logs', icon: <MdListAlt size={20} /> },
  ];

  return (
    <div className="d-flex flex-column bg-white border-end p-4 h-100 text-dark" style={{ width: 260 }}>
      {/* Header */}
      <div className="mb-4 ps-2">
        <h5 className="fw-bold m-0" style={{ letterSpacing: '0.5px' }}>System Admin</h5>
        <small className="text-muted fw-semibold" style={{ fontSize: 11 }}>ENTERPRISE CONTROL</small>
      </div>

      {/* Navigation */}
      <nav className="flex-grow-1 d-flex flex-column gap-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `d-flex align-items-center gap-3 p-3 text-decoration-none rounded-3 fw-medium transition-all ${
                isActive ? 'text-white' : 'text-muted'
              }`
            }
            style={({ isActive }) => ({ backgroundColor: isActive ? 'var(--vin-primary)' : 'transparent' })}
          >
            {item.icon}
            <span style={{ fontSize: 14 }}>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-top pt-3 mt-3 d-flex align-items-center gap-3">
        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold bg-light" 
             style={{ width: 36, height: 36, color: 'var(--vin-primary)' }}>
          AU
        </div>
        <div>
          <div className="fw-semibold" style={{ fontSize: 14 }}>Admin User</div>
          <small className="text-muted d-block" style={{ fontSize: 11 }}>SUPER ADMIN</small>
        </div>
      </div>
    </div>
  );
}