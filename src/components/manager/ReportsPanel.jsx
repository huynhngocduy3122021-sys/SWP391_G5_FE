import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../../api/manager';

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

export default function ReportsPanel({ branchId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trafficTab, setTrafficTab] = useState('7days'); // 'today', '7days', 'month', 'year'

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      const cleanBranchId = (branchId && branchId !== 'undefined' && branchId !== 'null') ? String(branchId) : null;
      try {
        const data = await managerApi.getAllSessions(cleanBranchId ? { parkingBranchId: Number(cleanBranchId), branchId: Number(cleanBranchId) } : {});
        const parsed = Array.isArray(data) ? data : data?.content || [];
        
        const getBranchId = (obj) => {
          if (!obj) return '';
          if (obj.parkingBranchId) return String(obj.parkingBranchId);
          if (obj.branchId) return String(obj.branchId);
          if (obj.parkingBranch?.parkingBranchId) return String(obj.parkingBranch.parkingBranchId);
          if (obj.parkingBranch?.id) return String(obj.parkingBranch.id);
          if (obj.branch?.id) return String(obj.branch.id);
          if (obj.parkingBranch && (typeof obj.parkingBranch === 'number' || typeof obj.parkingBranch === 'string')) {
            return String(obj.parkingBranch);
          }
          if (obj.branch && (typeof obj.branch === 'number' || typeof obj.branch === 'string')) {
            return String(obj.branch);
          }
          return '';
        };

        setSessions(cleanBranchId 
          ? parsed.filter(s => getBranchId(s) === cleanBranchId)
          : parsed
        );
      } catch (err) {
        console.error('Failed to fetch sessions for report', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [branchId]);

  // Filter completed sessions
  const completed = sessions.filter(s => s.checkOutTime);
  
  const totalRevenue = completed.reduce((sum, s) => {
    const isMOrV = (s.cardCode || s.parkingCard?.cardCode || '').startsWith('MONTH-') || 
                   (s.cardCode || s.parkingCard?.cardCode || '').startsWith('VIP-');
    return sum + (isMOrV ? 0 : Number(s.totalAmount || 0));
  }, 0);
  
  // Only count transactions that had a payment for average amount calculation
  const payingTransactions = completed.filter(s => {
    const isMOrV = (s.cardCode || s.parkingCard?.cardCode || '').startsWith('MONTH-') || 
                   (s.cardCode || s.parkingCard?.cardCode || '').startsWith('VIP-');
    return !isMOrV && s.totalAmount;
  });
  const transactionCount = payingTransactions.length;
  const averageAmount = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;

  // Group by date (last 7 days of activity)
  const dailyGroups = completed.reduce((acc, s) => {
    const dateStr = new Date(s.checkOutTime).toLocaleDateString('vi-VN');
    if (!acc[dateStr]) {
      acc[dateStr] = { time: dateStr, oto: 0, xemay: 0, xedien: 0, total: 0 };
    }
    
    const isMOrV = (s.cardCode || s.parkingCard?.cardCode || '').startsWith('MONTH-') || 
                   (s.cardCode || s.parkingCard?.cardCode || '').startsWith('VIP-');
    const amt = isMOrV ? 0 : Number(s.totalAmount || 0);
    acc[dateStr].total += amt;
    
    const vType = (s.vehicleTypeName || '').toLowerCase();
    if (vType.includes('ô tô') || vType.includes('car') || vType.includes('o to')) {
      acc[dateStr].oto += amt;
    } else if (vType.includes('xe máy') || vType.includes('moto') || vType.includes('bike') || vType.includes('xe may')) {
      acc[dateStr].xemay += amt;
    } else {
      acc[dateStr].xedien += amt;
    }
    return acc;
  }, {});

  const sortedDays = Object.values(dailyGroups)
    .sort((a, b) => {
      const [da, ma, ya] = a.time.split('/');
      const [db, mb, yb] = b.time.split('/');
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    })
    .slice(-7); // Get last 7 days

  const maxDailyRevenue = Math.max(...sortedDays.map(d => d.total), 1);

  // --- HÀM TÍNH TOÁN LƯU LƯỢNG XE (TRAFFIC) ---
  const getReferenceDate = () => {
    if (sessions.length === 0) return new Date();
    const dates = sessions
      .map(s => s.checkOutTime || s.checkInTime ? new Date(s.checkOutTime || s.checkInTime) : null)
      .filter(Boolean);
    if (dates.length === 0) return new Date();
    return new Date(Math.max(...dates));
  };
  const now = getReferenceDate();
  const todayStr = now.toDateString();
  
  // 1. Hôm nay (24 giờ)
  const hourlyTraffic = Array.from({ length: 24 }, (_, h) => {
    const checkins = sessions.filter(s => {
      if (!s.checkInTime) return false;
      const d = new Date(s.checkInTime);
      return d.toDateString() === todayStr && d.getHours() === h;
    }).length;
    const checkouts = sessions.filter(s => {
      if (!s.checkOutTime) return false;
      const d = new Date(s.checkOutTime);
      return d.toDateString() === todayStr && d.getHours() === h;
    }).length;
    return { label: `${h}h`, checkins, checkouts, total: checkins + checkouts };
  });

  // 2. 7 Ngày qua
  const last7DaysTraffic = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const dStr = d.toDateString();
    const dLabel = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    
    const checkins = sessions.filter(s => s.checkInTime && new Date(s.checkInTime).toDateString() === dStr).length;
    const checkouts = sessions.filter(s => s.checkOutTime && new Date(s.checkOutTime).toDateString() === dStr).length;
    return { label: dLabel, checkins, checkouts, total: checkins + checkouts };
  });

  // 3. Tháng này (Các ngày trong tháng hiện tại)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthlyTraffic = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const checkins = sessions.filter(s => {
      if (!s.checkInTime) return false;
      const d = new Date(s.checkInTime);
      return d.getDate() === dayNum && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const checkouts = sessions.filter(s => {
      if (!s.checkOutTime) return false;
      const d = new Date(s.checkOutTime);
      return d.getDate() === dayNum && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { label: `${dayNum}`, checkins, checkouts, total: checkins + checkouts };
  });

  // 4. Năm nay (12 tháng)
  const yearlyTraffic = Array.from({ length: 12 }, (_, m) => {
    const checkins = sessions.filter(s => {
      if (!s.checkInTime) return false;
      const d = new Date(s.checkInTime);
      return d.getMonth() === m && d.getFullYear() === now.getFullYear();
    }).length;
    const checkouts = sessions.filter(s => {
      if (!s.checkOutTime) return false;
      const d = new Date(s.checkOutTime);
      return d.getMonth() === m && d.getFullYear() === now.getFullYear();
    }).length;
    return { label: `Tháng ${m + 1}`, checkins, checkouts, total: checkins + checkouts };
  });

  const getTrafficData = () => {
    switch (trafficTab) {
      case 'today': return hourlyTraffic;
      case 'month': return monthlyTraffic;
      case 'year': return yearlyTraffic;
      case '7days':
      default:
        return last7DaysTraffic;
    }
  };

  const activeTrafficData = getTrafficData();
  const maxTrafficVal = Math.max(...activeTrafficData.map(d => d.total), 1);

  const stats = [
    { label: 'TỔNG DOANH THU', value: loading ? '...' : fmt(totalRevenue) },
    { label: 'TB MỖI GIAO DỊCH', value: loading ? '...' : fmt(averageAmount) },
    { label: 'LƯỢT GIAO DỊCH', value: loading ? '...' : transactionCount.toLocaleString() },
    { label: 'TĂNG TRƯỞNG', value: 'Live' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {stats.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: mt.text }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <div style={card}>
        <div style={{ fontWeight: 700, color: mt.text, marginBottom: 4 }}>Biểu đồ xu hướng doanh thu (7 ngày gần nhất)</div>
        <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginBottom: 12 }}>Biểu diễn tổng doanh thu phát sinh theo từng ngày đỗ xe thực tế.</div>
        
        {loading ? (
          <div style={{ height: 200, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mt.textMuted }}>
            Đang tải dữ liệu báo cáo...
          </div>
        ) : sortedDays.length === 0 ? (
          <div style={{ height: 200, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mt.textMuted }}>
            Chưa có giao dịch thanh toán nào được ghi nhận.
          </div>
        ) : (
          <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '16px 8px 8px 8px', background: '#f8fafc', borderRadius: '8px' }}>
            {sortedDays.map((d) => {
              const heightPct = Math.max((d.total / maxDailyRevenue) * 160, 6);
              return (
                <div key={d.time} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: mt.primary }}>{Number(d.total).toLocaleString()}</div>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}px`,
                      background: 'linear-gradient(to top, #0f172a, #1f6a85)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s'
                    }}
                    title={`${d.time}: ${fmt(d.total)}`}
                  />
                  <div style={{ fontSize: '0.75rem', color: mt.textMuted, fontWeight: '600' }}>{d.time.split('/')[0]}/{d.time.split('/')[1]}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Biểu đồ lưu lượng xe (Lượt vào / ra) */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: mt.text, marginBottom: 4 }}>Biểu đồ lưu lượng xe (Lượt xe vào / ra)</div>
            <div style={{ fontSize: '0.75rem', color: mt.textMuted }}>Xem mật độ xe di chuyển ra vào bãi theo từng khung thời gian.</div>
          </div>
          {/* Toggles */}
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '2px' }}>
            {[
              { key: 'today', label: 'Hôm nay' },
              { key: '7days', label: '7 Ngày qua' },
              { key: 'month', label: 'Tháng này' },
              { key: 'year', label: 'Năm nay' }
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTrafficTab(item.key)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: trafficTab === item.key ? '#fff' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: trafficTab === item.key ? mt.primary : '#475569',
                  fontWeight: trafficTab === item.key ? '700' : '500',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  boxShadow: trafficTab === item.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ height: 200, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mt.textMuted }}>
            Đang tải dữ liệu lưu lượng...
          </div>
        ) : activeTrafficData.length === 0 ? (
          <div style={{ height: 200, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mt.textMuted }}>
            Không tìm thấy lượt xe nào.
          </div>
        ) : (
          <div style={{ 
            height: 240, 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: trafficTab === 'month' ? '4px' : '16px', 
            padding: '24px 12px 12px 12px', 
            background: '#f8fafc', 
            borderRadius: '8px',
            overflowX: 'auto'
          }}>
            {activeTrafficData.map((d, index) => {
              const heightPct = Math.max((d.total / maxTrafficVal) * 160, 4);
              const showLabel = trafficTab !== 'month' || index % 3 === 0 || index === activeTrafficData.length - 1;
              return (
                <div key={index} style={{ flex: 1, minWidth: trafficTab === 'month' ? 14 : 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '700', color: mt.text, visibility: d.total > 0 ? 'visible' : 'hidden' }}>
                    {d.total}
                  </div>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 160 }}>
                    <div style={{ display: 'flex', gap: 1, height: '100%', alignItems: 'flex-end' }}>
                      <div
                        style={{
                          flex: 1,
                          height: d.total > 0 ? `${(d.checkins / maxTrafficVal) * 160}px` : '2px',
                          background: '#10b981',
                          borderRadius: '2px 2px 0 0'
                        }}
                        title={`Vào: ${d.checkins}`}
                      />
                      <div
                        style={{
                          flex: 1,
                          height: d.total > 0 ? `${(d.checkouts / maxTrafficVal) * 160}px` : '2px',
                          background: '#ef4444',
                          borderRadius: '2px 2px 0 0'
                        }}
                        title={`Ra: ${d.checkouts}`}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: mt.textMuted, fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {showLabel ? d.label : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: '#10b981' }} />
            <span style={{ color: mt.textMuted }}>Số lượt vào</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: '#ef4444' }} />
            <span style={{ color: mt.textMuted }}>Số lượt ra</span>
          </div>
        </div>
      </div>

      {/* Revenue Details Table */}
      <div style={card}>
        <div style={{ fontWeight: 700, color: mt.text, marginBottom: 12 }}>Chi tiết doanh thu hàng ngày</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: mt.textMuted, textAlign: 'left', borderBottom: `2px solid ${mt.border}` }}>
              <th style={{ padding: '8px' }}>THỜI GIAN</th>
              <th style={{ padding: '8px' }}>Ô TÔ</th>
              <th style={{ padding: '8px' }}>XE MÁY</th>
              <th style={{ padding: '8px' }}>XE KHÁC</th>
              <th style={{ padding: '8px', fontWeight: '700' }}>TỔNG DOANH THU</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: mt.textMuted }}>
                  Đang tải danh sách báo cáo...
                </td>
              </tr>
            ) : sortedDays.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: mt.textMuted }}>
                  Chưa có dữ liệu doanh thu.
                </td>
              </tr>
            ) : (
              [...sortedDays].reverse().map((r) => (
                <tr key={r.time} style={{ borderBottom: `1px solid ${mt.border}` }}>
                  <td style={{ padding: '8px', fontWeight: '600' }}>{r.time}</td>
                  <td style={{ padding: '8px' }}>{Number(r.oto).toLocaleString()} đ</td>
                  <td style={{ padding: '8px' }}>{Number(r.xemay).toLocaleString()} đ</td>
                  <td style={{ padding: '8px' }}>{Number(r.xedien).toLocaleString()} đ</td>
                  <td style={{ padding: '8px', fontWeight: 700, color: mt.primary }}>{Number(r.total).toLocaleString()} đ</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
