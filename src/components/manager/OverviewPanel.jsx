import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../../api/manager';

/* ── helpers ─────────────────────────────── */
const fmt     = (n) => Number(n || 0).toLocaleString('vi-VN');
const fmtTime = (dt) => {
  if (!dt) return '—';
  const d = new Date(dt);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')} ${d.getDate()}/${d.getMonth()+1}`;
};
const zoneCap  = (z) => Number(z?.capacity || z?.totalSlots || 0);
const zoneUsed = (z) => Number(z?.usedSlots || z?.currentOccupancy || z?.used || 0);
const zoneName = (z) => z?.zoneName || z?.name || `Zone ${z?.parkingZoneId || z?.id}`;

/* ── main component ──────────────────────── */
export default function OverviewPanel({ onNavigate }) {
  const [zones,    setZones]    = useState([]);
  const [sessions, setSessions] = useState([]);
  const [incidents,setIncidents]= useState([]);
  const [loading,  setLoading]  = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [zo, se] = await Promise.all([
        managerApi.getAllZones(),
        managerApi.getAllSessions(),
      ]);
      setZones(Array.isArray(zo) ? zo : []);
      setSessions(Array.isArray(se) ? se : []);

      // Incidents: cần token có quyền STAFF/MANAGER/ADMIN
      try {
        const inc = await managerApi.getIncidentReports({ page: 0, size: 100 });
        const incArr = inc?.content || inc || [];
        setIncidents(Array.isArray(incArr) ? incArr : []);
      } catch { setIncidents([]); }

    } catch {
      setZones([]); setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  /* ── derived ── */
  const totalSlots = zones.reduce((a, z) => a + zoneCap(z), 0);
  const totalUsed  = zones.reduce((a, z) => a + zoneUsed(z), 0);
  const occupancy  = totalSlots > 0 ? Math.round(totalUsed / totalSlots * 100) : 0;

  // Lượt vào/ra và doanh thu hôm nay
  const today = new Date().toDateString();
  
  // Xe đi vào hôm nay (so khớp ngày check-in)
  const checkinsToday = sessions.filter(s => s.checkInTime && new Date(s.checkInTime).toDateString() === today).length;
  
  // Xe đi ra hôm nay (so khớp ngày check-out)
  const checkoutsToday = sessions.filter(s => s.checkOutTime && new Date(s.checkOutTime).toDateString() === today).length;

  // Doanh thu hôm nay (Tính trên các xe thực hiện thanh toán và đi ra hôm nay - checkOutTime)
  const revenueToday = sessions
    .filter(s => s.checkOutTime && new Date(s.checkOutTime).toDateString() === today && s.totalAmount)
    .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);

  // Cảnh báo: incidents chưa resolve
  const openIncidents = incidents.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS').length;

  const STATS = [
    { label: 'DOANH THU HÔM NAY', value: fmt(revenueToday) + 'đ', color: mt.success },
    { label: 'LƯỢT VÀO / RA',     value: `${checkinsToday} / ${checkoutsToday}`, sub: 'Hôm nay', color: mt.warning },
    { label: 'TỶ LỆ LẤP ĐẦY',    value: `${occupancy}%`, sub: `${totalUsed} / ${totalSlots} chỗ`, color: mt.text },
    { label: 'CẢNH BÁO HỆ THỐNG', value: String(openIncidents), sub: 'Sự cố chưa xử lý', color: openIncidents > 0 ? mt.danger : mt.success },
  ];

  // Zone occupancy cho sidebar
  const zoneStats = zones.map(z => {
    const cap  = zoneCap(z);
    const used = zoneUsed(z);
    const pct  = cap > 0 ? Math.round(used / cap * 100) : 0;
    return { name: zoneName(z), pct, color: pct >= 90 ? mt.danger : pct >= 70 ? mt.warning : mt.success };
  }).slice(0, 8);

  // 10 lượt xe gần nhất
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.checkInTime || 0) - new Date(a.checkInTime || 0))
    .slice(0, 10);

  // Biểu đồ theo giờ (24 giờ)
  const hourlyBars = Array.from({ length: 24 }, (_, h) => {
    const count = sessions.filter(s => s.checkInTime && new Date(s.checkInTime).getHours() === h).length;
    return count;
  });
  const maxBar = Math.max(...hourlyBars, 1);

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
          {loading ? (
            <div style={{ color: mt.textMuted, fontSize: '0.85rem' }}>Đang tải...</div>
          ) : zoneStats.length === 0 ? (
            <div style={{ color: mt.textMuted, fontSize: '0.85rem' }}>Chưa có dữ liệu khu vực.</div>
          ) : zoneStats.map((z) => (
            <div key={z.name} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                <span style={{ color: mt.text, fontWeight: 600 }}>{z.name}</span>
                <span style={{ color: z.color, fontWeight: 700 }}>{z.pct}%</span>
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
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>GIỜ VÀO</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>GIỜ RA</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>LOẠI XE</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>CHI NHÁNH</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>THANH TOÁN</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '1.5rem', textAlign: 'center', color: mt.textMuted }}>Đang tải...</td></tr>
            ) : recentSessions.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '1.5rem', textAlign: 'center', color: mt.textMuted }}>Chưa có lượt xe nào hôm nay.</td></tr>
            ) : recentSessions.map((s) => {
              const status = s.sessionStatus;
              const statusColor = status === 'ACTIVE' ? mt.success : status === 'COMPLETED' ? mt.text : mt.danger;
              const statusLabel = { ACTIVE: '● Đang gửi', COMPLETED: '✓ Hoàn thành', CANCELLED: '✕ Hủy' }[status] || status;
              return (
                <tr key={s.parkingSessionId} style={{ borderTop: `1px solid ${mt.border}` }}>
                  <td style={{ padding: '8px', fontWeight: 700 }}>{s.licensePlate || '—'}</td>
                  <td style={{ padding: '8px', color: mt.textMuted }}>{fmtTime(s.checkInTime)}</td>
                  <td style={{ padding: '8px', color: mt.textMuted }}>{s.checkOutTime ? fmtTime(s.checkOutTime) : '—'}</td>
                  <td style={{ padding: '8px' }}>{s.vehicleTypeName || '—'}</td>
                  <td style={{ padding: '8px', color: mt.textMuted }}>{s.parkingBranchName || '—'}</td>
                  <td style={{ padding: '8px', fontWeight: 600 }}>
                    {s.totalAmount ? fmt(s.totalAmount) + 'đ' : '—'}
                  </td>
                  <td style={{ padding: '8px', color: statusColor, fontWeight: 600 }}>{statusLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
