import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../../api/managerApi';

export default function ReportsPanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRevenue: 0,
    txCount: 0,
    dailyData: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const sessions = await managerApi.getSessions();
      
      // Filter sessions that have checked out
      const completedSessions = sessions.filter(s => s.checkOutTime);
      const totalRevenue = completedSessions.reduce((sum, s) => sum + (s.totalFee || 0), 0);
      
      // Group by day
      const dailyMap = {};
      completedSessions.forEach(s => {
        const date = s.checkOutTime.split('T')[0];
        if (!dailyMap[date]) dailyMap[date] = { oto: 0, xemay: 0, xedien: 0, total: 0 };
        
        const fee = s.totalFee || 0;
        dailyMap[date].total += fee;
        
        const type = s.vehicleTypeName?.toLowerCase() || '';
        if (type.includes('ô tô') || type.includes('car')) dailyMap[date].oto += fee;
        else if (type.includes('xe máy') || type.includes('motor')) dailyMap[date].xemay += fee;
        else dailyMap[date].xedien += fee; // Default fallback for electric or others
      });

      const sortedDates = Object.keys(dailyMap).sort();
      const dailyData = sortedDates.map(date => {
        const d = date.split('-'); // YYYY-MM-DD
        return {
          time: `${d[2]}/${d[1]}`,
          oto: dailyMap[date].oto,
          xemay: dailyMap[date].xemay,
          xedien: dailyMap[date].xedien,
          total: dailyMap[date].total,
          rawDate: date
        };
      }).reverse(); // Newest first for table

      setData({
        totalRevenue,
        txCount: completedSessions.length,
        dailyData
      });
    } catch (err) {
      console.error('Lỗi khi tải báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const STATS = [
    { label: 'TỔNG DOANH THU', value: formatVND(data.totalRevenue), delta: null, good: true },
    { label: 'LƯỢT GIAO DỊCH (XE RA)', value: data.txCount, delta: null, good: true },
  ];

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: mt.textMuted }}>Đang tải báo cáo...</div>;
  }

  // Chart heights logic (relative to max daily revenue)
  const chartData = [...data.dailyData].reverse(); // oldest to newest
  const maxRevenue = Math.max(...chartData.map(d => d.total), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {STATS.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: mt.text }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, color: mt.text, marginBottom: 4 }}>Biểu đồ xu hướng doanh thu</div>
        <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginBottom: 12 }}>Doanh thu theo ngày</div>
        <div style={{
          height: 200, borderRadius: 8, background: '#f8fafc',
          display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0.75rem',
        }}>
          {chartData.length === 0 ? <div style={{width: '100%', textAlign: 'center', color: mt.textMuted}}>Không có dữ liệu</div> : chartData.map((d, i) => {
            const h = Math.max((d.total / maxRevenue) * 100, 5); // min 5% height
            return (
              <div key={i} title={`${d.time}: ${formatVND(d.total)}`} style={{ flex: 1, height: `${h}%`, borderRadius: 3, background: mt.primary, opacity: 0.85 }} />
            );
          })}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, color: mt.text, marginBottom: 12 }}>Chi tiết doanh thu hàng ngày</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>THỜI GIAN</th>
              <th style={{ padding: '6px 8px' }}>Ô TÔ</th>
              <th style={{ padding: '6px 8px' }}>XE MÁY</th>
              <th style={{ padding: '6px 8px' }}>XE ĐIỆN / KHÁC</th>
              <th style={{ padding: '6px 8px' }}>TỔNG DOANH THU</th>
            </tr>
          </thead>
          <tbody>
            {data.dailyData.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '10px', textAlign: 'center', color: mt.textMuted }}>Chưa có giao dịch nào</td></tr>
            ) : data.dailyData.map((r) => (
              <tr key={r.rawDate} style={{ borderTop: `1px solid ${mt.border}` }}>
                <td style={{ padding: '8px' }}>{r.time}</td>
                <td style={{ padding: '8px' }}>{formatVND(r.oto)}</td>
                <td style={{ padding: '8px' }}>{formatVND(r.xemay)}</td>
                <td style={{ padding: '8px' }}>{formatVND(r.xedien)}</td>
                <td style={{ padding: '8px', fontWeight: 700 }}>{formatVND(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
