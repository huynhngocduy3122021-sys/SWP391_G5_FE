import { useState, useEffect } from 'react';
import ManagerTopbar from './ManagerTopbar';
import ZoneOverviewPanel from './ZoneOverviewPanel';
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
];

export default function ManagerDashboard() {
  const [tab, setTab] = useState('overview');
  const [loadingBranch, setLoadingBranch] = useState(true);
  const [branchName, setBranchName] = useState(() => localStorage.getItem('parkingBranchName') || '');
  const [branchId, setBranchId] = useState(() => {
    const cached = localStorage.getItem('parkingBranchId');
    return (cached && cached !== 'undefined' && cached !== 'null' && cached !== '') ? cached : null;
  });
  
  const userId = localStorage.getItem('userId');
  const managerName = localStorage.getItem('fullName') || 'Manager';

  useEffect(() => {
    const fetchManagerBranch = async () => {
      if (!userId) {
        setLoadingBranch(false);
        return;
      }
      // Nếu đã có branchId trong localStorage (lưu từ lúc đăng nhập), dùng luôn và bỏ qua loading
      const cachedBranchId = localStorage.getItem('parkingBranchId');
      const cachedBranchName = localStorage.getItem('parkingBranchName');
      if (cachedBranchId && cachedBranchId !== 'undefined' && cachedBranchId !== 'null' && cachedBranchId !== '') {
        setBranchId(cachedBranchId);
        setBranchName(cachedBranchName || '');
        setLoadingBranch(false);
        // Vẫn gọi API ở background để cập nhật mới nhất
        try {
          const user = await authApi.getUserById(userId);
          const uBranchId =
            user?.parkingBranchId ||
            user?.branchId ||
            user?.parkingBranch?.parkingBranchId ||
            user?.parkingBranch?.id ||
            user?.branch?.id;
          const uBranchName =
            user?.parkingBranchName ||
            user?.branchName ||
            user?.parkingBranch?.branchName ||
            user?.parkingBranch?.parkingBranchName ||
            user?.branch?.branchName ||
            '';
          if (uBranchId) {
            localStorage.setItem('parkingBranchId', String(uBranchId));
            localStorage.setItem('parkingBranchName', uBranchName);
            setBranchId(String(uBranchId));
            setBranchName(uBranchName);
          }
        } catch (err) {
          console.warn('Background branch refresh failed:', err);
        }
        return;
      }

      // Chưa có trong localStorage => gọi API
      try {
        const user = await authApi.getUserById(userId);
        const uBranchId =
          user?.parkingBranchId ||
          user?.branchId ||
          user?.parkingBranch?.parkingBranchId ||
          user?.parkingBranch?.id ||
          user?.branch?.id;
        const uBranchName =
          user?.parkingBranchName ||
          user?.branchName ||
          user?.parkingBranch?.branchName ||
          user?.parkingBranch?.parkingBranchName ||
          user?.branch?.branchName ||
          '';
        
        if (user && uBranchId) {
          localStorage.setItem('parkingBranchId', String(uBranchId));
          localStorage.setItem('parkingBranchName', uBranchName);
          setBranchName(uBranchName);
          setBranchId(String(uBranchId));
        } else {
          localStorage.removeItem('parkingBranchId');
          localStorage.removeItem('parkingBranchName');
          setBranchName('');
          setBranchId(null);
        }
      } catch (err) {
        console.error('Failed to fetch manager branch info:', err);
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
      case 'bookings':  return <BookingPanel branchId={branchId} />;
      case 'members':   return <MemberPanel branchId={branchId} />;
      case 'zones':     return <ZoneOverviewPanel branchId={branchId} />;
      case 'iot':       return <IotPanel branchId={branchId} />;
      case 'incidents': return <IncidentPanel branchId={branchId} />;
      default:          return <OverviewPanel onNavigate={setTab} branchId={branchId} />;
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

  // Cảnh báo nếu manager chưa được gán chi nhánh
  if (!branchId) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: mt.bg, color: mt.text, gap: '1rem', padding: '2rem'
      }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: mt.text }}>Tài khoản chưa được gán chi nhánh</div>
        <div style={{ fontSize: '0.875rem', color: mt.textMuted, textAlign: 'center', maxWidth: 400 }}>
          Tài khoản manager của bạn (<strong>{managerName}</strong>) chưa được Admin gán vào chi nhánh nào.
          Vui lòng liên hệ Quản trị viên hệ thống để được cấp quyền quản lý chi nhánh.
        </div>
        <button
          onClick={handleLogout}
          style={{
            marginTop: '1rem', padding: '10px 24px', background: mt.danger,
            color: 'var(--vin-text-main)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer'
          }}
        >
          ← Đăng xuất
        </button>
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
            width: 36, height: 36, borderRadius: 8, background: mt.primary, color: 'var(--vin-text-main)',
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
                background: tab === item.key ? 'var(--vin-primary)' : 'transparent',
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
