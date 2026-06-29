import { useState } from 'react';
import ManagerTopbar from './ManagerTopbar';
import StaffManagementPanel from './StaffManagementPanel';
import ZoneOverviewPanel from './ZoneOverviewPanel';
import ReportsPanel from './ReportsPanel';
import SettingsPanel from './SettingsPanel';
import OverviewPanel from './OverviewPanel';
import IncidentPanel from './IncidentPanel';
import { mt } from './managerTheme';

const NAV_ITEMS = [
  { key: 'overview',  label: 'Dashboard',        icon: '\u25A6' },
  { key: 'zones',     label: 'Sơ đồ bãi xe',       icon: '\u25A3' },
  { key: 'staff',     label: 'Quản lý Nhân sự',   icon: '\u263A' },
  { key: 'incidents', label: 'Quản lý Sự cố',    icon: '\u26A0' },
  { key: 'reports',   label: 'Báo cáo doanh thu',  icon: '\u25B2' },
  { key: 'settings',  label: 'Cấu hình hệ thống', icon: '\u2699' },
];

export default function ManagerDashboard() {
  const [tab, setTab] = useState('overview');
  const managerName = localStorage.getItem('fullName') || 'Manager';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userId');
    window.location.href = '/auth';
  };

  const renderPanel = () => {
    switch (tab) {
      case 'zones':     return <ZoneOverviewPanel />;
      case 'staff':     return <StaffManagementPanel />;
      case 'incidents': return <IncidentPanel />;
      case 'reports':   return <ReportsPanel />;
      case 'settings':  return <SettingsPanel />;
      default:          return <OverviewPanel onNavigate={setTab} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: mt.bg, fontFamily: 'inherit' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, background: mt.sidebarBg,
        borderRight: `1px solid ${mt.border}`, display: 'flex', flexDirection: 'column',
        padding: '1.5rem 1rem', position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem', padding: '0 0.25rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: mt.primary, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
          }}>P</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: mt.text, lineHeight: 1.1 }}>{managerName}</div>
            <div style={{ fontSize: '0.65rem', color: mt.textMuted, letterSpacing: '0.05em' }}>PARKING MANAGEMENT</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                padding: '0.6rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: tab === item.key ? 600 : 500,
                background: tab === item.key ? '#0f172a' : 'transparent',
                color: tab === item.key ? '#fff' : '#334155',
              }}
            >
              <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: `1px solid ${mt.border}`, paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button type="button" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.75rem',
            borderRadius: 8, border: 'none', background: 'transparent', color: '#334155',
            fontSize: '0.875rem', textAlign: 'left', cursor: 'pointer',
          }}>
            <span>?</span> Trung tâm hỗ trợ
          </button>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.75rem',
              borderRadius: 8, border: 'none', background: 'transparent', color: mt.danger,
              fontSize: '0.875rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer',
            }}
          >
            <span>&larr;</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ManagerTopbar title={NAV_ITEMS.find((n) => n.key === tab)?.label || 'Dashboard'} />
        <main style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          {renderPanel()}
        </main>
      </div>
    </div>
  );
}
