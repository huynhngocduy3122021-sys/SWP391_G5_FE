import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../../api/managerApi';

export default function OverviewPanel({ onNavigate }) {
  const [data, setData] = useState({
    revenue: 0,
    checkInCount: 0,
    checkOutCount: 0,
    occupancyPct: 0,
    totalCapacity: 0,
    incidentsCount: 0,
    zones: [],
    recentSessions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessions, zones, incidents] = await Promise.all([
          managerApi.getSessions(),
          managerApi.getZones(),
          managerApi.getIncidents()
        ]);

        const todayStr = new Date().toISOString().split('T')[0];
        const todaySessions = sessions.filter(s => s.checkOutTime && s.checkOutTime.startsWith(todayStr));
        const revenue = todaySessions.reduce((sum, s) => sum + (s.totalFee || 0), 0);
        
        const checkInCount = sessions.filter(s => s.checkInTime && s.checkInTime.startsWith(todayStr)).length;
        const checkOutCount = todaySessions.length;

        const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
        const availableCapacity = zones.reduce((sum, z) => sum + z.availableCapacity, 0);
        const used = totalCapacity - availableCapacity;
        const occupancyPct = totalCapacity === 0 ? 0 : Math.round((used / totalCapacity) * 100);

        const pendingIncidents = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;

        const formattedZones = zones.map((z, idx) => {
           const zoneUsed = z.capacity - z.availableCapacity;
           const pct = z.capacity === 0 ? 0 : Math.round((zoneUsed / z.capacity) * 100);
           const colors = [mt.danger, '#0f172a', mt.warning, '#cbd5e1', mt.success];
           return {
             name: z.zoneName,
             pct,
             used: zoneUsed,
             free: z.availableCapacity,
             color: colors[idx % colors.length]
           };
        });

        const recent = sessions.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()).reverse().slice(0, 5).map(s => ({
          plate: s.licensePlate,
          time: new Date(s.checkInTime).toLocaleString('vi-VN'),
          zone: 'N/A', 
          type: s.parkingCard?.cardType || 'GUEST',
          status: s.checkOutTime ? 'Ra bãi' : 'Vào bãi',
          ok: true
        }));

        setData({
          revenue,
          checkInCount,
          checkOutCount,
          occupancyPct,
          totalCapacity,
          incidentsCount: pendingIncidents,
          zones: formattedZones,
          recentSessions: recent
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const STATS = [
    { label: 'DOANH THU HÔM NAY', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.revenue), delta: null, color: mt.success },
    { label: 'LƯỢT XE VÀO/RA', value: `${data.checkInCount} / ${data.checkOutCount}`, sub: 'Hôm nay', color: mt.warning },
    { label: 'TỶ LỆ LẤP ĐẦY', value: `${data.occupancyPct}%`, sub: `/ ${data.totalCapacity} chỗ`, color: mt.text },
    { label: 'CẢNH BÁO HỆ THỐNG', value: data.incidentsCount.toString().padStart(2, '0'), sub: 'Trường hợp', color: mt.danger, alert: data.incidentsCount > 0 },
  ];

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: mt.textMuted }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {STATS.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, letterSpacing: '0.03em', marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{loading ? '...' : s.value}</div>
            {s.sub && <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginTop: 6 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>

        {/* Biểu đồ lưu lượng 24h */}
        <div style={card}>
          <div style={{ fontWeight: 700, color: mt.text, marginBottom: 4 }}>Lưu lượng xe theo giờ (hôm nay)</div>
          <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginBottom: 12 }}>Tổng {checkinsToday} lượt vào trong ngày</div>
          <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 3, padding: '0 4px' }}>
            {hourlyBars.map((count, h) => (
              <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div
                  style={{
                    width: '100%', borderRadius: '3px 3px 0 0',
                    height: `${Math.max((count / maxBar) * 180, count > 0 ? 4 : 0)}px`,
                    background: count > 0 ? mt.primary : '#e2e8f0',
                    transition: 'height 0.3s',
                  }}
                  title={`${h}:00 — ${count} xe`}
                />
                {h % 4 === 0 && (
                  <div style={{ fontSize: '0.55rem', color: mt.textMuted }}>{h}h</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mật độ zone */}
        <div style={card}>
          <div style={{ fontWeight: 700, color: mt.text, marginBottom: 12 }}>Mật độ theo khu vực</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.zones.length === 0 ? <div style={{ color: mt.textMuted, fontSize: '0.8rem' }}>Chưa có khu vực nào</div> : 
             data.zones.map((z) => (
              <div key={z.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span style={{ color: mt.text, fontWeight: 600 }}>{z.name}</span>
                  <span style={{ color: z.pct > 85 ? mt.danger : mt.text, fontWeight: 700 }}>{z.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: '#f1f5f9' }}>
                  <div style={{ width: `${z.pct}%`, height: '100%', borderRadius: 4, background: z.color }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: mt.textMuted, marginTop: 2 }}>
                  <span>Đang đỗ: {z.used}</span>
                  <span>Trống: {z.free}</span>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: '#f1f5f9' }}>
                <div style={{ width: `${z.pct}%`, height: '100%', borderRadius: 4, background: z.color, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bảng lượt xe gần nhất */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: mt.text }}>Lượt xe ra vào gần nhất</div>
          <button type="button" onClick={() => onNavigate && onNavigate('zones')}
            style={{ border: 'none', background: 'transparent', color: mt.accent, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            Xem sơ đồ &rarr;
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>BIỂN SỐ</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>THỜI GIAN VÀO</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>LOẠI THẺ</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {data.recentSessions.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '10px', textAlign: 'center', color: mt.textMuted }}>Không có dữ liệu</td></tr>
            ) : data.recentSessions.map((r, idx) => (
              <tr key={idx} style={{ borderTop: `1px solid ${mt.border}` }}>
                <td style={{ padding: '8px' }}>
                  <span style={{ background: '#f1f5f9', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{r.plate}</span>
                </td>
                <td style={{ padding: '8px', color: mt.textMuted }}>{r.time}</td>
                <td style={{ padding: '8px' }}>
                  <span style={{
                    background: r.type === 'VIP' ? '#fef9c3' : '#f1f5f9', borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                  }}>{r.type}</span>
                </td>
                <td style={{ padding: '8px', color: r.status === 'Vào bãi' ? mt.success : mt.textMuted, fontWeight: 600 }}>
                  &#9679; {r.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
