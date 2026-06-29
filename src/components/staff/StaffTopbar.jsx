import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import managerApi from '../../api/manager';
import bookingApi from '../../api/bookingApi';

// Topbar "PARK-OPS PRO" — giống header trong cả 2 ảnh thiết kế
export default function StaffTopbar({ mode, onModeChange }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  
  const [liveStats, setLiveStats] = useState({
    totalVehicles: 0,
    maxVehicles: 2000,
    todayRevenue: 0,
    bookings: 0,
    exited: 0,
    slotsLeft: 2000
  });

  const branchIdStr = localStorage.getItem('parkingBranchId');
  const branchId = branchIdStr ? Number(branchIdStr) : null;

  const fetchLiveStats = async () => {
    try {
      const [sessionsData, bookingsData, zonesData] = await Promise.all([
        managerApi.getAllSessions().catch(() => []),
        bookingApi.getAllBookings().catch(() => []),
        managerApi.getAllZones().catch(() => [])
      ]);

      const branchSessions = branchId 
        ? sessionsData.filter(s => s.parkingBranchId === branchId)
        : sessionsData;
      const branchBookings = branchId
        ? bookingsData.filter(b => b.parkingBranchId === branchId)
        : bookingsData;
      const branchZones = branchId
        ? zonesData.filter(z => z.parkingBranchId === branchId)
        : zonesData;

      const maxVehicles = branchZones.reduce((sum, z) => sum + Number(z.capacity || 0), 0) || 2000;
      const totalVehicles = branchSessions.filter(s => String(s.sessionStatus || '').toUpperCase() === 'ACTIVE').length;

      const getRefDate = () => {
        if (branchSessions.length === 0) return new Date();
        const dates = branchSessions
          .map(s => s.checkOutTime || s.checkInTime ? new Date(s.checkOutTime || s.checkInTime) : null)
          .filter(Boolean);
        if (dates.length === 0) return new Date();
        return new Date(Math.max(...dates));
      };

      const refDate = getRefDate();
      const todayStart = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
      const todayEnd = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999);

      const todayCompletedSessions = branchSessions.filter(s => {
        if (!s.checkOutTime) return false;
        const outDate = new Date(s.checkOutTime);
        return outDate >= todayStart && outDate <= todayEnd;
      });

      const exited = todayCompletedSessions.length;
      const todayRevenue = todayCompletedSessions.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);

      const todayBookings = branchBookings.filter(b => {
        if (!b.expectedArrivalTime) return false;
        const arrDate = new Date(b.expectedArrivalTime);
        return arrDate >= todayStart && arrDate <= todayEnd;
      }).length;

      const slotsLeft = Math.max(0, maxVehicles - totalVehicles);

      setLiveStats({
        totalVehicles,
        maxVehicles,
        todayRevenue,
        bookings: todayBookings,
        exited,
        slotsLeft
      });
    } catch (err) {
      console.error('Failed to fetch live stats for StaffTopbar:', err);
    }
  };

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 10000);
    return () => clearInterval(interval);
  }, [branchId]);

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
        <StatItem label="TOTAL VEHICLES" value={`${liveStats.totalVehicles} / ${liveStats.maxVehicles}`} />
        <StatItem label="TODAY'S REVENUE" value={`${liveStats.todayRevenue.toLocaleString('vi-VN')} đ`} color="var(--vin-success)" />
        <StatItem label="BOOKINGS" value={liveStats.bookings} />
        <StatItem label="EXITED" value={liveStats.exited} />
        <StatItem label="SLOTS LEFT" value={liveStats.slotsLeft} color="var(--vin-success)" />
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
