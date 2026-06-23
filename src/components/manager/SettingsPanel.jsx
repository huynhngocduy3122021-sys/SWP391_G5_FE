import { useState } from 'react';
import { mt, card } from './managerTheme';

const VEHICLE_TYPES = [
  { key: 'xemay', label: 'Xe máy', sub: 'Sức chứa: 1,500 chỗ' },
  { key: 'oto', label: 'Ô tô con', sub: 'Sức chứa: 800 chỗ' },
  { key: 'okhach', label: 'Ô tô khách', sub: 'Sức chứa: 50 chỗ' },
  { key: 'xedien', label: 'Xe điện', sub: 'Sức chứa: 200 chỗ' },
];

const PRICING = {
  xemay: [
    { label: 'Giá block đầu (2h đầu)', value: '5,000', note: 'Mức phí tối thiểu khi vào cổng' },
    { label: 'Giá mỗi giờ tiếp theo', value: '2,000', note: 'Tính theo block 60 phút' },
    { label: 'Giá trần theo ngày (24h)', value: '30,000', note: 'Áp dụng cho khách gửi qua đêm' },
    { label: 'Giá vé tháng (Cư dân)', value: '150,000', note: 'Thanh toán định kỳ mỗi tháng' },
  ],
};

export default function SettingsPanel() {
  const [active, setActive] = useState('xemay');
  const rows = PRICING[active] || PRICING.xemay;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: mt.text }}>Cấu hình Loại xe &amp; Bảng giá</div>
          <div style={{ fontSize: '0.8rem', color: mt.textMuted }}>Quản lý định nghĩa phương tiện và các quy tắc tính phí đỗ xe theo thời gian.</div>
        </div>
        <button type="button" style={{
          border: 'none', borderRadius: 8, padding: '0.6rem 1rem', background: mt.primary,
          color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
        }}>+ Thêm Cấu Hình Mới</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Danh sách loại xe</div>
            {VEHICLE_TYPES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setActive(v.key)}
                style={{
                  display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left',
                  padding: '0.6rem 0.75rem', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  border: 'none', background: active === v.key ? mt.primary : '#f8fafc',
                  color: active === v.key ? '#fff' : mt.text,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.label}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>{v.sub}</span>
              </button>
            ))}
          </div>
          <div style={{ ...card, background: mt.primary, color: '#fff' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>TRẠNG THÁI ÁP DỤNG</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>Chính sách Hiện hành</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 6 }}>&#9679; Đang áp dụng cho toàn hệ thống</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700 }}>Bảng giá vé chi tiết: {VEHICLE_TYPES.find((v) => v.key === active)?.label}</div>
                <div style={{ fontSize: '0.7rem', color: mt.textMuted }}>Cập nhật lần cuối: 15/10/2023 14:30</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>&#9998;</button>
                <button type="button" style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>&#128465;</button>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>HẠNG MỤC THIẾT LẬP</th>
                  <th style={{ padding: '6px 8px' }}>GIÁ TRỊ (VND)</th>
                  <th style={{ padding: '6px 8px' }}>GHI CHÚ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} style={{ borderTop: `1px solid ${mt.border}` }}>
                    <td style={{ padding: '8px' }}>{r.label}</td>
                    <td style={{ padding: '8px', fontWeight: 700 }}>{r.value}</td>
                    <td style={{ padding: '8px', color: mt.textMuted }}>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Chính sách ưu đãi &amp; Miễn phí</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ border: `1px solid ${mt.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>&#128197; Gói gửi xe tháng (Ưu đãi 20%)</div>
                <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginBottom: 10 }}>Tiết kiệm chi phí cho khách thân thiết.</div>
                <span style={{ background: '#dcfce7', color: mt.success, fontSize: '0.7rem', fontWeight: 700, borderRadius: 999, padding: '2px 10px' }}>ĐANG CHẠY</span>
              </div>
              <div style={{ border: `1px solid ${mt.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>&#128179; Ưu đãi nạp ví &gt; 1.000.000đ</div>
                <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginBottom: 10 }}>Tặng ngay 50.000đ vào tài khoản gửi xe.</div>
                <span style={{ background: '#dcfce7', color: mt.success, fontSize: '0.7rem', fontWeight: 700, borderRadius: 999, padding: '2px 10px' }}>ĐANG CHẠY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
