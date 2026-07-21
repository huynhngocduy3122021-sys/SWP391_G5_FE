import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import managerApi from '../../manager/api/manager';
import bookingApi from '../../booking/api/bookingApi';

// Topbar "PARK-OPS PRO" — giống header trong cả 2 ảnh thiết kế
export default function StaffTopbar({ mode, onModeChange }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [timeOffset, setTimeOffset] = useState(() => Number(localStorage.getItem('demoTimeOffset') || 0));
  const dropdownRef = useRef(null);

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
            (s.cardCode || s.parkingCard?.cardCode || '').startsWith('VIP-') ||
            (s.cardCode || s.parkingCard?.cardCode || '').startsWith('EMP-');
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
    localStorage.setItem('demoTimeOffset', timeOffset);
  }, [timeOffset]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date(Date.now() + timeOffset)), 1000);

    // Poll API stats every 10 seconds
    fetchStats();
    const statsId = setInterval(fetchStats, 10000);

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(id);
      clearInterval(statsId);
      document.removeEventListener('mousedown', handleClickOutside);
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
      background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', flexWrap: 'wrap', gap: '1rem',
      position: 'relative', zIndex: 1000
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
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: 2 }}>
          {['ENTRY', 'EXIT'].map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className="vin-btn vin-btn--sm"
              style={{
                background: mode === m ? 'var(--vin-primary)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--vin-text-muted)',
              }}
            >
              {m === 'ENTRY' ? 'Vào' : 'Ra'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>

          {/* Thời gian +- 1 giờ */}
          <button
            onClick={() => {
              setTimeOffset(prev => {
                const newVal = prev - 3600 * 1000;
                localStorage.setItem('demoTimeOffset', newVal);
                window.dispatchEvent(new Event('timeOffsetChanged'));
                return newVal;
              });
            }}
            title="Giảm 1 giờ (Demo)"
            style={{ background: '#ef4444', border: 'none', borderRadius: '4px', color: '#fff', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            -1 Giờ
          </button>
          <button
            onClick={() => {
              setTimeOffset(prev => {
                const newVal = prev + 3600 * 1000;
                localStorage.setItem('demoTimeOffset', newVal);
                window.dispatchEvent(new Event('timeOffsetChanged'));
                return newVal;
              });
            }}
            title="Tăng 1 giờ (Demo)"
            style={{ background: 'var(--vin-primary)', border: 'none', borderRadius: '4px', color: '#fff', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            +1 Giờ
          </button>
        </div>

        <span style={{ fontSize: '0.85rem', color: 'var(--vin-text-muted)', fontVariantNumeric: 'tabular-nums', fontWeight: '500' }}>
          🕐 {new Date(Date.now() + timeOffset).toLocaleTimeString('en-US')}
        </span>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            className="sidebar-avatar"
            style={{ width: 32, height: 32, fontSize: '0.85rem', cursor: 'pointer' }}
            title={fullName}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {fullName.charAt(0).toUpperCase()}
          </div>
          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--vin-bg-card)', border: '1px solid var(--vin-border)',
              borderRadius: 8, minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 999, overflow: 'hidden'
            }}>
              <div style={{ padding: '0.5rem' }}>
                <button onClick={() => { setDropdownOpen(false); navigate('/staff/profile'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 0.75rem', borderRadius: 6, width: '100%',
                    background: 'transparent', border: 'none',
                    color: 'var(--vin-text-main)', fontSize: '0.85rem', fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  👤 Hồ sơ của tôi
                </button>
                <div style={{ borderTop: '1px solid var(--vin-border)', margin: '0.25rem 0' }} />
                <button onClick={() => { setDropdownOpen(false); handleLogout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 0.75rem', borderRadius: 6, width: '100%',
                    background: 'transparent', border: 'none',
                    color: '#f87171', fontSize: '0.85rem', fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: '0.65rem', color: 'var(--vin-text-muted)', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontWeight: 700, color: color || 'var(--vin-text-main)', fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}
export const MOCK_STATS = {
  totalVehicles: 1245, maxVehicles: 2000, todayRevenue: 14580,
  bookings: 42, exited: 391, slotsLeft: 755,
};
