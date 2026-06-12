import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
const slots = [
  { name: 'Vinparking Tower A', area: 'Quận 1, TP.HCM', free: 42, total: 100, status: 'Bình thường', variant: 'success' },
  { name: 'Vinparking Center B', area: 'Hoàn Kiếm, HN', free: 5, total: 200, status: 'Đầy chỗ', variant: 'danger' },
  { name: 'Park & Ride Station', area: 'Thủ Đức, TP.HCM', free: 129, total: 300, status: 'Thuận lợi', variant: 'info' },
];

export default function StatusSection() {
  return (
    <section id="locations" className="px-5 py-5">
      <div className="d-flex gap-4 align-items-start">
        {/* Table */}
        <div className="flex-grow-1">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="text-white fw-bold mb-0">Trạng thái bãi đỗ thực tế</h2>
            <small className="text-white-50">Cập nhật lúc: 14:02, 18/02/2026</small>
          </div>
          <div className="rounded-4 p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <table className="table table-dark table-hover mb-0">
              <thead>
                <tr className="text-white-50" style={{ fontSize: '0.85rem' }}>
                  <th>Tên bãi xe</th><th>Khu vực</th><th>Chỗ trống</th><th>Trạng thái</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s, i) => (
                  <tr key={i}>
                    <td className="fw-bold text-white">{s.name}</td>
                    <td className="text-white-50">{s.area}</td>
                    <td><span className={`text-${s.variant} fw-bold`}>{s.free}</span> <span className="text-white-50">/ {s.total}</span></td>
                    <td><span className={`badge bg-${s.variant} bg-opacity-25 text-${s.variant}`}>{s.status}</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary"
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

        {/* Sidebar */}
        <div className="d-flex flex-column gap-3" style={{ minWidth: 240 }}>
          {/* AI Card */}
          <div className="rounded-4 p-4" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.2))', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div className="d-flex align-items-center gap-2 mb-2 fw-semibold text-white">
              <span>🧠</span> Dự báo AI
            </div>
            <p className="text-white-50 small mb-3">Khu vực Quận 1 sẽ tăng nhu cầu đỗ xe 25% trong 1 giờ tới.</p>
            <div className="d-flex justify-content-between small text-white-50 mb-1">
              <span>Tỉ lệ lấp đầy dự kiến</span><span>84%</span>
            </div>
            <div className="progress" style={{ height: 6, background: 'rgba(255,255,255,0.1)' }}>
              <div className="progress-bar bg-primary" style={{ width: '84%' }} />
            </div>
          </div>
          {/* Performance Card */}
          <div className="rounded-4 p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white-50 small mb-2">Hiệu suất đỗ hôm nay</p>
            <div className="d-flex align-items-center justify-content-between">
              <span className="fs-2 fw-bold text-white">2,485</span>
              <span className="fs-3">📈</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
