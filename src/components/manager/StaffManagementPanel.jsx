import { mt, card } from './managerTheme';

const STATS = [
  { label: 'TỔNG NHÂN VIÊN', value: '128', sub: '+4 tháng này', color: mt.text },
  { label: 'ĐANG TRỰC', value: '42', sub: 'Hiện tại', color: mt.accent },
];

const STAFF = [
  { name: 'Nguyễn Văn A', role: 'Bảo vệ', shift: 'Ca sáng', branch: 'Khu trung tâm', perf: 98, status: 'Đang trực' },
  { name: 'Trần Thị B', role: 'Vận hành', shift: 'Ca chiều', branch: 'Khu Tây', perf: 92, status: 'Đang trực' },
  { name: 'Lê Văn C', role: 'Quản lý ca', shift: 'Ca sáng', branch: 'Trụ sở chính', perf: 100, status: 'Nghỉ' },
  { name: 'Phạm Thị D', role: 'Bảo vệ', shift: 'Ca tối', branch: 'Khu VIP', perf: 95, status: 'Trễ (5p)' },
];

const statusColor = (s) => (s === 'Đang trực' ? mt.success : s.startsWith('Trễ') ? mt.danger : mt.textMuted);

export default function StaffManagementPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        ...card, background: mt.primary, color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Cảnh báo hệ thống</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Ca tối khu vực Cổng Bắc hiện đang thiếu nhân sự.</div>
        </div>
        <button type="button" style={{
          border: 'none', borderRadius: 8, padding: '0.5rem 1rem', background: '#fff',
          color: mt.primary, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
        }}>Phân bổ lại nhân sự &rarr;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {STATS.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: mt.text }}>Danh sách nhân sự</div>
          <button type="button" style={{
            border: 'none', borderRadius: 8, padding: '0.5rem 1rem', background: mt.success,
            color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
          }}>+ Thêm nhân sự</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>NHÂN VIÊN</th>
              <th style={{ padding: '6px 8px' }}>VAI TRÒ</th>
              <th style={{ padding: '6px 8px' }}>CHI NHÁNH</th>
              <th style={{ padding: '6px 8px' }}>CA TRỰC</th>
              <th style={{ padding: '6px 8px' }}>HIỆU SUẤT</th>
              <th style={{ padding: '6px 8px' }}>TRẠNG THÁI</th>
              <th style={{ padding: '6px 8px' }}>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {STAFF.map((p) => (
              <tr key={p.name} style={{ borderTop: `1px solid ${mt.border}` }}>
                <td style={{ padding: '8px', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '8px' }}>{p.role}</td>
                <td style={{ padding: '8px', color: mt.textMuted }}>{p.branch}</td>
                <td style={{ padding: '8px' }}>{p.shift}</td>
                <td style={{ padding: '8px', fontWeight: 700 }}>{p.perf}%</td>
                <td style={{ padding: '8px', color: statusColor(p.status), fontWeight: 600 }}>&#9679; {p.status}</td>
                <td style={{ padding: '8px' }}>
                  <button type="button" style={{ border: 'none', background: 'transparent', color: mt.accent, cursor: 'pointer', marginRight: 10 }}>Sửa</button>
                  <button type="button" style={{ border: 'none', background: 'transparent', color: mt.danger, cursor: 'pointer' }}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
