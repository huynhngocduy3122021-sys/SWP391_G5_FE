import { mt, card } from './managerTheme';

const BLOCKS = [
  { name: 'Block A1', status: 'Còn chỗ', statusColor: mt.success, used: 145, total: 200, pct: 72 },
  { name: 'Block A2', status: 'Đầy', statusColor: mt.danger, used: 198, total: 200, pct: 99 },
  { name: 'Block M1 (Xe máy)', status: 'Còn chỗ', statusColor: mt.success, used: 312, total: 500, pct: 62 },
  { name: 'Block B1', status: 'Đặt trước', statusColor: mt.warning, used: 45, total: 150, pct: 30 },
  { name: 'Block B2', status: 'Bảo trì', statusColor: mt.textMuted, used: 0, total: 150, pct: 0 },
];

const LOGS = [
  { time: '08:45', type: 'Mất thẻ xe', plate: '30K-123.45', loc: 'Block A1 - A05', action: 'Phê duyệt' },
  { time: '09:12', type: 'Xe đỗ sai khu vực', plate: '29P1-999.88', loc: 'Block M1 - M12', action: 'Xử lý' },
  { time: '10:05', type: 'Xe quá hạn gửi', plate: '51F-888.88', loc: 'Block B1 - B22', action: 'Chi tiết' },
];

export default function ZoneOverviewPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {BLOCKS.map((b) => (
            <div key={b.name} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: mt.text }}>{b.name}</span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: `${b.statusColor}1A`, color: b.statusColor,
                }}>{b.status}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: mt.textMuted, marginBottom: 10 }}>Đã dùng {b.pct}%</div>
              <div style={{ height: 6, borderRadius: 4, background: '#f1f5f9', marginBottom: 6 }}>
                <div style={{ width: `${b.pct}%`, height: '100%', borderRadius: 4, background: mt.primary }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: mt.textMuted }}>{b.used} / {b.total} slots</div>
            </div>
          ))}
          <button type="button" style={{
            ...card, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px dashed ${mt.border}`, color: mt.textMuted, cursor: 'pointer', fontWeight: 600,
            background: 'transparent',
          }}>
            + Thêm phân khu mới
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ ...card, background: mt.primary, color: '#fff' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 6 }}>TỔNG CÔNG SUẤT</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>84%</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 12 }}>1,420 / 1,700 vị trí</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span>Ô tô<br /><b>92%</b></span>
              <span>Xe máy<br /><b>76%</b></span>
            </div>
          </div>
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Chi tiết hiện trạng</div>
            {[
              { code: 'B1', name: 'Hầm B1', pct: 95, slots: 850 },
              { code: 'B2', name: 'Hầm B2', pct: 72, slots: 600 },
              { code: 'NT', name: 'Ngoài trời', pct: 45, slots: 250 },
            ].map((r) => (
              <div key={r.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '0.8rem' }}>
                <span style={{ color: mt.textMuted }}>{r.code} &nbsp;{r.name}</span>
                <span style={{ fontWeight: 700, color: r.pct > 85 ? mt.danger : mt.text }}>{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: mt.danger }}>&#9888; Nhật ký xử lý ngoại lệ &amp; Sự cố khẩn cấp</div>
          <button type="button" style={{ border: 'none', background: 'transparent', color: mt.accent, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>Xem tất cả</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>THỜI GIAN</th>
              <th style={{ padding: '6px 8px' }}>LOẠI SỰ CỐ</th>
              <th style={{ padding: '6px 8px' }}>BIỂN SỐ</th>
              <th style={{ padding: '6px 8px' }}>VỊ TRÍ</th>
              <th style={{ padding: '6px 8px' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {LOGS.map((l) => (
              <tr key={l.time} style={{ borderTop: `1px solid ${mt.border}` }}>
                <td style={{ padding: '8px' }}>{l.time}</td>
                <td style={{ padding: '8px' }}>&#9679; {l.type}</td>
                <td style={{ padding: '8px', fontWeight: 600 }}>{l.plate}</td>
                <td style={{ padding: '8px', color: mt.textMuted }}>{l.loc}</td>
                <td style={{ padding: '8px' }}>
                  <button type="button" style={{
                    border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 6,
                    padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer',
                  }}>{l.action}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
