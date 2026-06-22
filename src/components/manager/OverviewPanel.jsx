import { mt, card } from './managerTheme';

const STATS = [
  { label: 'DOANH THU HÔM NAY', value: '42.850.000đ', delta: '+12.5% so với hôm qua', color: mt.success },
  { label: 'LƯỢT XE VÀO/RA', value: '1,240 / 1,085', sub: 'Vào / Ra', color: mt.warning },
  { label: 'TỶ LỆ LẤP ĐẦY', value: '84%', sub: '/ 2500 chỗ', color: mt.text },
  { label: 'CẢNH BÁO HỆ THỐNG', value: '07', sub: 'Trường hợp', color: mt.danger, alert: true },
];

const ZONES = [
  { name: 'Hầm B1 (Ô tô)', pct: 92, used: 460, free: 40, color: mt.danger },
  { name: 'Hầm B2 (Ô tô)', pct: 75, used: 375, free: 125, color: '#0f172a' },
  { name: 'Hầm B3 (Xe máy)', pct: 45, used: 450, free: 550, color: mt.warning },
  { name: 'Khu vực ngoài trời', pct: 12, used: 24, free: 176, color: '#cbd5e1' },
];

const RECENT = [
  { plate: '30A - 123.45', time: '14:23:45 12/10/2023', zone: 'Hầm B1 - Cổng 02', type: 'VÉ THÁNG', status: 'Vào bãi', ok: true },
  { plate: '51G - 888.99', time: '14:20:12 12/10/2023', zone: 'Hầm B2 - Cổng 01', type: 'VÉ LƯỢT', status: 'Ra bãi (55k)', ok: false },
  { plate: '29D - 456.78', time: '14:18:05 12/10/2023', zone: 'Ngoài trời - Cổng 04', type: 'VIP', status: 'Vào bãi', ok: true },
];

export default function OverviewPanel({ onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {STATS.map((s) => (
          <div key={s.label} style={{
            ...card,
            background: s.alert ? '#fef2f2' : '#fff',
            borderColor: s.alert ? '#fecaca' : mt.border,
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, letterSpacing: '0.03em', marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.alert ? mt.danger : s.color }}>{s.value}</div>
            {s.delta && <div style={{ fontSize: '0.75rem', color: mt.success, marginTop: 6 }}>&#8599; {s.delta}</div>}
            {s.sub && <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginTop: 6 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        {/* Traffic placeholder chart */}
        <div style={card}>
          <div style={{ fontWeight: 700, color: mt.text, marginBottom: 12 }}>Lưu lượng xe theo giờ (24h)</div>
          <div style={{
            height: 220, borderRadius: 8, background: 'linear-gradient(180deg, #ecfdf5 0%, #f8fafc 100%)',
            display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0.75rem',
          }}>
            {[40, 55, 70, 85, 65, 50, 60, 95, 100, 70, 45, 35].map((h, i) => (
              <div key={i} style={{
                flex: 1, height: `${h}%`, borderRadius: 4,
                background: h === 100 ? mt.accent : '#a7e3d6',
              }} />
            ))}
          </div>
        </div>

        {/* Zone density */}
        <div style={card}>
          <div style={{ fontWeight: 700, color: mt.text, marginBottom: 12 }}>Mật độ theo khu vực</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ZONES.map((z) => (
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
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: mt.text }}>Lượt xe ra vào gần nhất</div>
          <button type="button" onClick={() => onNavigate && onNavigate('zones')} style={{
            border: 'none', background: 'transparent', color: mt.accent, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
          }}>Xem tất cả &rarr;</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>BIỂN SỐ</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>THỜI GIAN</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>KHU VỰC</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>LOẠI THẺ</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {RECENT.map((r) => (
              <tr key={r.plate} style={{ borderTop: `1px solid ${mt.border}` }}>
                <td style={{ padding: '8px' }}>
                  <span style={{ background: '#f1f5f9', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{r.plate}</span>
                </td>
                <td style={{ padding: '8px', color: mt.textMuted }}>{r.time}</td>
                <td style={{ padding: '8px' }}>{r.zone}</td>
                <td style={{ padding: '8px' }}>
                  <span style={{
                    background: r.type === 'VIP' ? '#fef9c3' : '#f1f5f9', borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                  }}>{r.type}</span>
                </td>
                <td style={{ padding: '8px', color: r.ok ? mt.success : mt.danger, fontWeight: 600 }}>
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
