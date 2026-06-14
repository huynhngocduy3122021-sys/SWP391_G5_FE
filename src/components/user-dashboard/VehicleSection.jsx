
export default function VehicleSection() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1" style={{ color: '#164e63' }}>Phương tiện & Gói cước</h3>
        <p className="text-muted m-0">Quản lý các phương tiện đã đăng ký và các gói dịch vụ đỗ xe của bạn.</p>
      </div>

      <div className="row g-4">
        {/* Cột Trái (Phương tiện & Gói cước) */}
        <div className="col-lg-8">
          
          {/* Phương tiện của tôi */}
          <div className="d-flex justify-content-between align-items-center mb-3 mt-2">
            <h6 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <span className="text-info fs-5">🚘</span> Phương tiện của tôi
            </h6>
            <button className="btn btn-sm text-white fw-medium px-3 rounded-pill" style={{ backgroundColor: '#164e63' }}>
              + Thêm phương tiện mới
            </button>
          </div>

          <div className="row g-3 mb-5">
            <div className="col-md-6">
              <div className="card border p-3 rounded-4 h-100 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="bg-light rounded p-2 text-secondary">
                    🚙
                  </div>
                  <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1" style={{ fontSize: '0.7rem' }}>
                    ● Đã xác minh
                  </span>
                </div>
                <div className="mb-3 mt-2">
                  <div className="text-muted small">VinFast VF8</div>
                  <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: '1px', color: '#164e63' }}>30G-123.45</h4>
                  <div className="text-muted small mt-1">Ô tô điện • Đang hoạt động</div>
                </div>
                <div className="mt-auto border-top pt-2 text-end">
                  <button className="btn btn-link text-decoration-none p-0 fw-bold small" style={{ color: '#164e63', fontSize: '0.85rem' }}>Chỉnh sửa</button>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card border p-3 rounded-4 h-100 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="bg-light rounded p-2 text-secondary">
                    🛵
                  </div>
                  <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1" style={{ fontSize: '0.7rem' }}>
                    ● Đã xác minh
                  </span>
                </div>
                <div className="mb-3 mt-2">
                  <div className="text-muted small">Honda SH 150i</div>
                  <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: '1px', color: '#164e63' }}>29P1-999.99</h4>
                  <div className="text-muted small mt-1">Xe máy • Đang hoạt động</div>
                </div>
                <div className="mt-auto border-top pt-2 text-end">
                  <button className="btn btn-link text-decoration-none p-0 fw-bold small" style={{ color: '#164e63', fontSize: '0.85rem' }}>Chỉnh sửa</button>
                </div>
              </div>
            </div>
          </div>

          {/* Gói cước đang hoạt động */}
          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <span className="text-info fs-5">🎫</span> Gói cước đang hoạt động
          </h6>
          
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-3 text-white" style={{ backgroundColor: '#164e63' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <span className="badge bg-white bg-opacity-25 text-white mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>GÓI CƯ DÂN VIP</span>
                  <h5 className="fw-bold mb-1">VIP Resident - Landmark 81</h5>
                  <p className="small text-white-50 mb-4">Phạm vi: Tòa Landmark 81 & Khu vực B1-B2</p>
                  
                  <div className="d-flex gap-4">
                    <div>
                      <div className="small text-white-50" style={{ fontSize: '0.75rem' }}>Ngày hết hạn</div>
                      <div className="fw-bold fs-6">31/12/2023</div>
                    </div>
                    <div>
                      <div className="small text-white-50" style={{ fontSize: '0.75rem' }}>Tự động gia hạn</div>
                      <div className="fw-bold fs-6 d-flex align-items-center gap-1">
                        <span className="text-white border border-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '16px', height: '16px', fontSize: '10px' }}>✓</span> Bật
                      </div>
                    </div>
                  </div>
                </div>
                <button className="btn bg-white text-dark fw-bold px-4 py-2 rounded-2 shadow-sm" style={{ color: '#164e63' }}>
                  Quản lý gói
                </button>
              </div>
            </div>
          </div>

          <div className="card border rounded-4 shadow-sm mb-4" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
            <div className="card-body p-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-info bg-opacity-10 text-info rounded-3 d-flex justify-content-center align-items-center" style={{ width: '48px', height: '48px' }}>
                  🏷️
                </div>
                <div>
                  <h6 className="fw-bold text-dark m-0">Gói Xe máy Tiết kiệm</h6>
                  <small className="text-muted">Hết hạn: 15/11/2023 • 200,000 VNĐ/tháng</small>
                </div>
              </div>
              <button className="btn btn-outline-secondary fw-bold bg-white text-dark" style={{ borderColor: '#164e63', color: '#164e63' }}>
                Gia hạn ngay
              </button>
            </div>
          </div>
        </div>

        {/* Cột Phải (Lịch sử thanh toán) */}
        <div className="col-lg-4">
          <h6 className="fw-bold text-dark mb-3 mt-2 d-flex align-items-center gap-2">
            <span className="text-info fs-5">🧾</span> Lịch sử thanh toán
          </h6>
          <div className="card border shadow-sm rounded-4" style={{ borderColor: '#e2e8f0' }}>
            <div className="list-group list-group-flush rounded-4">
              <div className="list-group-item p-3 d-flex justify-content-between align-items-center border-bottom">
                <div>
                  <h6 className="fw-medium text-dark m-0 mb-1" style={{ fontSize: '0.9rem' }}>Gia hạn VIP Resident</h6>
                  <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>01/10/2023</small>
                </div>
                <div className="text-end">
                  <h6 className="fw-bold m-0" style={{ color: '#164e63', fontSize: '0.9rem' }}>1,200,000đ</h6>
                  <small className="text-success d-block" style={{ fontSize: '0.75rem' }}>Thành công</small>
                </div>
              </div>
              
              <div className="list-group-item p-3 d-flex justify-content-between align-items-center border-bottom">
                <div>
                  <h6 className="fw-medium text-dark m-0 mb-1" style={{ fontSize: '0.9rem' }}>Gia hạn Gói Xe máy</h6>
                  <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>15/09/2023</small>
                </div>
                <div className="text-end">
                  <h6 className="fw-bold m-0" style={{ color: '#164e63', fontSize: '0.9rem' }}>200,000đ</h6>
                  <small className="text-success d-block" style={{ fontSize: '0.75rem' }}>Thành công</small>
                </div>
              </div>

              <div className="list-group-item p-3 d-flex justify-content-between align-items-center border-bottom">
                <div>
                  <h6 className="fw-medium text-dark m-0 mb-1" style={{ fontSize: '0.9rem' }}>Phí đỗ xe khách (LP)</h6>
                  <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>08/09/2023</small>
                </div>
                <div className="text-end">
                  <h6 className="fw-bold m-0" style={{ color: '#164e63', fontSize: '0.9rem' }}>45,000đ</h6>
                  <small className="text-success d-block" style={{ fontSize: '0.75rem' }}>Thành công</small>
                </div>
              </div>
            </div>
            <div className="card-footer bg-white border-top-0 text-center py-3 rounded-bottom-4">
              <button className="btn btn-link text-decoration-none fw-bold p-0" style={{ color: '#164e63', fontSize: '0.9rem' }}>
                Xem tất cả giao dịch
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
