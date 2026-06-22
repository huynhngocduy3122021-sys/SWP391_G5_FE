import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Topbar "PARK-OPS PRO" — giống header trong cả 2 ảnh thiết kế
export default function StaffTopbar({ mode, onModeChange, stats }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    toast.info('Đã đăng xuất!');
    navigate('/');
  };

  const fullName = localStorage.getItem('fullName') || 'Staff';

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--vin-border)',
      background: 'rgba(15,23,42,0.95)', flexWrap: 'wrap', gap: '1rem',
    }}>
      {/* Logo */}
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', lineHeight: 1.1 }}>PARK-OPS</div>
        <div style={{ fontSize: '0.7rem', color: '#38bdf8', letterSpacing: '0.1em' }}>PRO</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
        <StatItem label="TOTAL VEHICLES" value={`${stats.totalVehicles} / ${stats.maxVehicles}`} />
        <StatItem label="TODAY'S REVENUE" value={`$${stats.todayRevenue.toLocaleString()}`} color="var(--vin-success)" />
        <StatItem label="BOOKINGS" value={stats.bookings} />
        <StatItem label="EXITED" value={stats.exited} />
        <StatItem label="SLOTS LEFT" value={stats.slotsLeft} color="var(--vin-success)" />
      </div>

      {/* Mode toggle + clock + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 2 }}>
          {['ENTRY', 'EXIT'].map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className="vin-btn vin-btn--sm"
              style={{
                background: mode === m ? '#3b82f6' : 'transparent',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.6)',
              }}
            >
              {m === 'ENTRY' ? 'Vào' : 'Ra'}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
          🕐 {now.toLocaleTimeString('en-US')}
        </span>

        <div
          className="sidebar-avatar"
          style={{ width: 32, height: 32, fontSize: '0.85rem', cursor: 'pointer' }}
          title={fullName}
          onClick={handleLogout}
        >
          {fullName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontWeight: 700, color: color || '#fff', fontSize: '0.95rem' }}>{value}</div>
    </div>
  );
}

// Mock — thay bằng kết quả staffApi.getShiftOverview()
export const MOCK_STATS = {
  totalVehicles: 1245, maxVehicles: 2000, todayRevenue: 14580,
  bookings: 42, exited: 391, slotsLeft: 755,
};
