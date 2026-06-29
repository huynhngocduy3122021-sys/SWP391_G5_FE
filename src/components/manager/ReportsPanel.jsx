import { mt, card } from './managerTheme';

const EMPTY_STATS = [
  { label: 'TONG DOANH THU', value: '0d' },
  { label: 'TB GIAI DOAN', value: '0d' },
  { label: 'LUOT GIAO DICH', value: '0' },
  { label: 'TANG TRUONG NAM', value: '0%' },
];

export default function ReportsPanel() {
  const rows = [];
  const chartBars = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {EMPTY_STATS.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: mt.text }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, color: mt.text, marginBottom: 4 }}>Bieu do xu huong doanh thu</div>
        <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginBottom: 12 }}>Du lieu se hien thi khi backend tra ve bao cao doanh thu.</div>
        {chartBars.length === 0 ? (
          <div style={{ height: 200, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mt.textMuted }}>
            Chua co du lieu bao cao tu backend
          </div>
        ) : (
          <div style={{ height: 200, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0.75rem' }}>
            {chartBars.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 3, background: mt.primary, opacity: 0.85 }} />
            ))}
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, color: mt.text, marginBottom: 12 }}>Chi tiet doanh thu hang ngay</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>THOI GIAN</th>
              <th style={{ padding: '6px 8px' }}>O TO</th>
              <th style={{ padding: '6px 8px' }}>XE MAY</th>
              <th style={{ padding: '6px 8px' }}>XE DIEN</th>
              <th style={{ padding: '6px 8px' }}>TONG DOANH THU</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: mt.textMuted }}>
                  Chua co du lieu doanh thu tu backend.
                </td>
              </tr>
            ) : rows.map((r) => (
              <tr key={r.time} style={{ borderTop: `1px solid ${mt.border}` }}>
                <td style={{ padding: '8px' }}>{r.time}</td>
                <td style={{ padding: '8px' }}>{r.oto}</td>
                <td style={{ padding: '8px' }}>{r.xemay}</td>
                <td style={{ padding: '8px' }}>{r.xedien}</td>
                <td style={{ padding: '8px', fontWeight: 700 }}>{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
