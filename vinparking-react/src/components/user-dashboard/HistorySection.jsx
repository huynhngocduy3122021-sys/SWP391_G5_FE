export default function HistorySection() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Lịch sử giao dịch</h4>
          <p className="text-muted small m-0">Tổng hợp chi tiết các khoản phí đỗ xe và giao dịch của bạn</p>
        </div>
        <button className="btn btn-outline-secondary fw-bold shadow-sm d-flex align-items-center gap-2">
          <span>⬇️</span> Xuất báo cáo
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100" style={{ background: '#ffffff' }}>
            <p className="text-muted small mb-1 fw-bold">Tổng chi tiêu (tháng này)</p>
            <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '1px' }}>1,340,000<span style={{ fontSize: '1.2rem' }}>đ</span></h3>
            <p className="text-success small m-0 mt-2">↓ 15% so với tháng trước</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100" style={{ background: '#ffffff' }}>
            <p className="text-muted small mb-1 fw-bold">Tổng lượt đỗ xe</p>
            <h3 className="fw-bold text-dark m-0">35 lượt</h3>
            <p className="text-muted small m-0 mt-2">Trong 30 ngày qua</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100 text-white d-flex flex-row align-items-center justify-content-between" style={{ background: '#164e63' }}>
            <div>
              <h6 className="fw-bold mb-1">Nhận báo cáo hàng tháng</h6>
              <p className="small text-white-50 m-0">Qua email tuan.ngu***@email.com</p>
            </div>
            <div className="form-check form-switch fs-4 m-0">
              <input className="form-check-input cursor-pointer" type="checkbox" defaultChecked />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm p-4 rounded-4" style={{ background: '#ffffff' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="fw-bold text-dark m-0">Lịch sử vào ra & Phí</h6>
          <div className="input-group" style={{ maxWidth: '250px' }}>
            <span className="input-group-text bg-light border-0 text-muted">🔍</span>
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
              <tr>
                <td className="fw-medium">#VP-89234</td>
                <td><small>18:45<br/>13/12/2023</small></td>
                <td><span className="fw-medium">Đỗ xe vãng lai</span><br/><small className="text-muted">TTTM Vincom</small></td>
                <td><span className="badge bg-light text-dark border">30G-123.45</span></td>
                <td className="fw-bold text-dark">25,000đ</td>
                <td><span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">Thành công</span></td>
              </tr>
              <tr>
                <td className="fw-medium">#VP-89102</td>
                <td><small>10:15<br/>10/12/2023</small></td>
                <td><span className="fw-medium">Gia hạn gói đỗ xe</span><br/><small className="text-muted">Gói tháng - VinHomes</small></td>
                <td><span className="badge bg-light text-dark border">30G-123.45</span></td>
                <td className="fw-bold text-dark">1,200,000đ</td>
                <td><span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">Thành công</span></td>
              </tr>
              <tr>
                <td className="fw-medium">#VP-88950</td>
                <td><small>19:00<br/>08/12/2023</small></td>
                <td><span className="fw-medium">Đỗ xe vãng lai</span><br/><small className="text-muted">KĐT VinHomes Ocean Park</small></td>
                <td><span className="badge bg-light text-dark border">29D-987.65</span></td>
                <td className="fw-bold text-dark">15,000đ</td>
                <td><span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">Thành công</span></td>
              </tr>
              <tr>
                <td className="fw-medium">#VP-88712</td>
                <td><small>08:30<br/>05/12/2023</small></td>
                <td><span className="fw-medium">Đỗ xe vãng lai</span><br/><small className="text-muted">TTTM Times City</small></td>
                <td><span className="badge bg-light text-dark border">30G-123.45</span></td>
                <td className="fw-bold text-dark">45,000đ</td>
                <td><span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill">Đã hủy</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">Hiển thị 1-4 trên tổng số 35 giao dịch</small>
          <nav>
            <ul className="pagination pagination-sm m-0">
              <li className="page-item disabled"><a className="page-link" href="#!">Trước</a></li>
              <li className="page-item active"><a className="page-link" href="#!" style={{ backgroundColor: '#164e63', borderColor: '#164e63' }}>1</a></li>
              <li className="page-item"><a className="page-link text-dark" href="#!">2</a></li>
              <li className="page-item"><a className="page-link text-dark" href="#!">3</a></li>
              <li className="page-item"><a className="page-link text-dark" href="#!">Sau</a></li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
