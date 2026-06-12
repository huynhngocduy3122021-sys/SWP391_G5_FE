const SLOTS = [
  { name: 'Vinparking Tower A',   area: 'Quận 1, TP.HCM',    free: 42,  total: 100, status: 'Bình thường', badgeCls: 'vin-badge--success' },
  { name: 'Vinparking Center B',  area: 'Hoàn Kiếm, HN',     free: 5,   total: 200, status: 'Đầy chỗ',    badgeCls: 'vin-badge--danger' },
  { name: 'Park & Ride Station',  area: 'Thủ Đức, TP.HCM',   free: 129, total: 300, status: 'Thuận lợi',  badgeCls: 'vin-badge--info' },
];

export default function StatusSection() {
  return (
    <section id="locations" className="status-section">
      <div className="status-layout">
        {/* Table */}
        <div className="status-table-wrap">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Trạng thái bãi đỗ thực tế</h2>
            <small style={{ color: 'rgba(255,255,255,0.5)' }}>Cập nhật lúc: 14:02, 18/02/2026</small>
          </div>
          <div className="vin-card" style={{ padding: '0.75rem' }}>
            <div className="vin-table-wrap" style={{ border: 'none' }}>
              <table className="vin-table">
                <thead>
                  <tr>
                    <th>Tên bãi xe</th><th>Khu vực</th><th>Chỗ trống</th><th>Trạng thái</th><th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {SLOTS.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{s.name}</td>
                      <td style={{ color: 'rgba(255,255,255,0.5)' }}>{s.area}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: s.badgeCls.includes('success') ? '#10b981' : s.badgeCls.includes('danger') ? '#ef4444' : '#38bdf8' }}>{s.free}</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}> / {s.total}</span>
                      </td>
                      <td><span className={`vin-badge ${s.badgeCls}`}>{s.status}</span></td>
                      <td>
                        <button className="vin-btn vin-btn--primary vin-btn--sm"
                          onClick={() => alert('Vui lòng đăng nhập để đặt chỗ trước!')}>
                          Đặt trước
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar cards */}
        <div className="status-sidebar">
          <div className="ai-card">
            <div className="ai-card__title">🧠 Dự báo AI</div>
            <p className="ai-card__desc">Khu vực Quận 1 sẽ tăng nhu cầu đỗ xe 25% trong 1 giờ tới.</p>
            <div className="ai-card__row"><span>Tỉ lệ lấp đầy dự kiến</span><span>84%</span></div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: '84%' }} />
            </div>
          </div>
          <div className="perf-card">
            <p>Hiệu suất đỗ hôm nay</p>
            <div className="perf-card__row">
              <span className="perf-card__num">2,485</span>
              <span style={{ fontSize: '1.75rem' }}>📈</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
