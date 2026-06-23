import { mt, card } from './managerTheme';

const STATS = [
  { label: 'TỔNG DOANH THU', value: '2.450,8M', delta: '+12.5%', good: true },
  { label: 'TB GIAI ĐOẠN', value: '79,05M', delta: '+4.2%', good: true },
  { label: 'LƯỢT GIAO DỊCH', value: '45.289', delta: '-2.1%', good: false },
  { label: 'TĂNG TRƯỞNG NĂM', value: '+18,4%', delta: null, good: true },
];

const ROWS = [
  { time: '01/10', oto: '12.4M', xemay: '3.1M', xedien: '0.8M', total: '16.3M' },
  { time: '02/10', oto: '13.1M', xemay: '2.9M', xedien: '0.9M', total: '16.9M' },
  { time: '03/10', oto: '11.8M', xemay: '3.4M', xedien: '0.7M', total: '15.9M' },
];

export default function ReportsPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {STATS.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: mt.text }}>{s.value}</div>
            {s.delta && (
              <div style={{ fontSize: '0.75rem', marginTop: 6, color: s.good ? mt.success : mt.danger }}>
                {s.good ? '\u2197' : '\u2198'} {s.delta}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, color: mt.text, marginBottom: 4 }}>Biểu đồ xu hướng doanh thu</div>
        <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginBottom: 12 }}>Chi tiết theo thời gian đã chọn (Đơn vị: Triệu VNĐ)</div>
        <div style={{
          height: 200, borderRadius: 8, background: '#f8fafc',
          display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0.75rem',
        }}>
          {[60, 65, 58, 70, 75, 68, 80, 72, 85, 90, 78, 82].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 3, background: mt.primary, opacity: 0.85 }} />
          ))}
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
              <th style={{ padding: '6px 8px' }}>XE ĐIỆN</th>
              <th style={{ padding: '6px 8px' }}>TỔNG DOANH THU</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
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
