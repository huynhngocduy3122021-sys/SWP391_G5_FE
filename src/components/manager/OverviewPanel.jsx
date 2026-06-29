import { mt, card } from './managerTheme';

const EMPTY_STATS = [
  { label: 'DOANH THU HOM NAY', value: '0d', color: mt.success },
  { label: 'LUOT XE VAO/RA', value: '0 / 0', sub: 'Vao / Ra', color: mt.warning },
  { label: 'TY LE LAP DAY', value: '0%', sub: '/ 0 cho', color: mt.text },
  { label: 'CANH BAO HE THONG', value: '0', sub: 'Truong hop', color: mt.danger },
];

export default function OverviewPanel({ onNavigate }) {
  const zones = [];
  const recentActivities = [];
  const hourlyTraffic = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {EMPTY_STATS.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, letterSpacing: '0.03em', marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginTop: 6 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div style={card}>
          <div style={{ fontWeight: 700, color: mt.text, marginBottom: 12 }}>Luu luong xe theo gio (24h)</div>
          {hourlyTraffic.length === 0 ? (
            <div style={{ height: 220, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mt.textMuted }}>
              Chua co du lieu tu backend
            </div>
          ) : (
            <div style={{ height: 220, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0.75rem' }}>
              {hourlyTraffic.map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 4, background: mt.accent }} />
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, color: mt.text, marginBottom: 12 }}>Mat do theo khu vuc</div>
          {zones.length === 0 ? (
            <div style={{ color: mt.textMuted, fontSize: '0.85rem' }}>Chua co du lieu khu vuc tu backend.</div>
          ) : zones.map((z) => (
            <div key={z.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                <span style={{ color: mt.text, fontWeight: 600 }}>{z.name}</span>
                <span style={{ color: z.pct > 85 ? mt.danger : mt.text, fontWeight: 700 }}>{z.pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: '#f1f5f9' }}>
                <div style={{ width: `${z.pct}%`, height: '100%', borderRadius: 4, background: z.color || mt.primary }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: mt.text }}>Luot xe ra vao gan nhat</div>
          <button type="button" onClick={() => onNavigate && onNavigate('zones')} style={{
            border: 'none', background: 'transparent', color: mt.accent, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
          }}>Xem tat ca &rarr;</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>BIEN SO</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>THOI GIAN</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>KHU VUC</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>LOAI THE</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>TRANG THAI</th>
            </tr>
          </thead>
          <tbody>
            {recentActivities.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: mt.textMuted }}>
                  Chua co du lieu luot xe tu backend.
                </td>
              </tr>
            ) : recentActivities.map((r) => (
              <tr key={r.id || r.plate} style={{ borderTop: `1px solid ${mt.border}` }}>
                <td style={{ padding: '8px' }}>{r.plate}</td>
                <td style={{ padding: '8px', color: mt.textMuted }}>{r.time}</td>
                <td style={{ padding: '8px' }}>{r.zone}</td>
                <td style={{ padding: '8px' }}>{r.type}</td>
                <td style={{ padding: '8px' }}>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
