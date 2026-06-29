import { mt, card } from './managerTheme';

const EMPTY_STATS = [
  { label: 'TONG NHAN VIEN', value: '0', sub: 'Theo du lieu backend', color: mt.text },
  { label: 'DANG TRUC', value: '0', sub: 'Hien tai', color: mt.accent },
];

const statusColor = (s) => (s === 'Dang truc' ? mt.success : s?.startsWith('Tre') ? mt.danger : mt.textMuted);

export default function StaffManagementPanel() {
  const staff = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        ...card, background: mt.primary, color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Canh bao he thong</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Chua co canh bao nhan su tu backend.</div>
        </div>
        <button type="button" style={{
          border: 'none', borderRadius: 8, padding: '0.5rem 1rem', background: '#fff',
          color: mt.primary, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
        }}>Phan bo lai nhan su &rarr;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {EMPTY_STATS.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: mt.text }}>Danh sach nhan su</div>
          <button type="button" style={{
            border: 'none', borderRadius: 8, padding: '0.5rem 1rem', background: mt.success,
            color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
          }}>+ Them nhan su</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>NHAN VIEN</th>
              <th style={{ padding: '6px 8px' }}>VAI TRO</th>
              <th style={{ padding: '6px 8px' }}>CHI NHANH</th>
              <th style={{ padding: '6px 8px' }}>CA TRUC</th>
              <th style={{ padding: '6px 8px' }}>HIEU SUAT</th>
              <th style={{ padding: '6px 8px' }}>TRANG THAI</th>
              <th style={{ padding: '6px 8px' }}>HANH DONG</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '1rem', textAlign: 'center', color: mt.textMuted }}>
                  Chua co du lieu nhan su tu backend.
                </td>
              </tr>
            ) : staff.map((p) => (
              <tr key={p.id || p.name} style={{ borderTop: `1px solid ${mt.border}` }}>
                <td style={{ padding: '8px', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '8px' }}>{p.role}</td>
                <td style={{ padding: '8px', color: mt.textMuted }}>{p.branch}</td>
                <td style={{ padding: '8px' }}>{p.shift}</td>
                <td style={{ padding: '8px', fontWeight: 700 }}>{p.perf}%</td>
                <td style={{ padding: '8px', color: statusColor(p.status), fontWeight: 600 }}>&#9679; {p.status}</td>
                <td style={{ padding: '8px' }}>
                  <button type="button" style={{ border: 'none', background: 'transparent', color: mt.accent, cursor: 'pointer', marginRight: 10 }}>Sua</button>
                  <button type="button" style={{ border: 'none', background: 'transparent', color: mt.danger, cursor: 'pointer' }}>Xoa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
