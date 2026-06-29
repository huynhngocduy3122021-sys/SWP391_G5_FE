export default function HistorySection() {
  const transactions = [];
  const totalSpent = 0;
  const totalTrips = transactions.length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Lịch sử giao dịch</h4>
          <p className="text-muted small m-0">Dữ liệu được tải từ hệ thống giao dịch thật.</p>
        </div>
        <button className="btn btn-outline-secondary fw-bold shadow-sm d-flex align-items-center gap-2">
          Xuất báo cáo
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100" style={{ background: '#ffffff' }}>
            <p className="text-muted small mb-1 fw-bold">Tổng chi tiêu tháng này</p>
            <h3 className="fw-bold text-dark m-0">
              {totalSpent.toLocaleString('vi-VN')}
              <span style={{ fontSize: '1.2rem' }}>đ</span>
            </h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100" style={{ background: '#ffffff' }}>
            <p className="text-muted small mb-1 fw-bold">Tổng lượt đỗ xe</p>
            <h3 className="fw-bold text-dark m-0">{totalTrips} lượt</h3>
            <p className="text-muted small m-0 mt-2">Theo dữ liệu hiện có</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100 text-white d-flex flex-row align-items-center justify-content-between" style={{ background: '#164e63' }}>
            <div>
              <h6 className="fw-bold mb-1">Báo cáo hàng tháng</h6>
              <p className="small text-white-50 m-0">Chưa cấu hình email nhận báo cáo</p>
            </div>
            <div className="form-check form-switch fs-4 m-0">
              <input className="form-check-input cursor-pointer" type="checkbox" />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm p-4 rounded-4" style={{ background: '#ffffff' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="fw-bold text-dark m-0">Lịch sử vào ra và phí</h6>
          <div className="input-group" style={{ maxWidth: '250px' }}>
            <input type="text" className="form-control bg-light border-0 shadow-none small" placeholder="Tìm mã giao dịch..." />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light text-muted small">
              <tr>
                <th className="fw-semibold">Mã giao dịch</th>
                <th className="fw-semibold">Thời gian</th>
                <th className="fw-semibold">Dịch vụ/Mô tả</th>
                <th className="fw-semibold">Biển số</th>
                <th className="fw-semibold">Số tiền</th>
                <th className="fw-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    Chưa có dữ liệu giao dịch từ backend.
                  </td>
                </tr>
              ) : transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="fw-medium">{tx.id}</td>
                  <td><small>{tx.time}</small></td>
                  <td>{tx.service}</td>
                  <td><span className="badge bg-light text-dark border">{tx.plate}</span></td>
                  <td className="fw-bold text-dark">{tx.amount.toLocaleString('vi-VN')}đ</td>
                  <td>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">Hiển thị {transactions.length} trên tổng số {totalTrips} giao dịch</small>
        </div>
      </div>
    </div>
  );
}
