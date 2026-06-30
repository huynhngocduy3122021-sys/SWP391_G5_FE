import { useState, useEffect } from 'react';
import ManagerTopbar from './ManagerTopbar';
import ZoneOverviewPanel from './ZoneOverviewPanel';
import SettingsPanel from './SettingsPanel';
import OverviewPanel from './OverviewPanel';
import IncidentPanel from './IncidentPanel';
import BookingPanel from './BookingPanel';
import MemberPanel from './MemberPanel';
import IotPanel from './IotPanel';
import { mt } from './managerTheme';
import authApi from '../../api/authApi';

const NAV_ITEMS = [
  { key: 'overview',  label: 'Dashboard',        icon: '\u25A6' },
  { key: 'bookings',  label: 'Quản lý Booking',    icon: '\u2637' },
  { key: 'members',   label: 'Thẻ Thành viên',   icon: '\u25EB' },
  { key: 'zones',     label: 'Sơ đồ bãi xe',       icon: '\u25A3' },
  { key: 'iot',       label: 'IoT',                icon: '\u25C9' },
  { key: 'incidents', label: 'Quản lý Sự cố',    icon: '\u26A0' },
  { key: 'settings',  label: 'Cấu hình hệ thống', icon: '\u2699' },
];

export default function ManagerDashboard() {
  const [tab, setTab] = useState('overview');
  const [loadingBranch, setLoadingBranch] = useState(true);
  const [branchName, setBranchName] = useState('');
  
  const userId = localStorage.getItem('userId');
  const managerName = localStorage.getItem('fullName') || 'Manager';

  useEffect(() => {
    const fetchManagerBranch = async () => {
      if (!userId) {
        setLoadingBranch(false);
        return;
      }
      try {
        const user = await authApi.getUserById(userId);
        if (user && user.parkingBranchId) {
          localStorage.setItem('parkingBranchId', user.parkingBranchId);
          localStorage.setItem('parkingBranchName', user.parkingBranchName || '');
          setBranchName(user.parkingBranchName || '');
        } else {
          localStorage.removeItem('parkingBranchId');
          localStorage.removeItem('parkingBranchName');
          setBranchName('');
        }
      } catch (err) {
        console.error("Failed to fetch manager branch info:", err);
      } finally {
        setLoadingBranch(false);
      }
    };
    fetchManagerBranch();
  }, [userId]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/auth';
  };

  const renderPanel = () => {
    switch (tab) {
      case 'bookings':  return <BookingPanel />;
      case 'members':   return <MemberPanel />;
      case 'zones':     return <ZoneOverviewPanel />;
      case 'iot':       return <IotPanel />;
      case 'incidents': return <IncidentPanel />;
      case 'settings':  return <SettingsPanel />;
      default:          return <OverviewPanel onNavigate={setTab} />;
    }
  };

  if (loadingBranch) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: mt.bg, color: mt.text
      }}>
        <div className="spinner-border" style={{ color: mt.primary, marginBottom: '1rem' }} role="status" />
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Đang xác thực chi nhánh quản lý...</div>
      </div>
    );
  }

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
            <div style={{ fontSize: '0.65rem', color: mt.textMuted, letterSpacing: '0.05em', marginBottom: '2px' }}>PARKING MANAGEMENT</div>
            {branchName && (
              <div style={{ fontSize: '0.7rem', color: mt.primary, fontWeight: 700 }}>📍 {branchName}</div>
            )}
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
