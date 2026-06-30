import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import bookingApi from '../../api/bookingApi';
import managerApi from '../../api/manager';
import { toast } from 'react-toastify';

export default function BookingPanel() {
  const [bookings, setBookings] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // 'day', 'month', 'year', 'all'
  
  const [overbookingRate, setOverbookingRate] = useState(() => {
    return Number(localStorage.getItem('admin_overbooking_rate') || 12);
  });

  useEffect(() => {
    const handleSync = () => {
      const val = localStorage.getItem('admin_overbooking_rate');
      if (val) setOverbookingRate(Number(val));
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const TABS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ đến' },
    { key: 'checked_in', label: 'Đã vào bãi' },
    { key: 'cancelled', label: 'Đã hủy' },
  ];

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const [bookingsData, zonesData] = await Promise.all([
        bookingApi.getAllBookings(),
        managerApi.getAllZones(),
      ]);
      setBookings(Array.isArray(bookingsData) ? bookingsData : bookingsData?.content || []);
      setZones(Array.isArray(zonesData) ? zonesData : []);
    } catch (err) {
      console.error(err);
      toast.error('Không tải được danh sách đặt chỗ hoặc dữ liệu bãi xe!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lượt đặt chỗ này?')) return;
    try {
      await bookingApi.cancelBooking(bookingId);
      toast.success('Đã hủy đặt chỗ thành công!');
      fetchBookings();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Không thể hủy đặt chỗ!';
      toast.error(String(msg));
    }
  };

  const getStatusColor = (status) => {
    const s = String(status || '').toUpperCase();
    switch(s) {
      case 'PENDING': return { bg: '#eff6ff', color: '#1d4ed8', label: 'Chờ đến' };
      case 'CHECKED_IN': return { bg: '#dcfce7', color: '#166534', label: 'Đã vào bãi' };
      case 'EXPIRED': return { bg: '#fee2e2', color: '#991b1b', label: 'Hết hạn' };
      case 'CANCELLED': return { bg: '#ffedd5', color: '#9a3412', label: 'Đã hủy' };
      default: return { bg: '#f1f5f9', color: '#475569', label: s };
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN');
    } catch {
      return timeStr;
    }
  };

  // Lấy ngày mốc tham chiếu mới nhất từ dữ liệu thực tế (đề phòng dữ liệu seed năm cũ)
  const getReferenceDate = () => {
    if (bookings.length === 0) return new Date();
    const dates = bookings
      .map(b => b.expectedArrivalTime ? new Date(b.expectedArrivalTime) : null)
      .filter(Boolean);
    if (dates.length === 0) return new Date();
    return new Date(Math.max(...dates));
  };

  const refDate = getReferenceDate();

  // Lọc theo thời gian để làm tập thống kê
  const timeframeBookings = bookings.filter(b => {
    if (timeFilter === 'all') return true;
    if (!b.expectedArrivalTime) return false;
    const bDate = new Date(b.expectedArrivalTime);
    if (timeFilter === 'day') {
      return bDate.getDate() === refDate.getDate() &&
             bDate.getMonth() === refDate.getMonth() &&
             bDate.getFullYear() === refDate.getFullYear();
    } else if (timeFilter === 'month') {
      return bDate.getMonth() === refDate.getMonth() &&
             bDate.getFullYear() === refDate.getFullYear();
    } else if (timeFilter === 'year') {
      return bDate.getFullYear() === refDate.getFullYear();
    }
    return true;
  });

  // Filter based on active tab from the timeframe bookings
  const filteredBookings = timeframeBookings.filter(b => {
    const s = String(b.status || '').toUpperCase();
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return s === 'PENDING';
    if (activeTab === 'checked_in') return s === 'CHECKED_IN';
    if (activeTab === 'cancelled') return s === 'CANCELLED';
    return true;
  });

  // Calculate statistics
  // ĐÃ CHECK IN = TỔNG BOOKING - HỦY - QUÁ HẠN
  const totalCount = timeframeBookings.length;
  const cancelledCount = timeframeBookings.filter(b => String(b.status || '').toUpperCase() === 'CANCELLED').length;
  const expiredCount = timeframeBookings.filter(b => String(b.status || '').toUpperCase() === 'EXPIRED').length;
  const checkedInCount = Math.max(0, totalCount - cancelledCount - expiredCount);
  const cancelRate = totalCount > 0 ? (((cancelledCount + expiredCount) / totalCount) * 100).toFixed(1) : '0.0';

  // Tính tổng số slot ô tô của bãi đỗ
  const totalCarSlots = zones.reduce((sum, z) => {
    const isCarZone = (z.vehicleTypeName || '').toLowerCase().includes('ô tô') || 
                      (z.vehicleTypeName || '').toLowerCase().includes('car') || 
                      (z.vehicleTypeName || '').toLowerCase().includes('xe con') || 
                      (z.vehicleTypeName || '').toLowerCase().includes('o to');
    if (isCarZone) {
      return sum + Number(z.capacity || 0);
    }
    return sum;
  }, 0);

  // Slot dự kiến giải phóng = tổng slot xe ô tô nhân với phần trăm của bán quá tải
  const freedSlots = Math.round(totalCarSlots * (overbookingRate / 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: mt.text, fontWeight: 700 }}>Quản lý Booking</h2>
          <p style={{ margin: '4px 0 0', color: mt.textMuted, fontSize: '0.875rem' }}>Theo dõi và điều phối lịch đặt chỗ đỗ xe trong thời gian thực.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Timeframe buttons */}
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '2px' }}>
            {[
              { key: 'day', label: 'Theo Ngày' },
              { key: 'month', label: 'Theo Tháng' },
              { key: 'year', label: 'Theo Năm' },
              { key: 'all', label: 'Tất cả' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setTimeFilter(item.key)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: timeFilter === item.key ? '#fff' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: timeFilter === item.key ? mt.primary : '#475569',
                  fontWeight: timeFilter === item.key ? '700' : '500',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: timeFilter === item.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button 
            onClick={fetchBookings}
            style={{ 
              background: mt.primary, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, 
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            🔄 Tải lại dữ liệu
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '1rem' }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <span style={{ color: mt.warning }}>🎛️</span>
            <span style={{ fontWeight: 600, color: mt.text }}>Cấu hình Bán quá tải</span>
            <span style={{ color: mt.textMuted, fontSize: '0.8rem', cursor: 'help' }} title="Cho phép đặt chỗ vượt quá sức chứa bãi xe dựa trên tính toán tỷ lệ hủy/không đến của AI">ⓘ</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
              <span style={{ color: mt.textMuted }}>Tỷ lệ Overbooking</span>
              <span style={{ fontWeight: 700, color: mt.text, fontSize: '1rem' }}>{overbookingRate}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="30" 
              value={overbookingRate}
              onChange={e => setOverbookingRate(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: mt.primary }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: mt.textMuted, marginTop: 4 }}>
              <span>0% (An toàn)</span>
              <span>30% (Tối đa)</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${mt.border}`, fontSize: '0.875rem' }}>
            <span style={{ color: mt.textMuted }}>Tổng slot ô tô</span>
            <span style={{ color: mt.text, fontWeight: 600 }}>{totalCarSlots} slots</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginBottom: 12, fontSize: '0.875rem' }}>
            <span style={{ color: mt.textMuted }}>Slot giải phóng dự kiến</span>
            <span style={{ fontWeight: 700, color: mt.text }}>{freedSlots} slots</span>
          </div>
          <button 
            onClick={() => {
              localStorage.setItem('admin_overbooking_rate', overbookingRate);
              window.dispatchEvent(new Event('storage'));
              toast.success(`Đã lưu cấu hình bán quá tải ở mức ${overbookingRate}%!`);
            }}
            style={{ width: '100%', padding: '8px', background: '#fff', border: `1px solid ${mt.primary}`, color: mt.primary, fontWeight: 700, borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}
          >
            CẬP NHẬT CẤU HÌNH
          </button>
        </div>

        <div style={card}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>TỔNG BOOKING ĐÃ ĐẶT</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: mt.text, marginBottom: 8 }}>{totalCount}</div>
          <div style={{ color: mt.textMuted, fontSize: '0.8rem' }}>Dữ liệu lưu trữ trên hệ thống</div>
        </div>

        <div style={card}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>ĐÃ CHECK-IN</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: mt.success, marginBottom: 16 }}>{checkedInCount}</div>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
            <div style={{ height: '100%', width: totalCount > 0 ? `${(checkedInCount/totalCount)*100}%` : '0%', background: mt.success, borderRadius: 2 }} />
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>TỶ LỆ HỦY / QUÁ HẠN</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: mt.danger, marginBottom: 8 }}>{cancelRate}%</div>
          <div style={{ color: mt.textMuted, fontSize: '0.8rem' }}>Số lượt đặt bị hủy hoặc hết hạn</div>
        </div>
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${mt.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {TABS.map(t => (
              <button 
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{ 
                  background: 'none', border: 'none', padding: '0 0 8px 0', 
                  fontSize: '0.875rem', fontWeight: activeTab === t.key ? 700 : 500,
                  color: activeTab === t.key ? mt.primary : mt.textMuted,
                  borderBottom: activeTab === t.key ? `2px solid ${mt.primary}` : '2px solid transparent',
                  cursor: 'pointer', marginBottom: -17
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '12px 1.25rem', textAlign: 'left', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem' }}>MÃ BOOKING</th>
              <th style={{ padding: '12px 1.25rem', textAlign: 'left', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem' }}>BIỂN SỐ XE</th>
              <th style={{ padding: '12px 1.25rem', textAlign: 'left', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem' }}>LOẠI XE</th>
              <th style={{ padding: '12px 1.25rem', textAlign: 'left', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem' }}>CHI NHÁNH BÃI XE</th>
              <th style={{ padding: '12px 1.25rem', textAlign: 'left', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem' }}>KHUNG GIỜ DỰ KIẾN KHÓA</th>
              <th style={{ padding: '12px 1.25rem', textAlign: 'left', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem' }}>TRẠNG THÁI</th>
              <th style={{ padding: '12px 1.25rem', textAlign: 'center', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: mt.textMuted }}>
                  ⏳ Đang tải dữ liệu booking từ server...
                </td>
              </tr>
            ) : filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: mt.textMuted }}>
                  📭 Không có dữ liệu booking nào.
                </td>
              </tr>
            ) : filteredBookings.map((b) => {
              const statusStyle = getStatusColor(b.status);
              const isPending = String(b.status || '').toUpperCase() === 'PENDING';
              return (
                <tr key={b.bookingId} style={{ borderBottom: `1px solid ${mt.border}` }}>
                  <td style={{ padding: '12px 1.25rem', fontWeight: 600, color: mt.text }}>{b.bookingCode}</td>
                  <td style={{ padding: '12px 1.25rem', color: mt.text, fontWeight: 700 }}>{b.licensePlate || '—'}</td>
                  <td style={{ padding: '12px 1.25rem', color: mt.text }}>{b.vehicleTypeName || '—'}</td>
                  <td style={{ padding: '12px 1.25rem', color: mt.textMuted }}>{b.parkingBranchName || '—'}</td>
                  <td style={{ padding: '12px 1.25rem', color: mt.textMuted }}>
                    {formatTime(b.expectedArrivalTime)} - {formatTime(b.holdUntil)}
                  </td>
                  <td style={{ padding: '12px 1.25rem' }}>
                    <span style={{ 
                      background: statusStyle.bg, 
                      color: statusStyle.color,
                      padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      {statusStyle.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 1.25rem', textAlign: 'center' }}>
                    {isPending && (
                      <button 
                        onClick={() => handleCancel(b.bookingId)}
                        style={{ 
                          background: '#fee2e2', color: '#b91c1c', border: 'none', 
                          padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem', 
                          fontWeight: 600, cursor: 'pointer' 
                        }}
                      >
                        ✕ Hủy Booking
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
