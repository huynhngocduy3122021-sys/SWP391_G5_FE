import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import managerApi from '../../api/manager';
import bookingApi from '../../api/bookingApi';

// Topbar "PARK-OPS PRO" — giống header trong cả 2 ảnh thiết kế
export default function StaffTopbar({ mode, onModeChange }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  
  // Real stats state
  const [realStats, setRealStats] = useState({
    totalVehicles: 0,
    maxVehicles: 2000,
    todayRevenue: 0,
    bookings: 0,
    exited: 0,
    slotsLeft: 2000
  });

  const fetchStats = async () => {
    try {
      const [sessionsData, bookingsData, zonesData] = await Promise.all([
        managerApi.getAllSessions(),
        bookingApi.getAllBookings(),
        managerApi.getAllZones()
      ]);

      const branchId = localStorage.getItem('branchId');
      
      let sessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.content || []);
      let bookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.content || []);
      let zones = Array.isArray(zonesData) ? zonesData : (zonesData?.content || []);

      if (branchId) {
        sessions = sessions.filter(s => String(s.parkingBranchId) === String(branchId));
        zones = zones.filter(z => String(z.parkingFloor?.parkingBranch?.parkingBranchId) === String(branchId) || String(z.branchId) === String(branchId));
      }

      // Calculate total capacity
      const totalCapacity = zones.reduce((sum, z) => sum + (z.capacity || z.totalSlots || 0), 0);
      
      // Calculate total active vehicles (status is ACTIVE or check-out is missing)
      const activeSessions = sessions.filter(s => s.sessionStatus === 'ACTIVE' || (!s.checkOutTime && s.checkInTime));
      const totalVehiclesCount = activeSessions.length;

      // Exited today (sessions checked out today)
      const todayStr = new Date().toDateString();
      const exitedToday = sessions.filter(s => s.checkOutTime && new Date(s.checkOutTime).toDateString() === todayStr).length;

      // Bookings count
      const activeBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'ACTIVE').length;

      // Today's revenue (sum of totalAmount for checkout sessions today, excluding monthly/VIP)
      const todayRevenue = sessions
        .filter(s => {
          const isMOrV = (s.cardCode || s.parkingCard?.cardCode || '').startsWith('MONTH-') || 
                         (s.cardCode || s.parkingCard?.cardCode || '').startsWith('VIP-');
          return s.checkOutTime && new Date(s.checkOutTime).toDateString() === todayStr && !isMOrV && s.totalAmount;
        })
        .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);

      // Slots left
      const slotsLeft = Math.max(0, totalCapacity - totalVehiclesCount);

      setRealStats({
        totalVehicles: totalVehiclesCount,
        maxVehicles: totalCapacity || 2000,
        todayRevenue: todayRevenue,
        bookings: activeBookings,
        exited: exitedToday,
        slotsLeft: slotsLeft
      });
    } catch (err) {
      console.error('Lỗi khi tải số liệu thống kê Staff:', err);
    }
  };

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    
    // Poll API stats every 10 seconds
    fetchStats();
    const statsId = setInterval(fetchStats, 10000);

    return () => {
      clearInterval(id);
      clearInterval(statsId);
    };
  }, []);



  const handleLogout = () => {
    localStorage.clear();
    toast.info('Đã đăng xuất!');
    navigate('/');
  };

  const fullName = localStorage.getItem('fullName') || 'Staff';

  // Prefer real API stats
  const displayStats = realStats.maxVehicles > 0 ? realStats : (stats || MOCK_STATS);

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--vin-border)',
      background: 'rgba(15,23,42,0.95)', flexWrap: 'wrap', gap: '1rem',
    }}>
      {/* Logo */}
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--vin-text-main)', lineHeight: 1.1 }}>PARK-OPS</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--vin-primary)', letterSpacing: '0.1em' }}>PRO</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
        <StatItem label="TỔNG XE" value={`${displayStats.totalVehicles} / ${displayStats.maxVehicles}`} />
        <StatItem label="DOANH THU HÔM NAY" value={displayStats.todayRevenue.toLocaleString('vi-VN') + ' đ'} color="var(--vin-success)" />
        <StatItem label="ĐẶT TRƯỚC" value={displayStats.bookings} />
        <StatItem label="ĐÃ RA" value={displayStats.exited} />
        <StatItem label="CHỖ TRỐNG" value={displayStats.slotsLeft} color="var(--vin-success)" />
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
                background: mode === m ? 'var(--vin-primary)' : 'transparent',
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
export const MOCK_STATS = {
  totalVehicles: 1245, maxVehicles: 2000, todayRevenue: 14580,
  bookings: 42, exited: 391, slotsLeft: 755,
};
