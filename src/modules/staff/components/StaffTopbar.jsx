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
    maxVehicles: 0,
    todayRevenue: 0,
    todayCashRevenue: 0,
    todayTransferRevenue: 0,
    bookings: 0,
    exited: 0,
    slotsLeft: 0
  });

  const fetchStats = async () => {
    try {
      const [sessionsData, bookingsData, capacityData, paymentsData] = await Promise.all([
        managerApi.getAllSessions(),
        bookingApi.getAllBookings(),
        managerApi.getMyBranchCapacity(),
        managerApi.getAllPayments()
      ]);

      const branchId = localStorage.getItem('branchId');

      let sessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.content || []);
      let bookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.content || []);
      const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.content || []);

      if (branchId) {
        sessions = sessions.filter(s => String(s.parkingBranchId) === String(branchId));
      }

      const totalCapacity = Number(capacityData?.totalCapacity || 0);
      const totalVehiclesCount = Number(capacityData?.occupiedCapacity || 0);

      // Exited today (sessions checked out today)
      const todayStr = new Date().toDateString();
      const exitedToday = sessions.filter(s => s.checkOutTime && new Date(s.checkOutTime).toDateString() === todayStr).length;

      // Bookings count
      const activeBookings = Number.isFinite(Number(capacityData?.reservedCapacity))
        ? Number(capacityData.reservedCapacity)
        : bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'ACTIVE').length;

      // Today's revenue from successful payments in the Staff's branch.
      // The half-open date range [startOfToday, startOfTomorrow) resets naturally at midnight.
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const staffBranchId = String(capacityData?.parkingBranchId || branchId || localStorage.getItem('parkingBranchId') || '');
      const staffBranchName = String(capacityData?.branchName || localStorage.getItem('parkingBranchName') || '').trim().toLowerCase();

      const todayPaidPayments = payments
        .filter(payment => {
          const status = String(payment.paymentStatus ?? '').toUpperCase();
          const isPaid = ['PAID', 'SUCCESS', 'COMPLETED'].includes(status)
            || payment.paymentStatus === true
            || payment.paymentStatus === 1;
          if (!isPaid || !payment.paidAt) return false;

          const paidAt = new Date(payment.paidAt);
          if (Number.isNaN(paidAt.getTime()) || paidAt < startOfToday || paidAt >= startOfTomorrow) return false;

          const paymentBranchId = String(payment.branchId || '');
          const paymentBranchName = String(payment.branchName || payment.sessionBranchName || '').trim().toLowerCase();
          return (staffBranchId && paymentBranchId === staffBranchId)
            || (staffBranchName && paymentBranchName === staffBranchName);
        })
      const todayCashRevenue = todayPaidPayments
        .filter(payment => !['VNPAY', 'BANK_TRANSFER', 'TRANSFER', 'ONLINE', 'BANK'].includes(String(payment.paymentMethod || payment.method || payment.paymentType || '').toUpperCase()))
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const todayTransferRevenue = todayPaidPayments
        .filter(payment => ['VNPAY', 'BANK_TRANSFER', 'TRANSFER', 'ONLINE', 'BANK'].includes(String(payment.paymentMethod || payment.method || payment.paymentType || '').toUpperCase()))
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const todayRevenue = todayCashRevenue + todayTransferRevenue;

      // Slots left
      const slotsLeft = Number.isFinite(Number(capacityData?.availableCapacity))
        ? Number(capacityData.availableCapacity)
        : Math.max(0, totalCapacity - totalVehiclesCount - activeBookings);

      setRealStats({
        totalVehicles: totalVehiclesCount,
        maxVehicles: totalCapacity,
        todayRevenue: todayRevenue,
        todayCashRevenue,
        todayTransferRevenue,
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

  const displayStats = realStats;
  const totalVehiclesDisplay = `${displayStats.totalVehicles} / ${displayStats.maxVehicles}`;

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
        <StatItem label="TỔNG XE" value={totalVehiclesDisplay} />
        <StatItem label="TIỀN MẶT HÔM NAY" value={displayStats.todayCashRevenue.toLocaleString('vi-VN') + ' đ'} color="var(--vin-success)" />
        <StatItem label="CHUYỂN KHOẢN HÔM NAY" value={displayStats.todayTransferRevenue.toLocaleString('vi-VN') + ' đ'} color="var(--vin-primary)" />
        <StatItem label="ĐẶT TRƯỚC" value={displayStats.bookings} />
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
