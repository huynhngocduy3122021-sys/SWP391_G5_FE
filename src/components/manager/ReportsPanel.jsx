import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../../api/manager';

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

export default function ReportsPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const data = await managerApi.getAllSessions();
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch sessions for report', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Filter completed sessions with payment
  const completed = sessions.filter(s => s.checkOutTime && s.totalAmount);
  
  const totalRevenue = completed.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const transactionCount = completed.length;
  const averageAmount = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;

  // Group by date (last 7 days of activity)
  const dailyGroups = completed.reduce((acc, s) => {
    const dateStr = new Date(s.checkOutTime).toLocaleDateString('vi-VN');
    if (!acc[dateStr]) {
      acc[dateStr] = { time: dateStr, oto: 0, xemay: 0, xedien: 0, total: 0 };
    }
    
    const amt = Number(s.totalAmount || 0);
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
