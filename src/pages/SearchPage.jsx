import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PARKING_LOTS } from '../data/parkingData';

export default function SearchPage() {
  const [allLots] = useState(PARKING_LOTS);
  const [filtered, setFiltered] = useState(PARKING_LOTS);
  const [search, setSearch] = useState({
    location: '',
    dateFrom: '',
    dateTo: '',
    vehicle: 'Ô tô',
  });
  const navigate = useNavigate();

  const handleSearch = () => {
    const keyword = search.location.toLowerCase().trim();
    if (!keyword) {
      setFiltered(allLots);
      return;
    }
    const result = allLots.filter(lot =>
      lot.name.toLowerCase().includes(keyword) ||
      lot.area.toLowerCase().includes(keyword) ||
      lot.address.toLowerCase().includes(keyword)
    );
    if (result.length === 0) {
      toast.info('Không tìm thấy bãi đỗ phù hợp!');
    }
    setFiltered(result);
  };

  const handleBooking = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info('Vui lòng đăng nhập để đặt chỗ!');
      navigate('/auth');
    } else {
      toast.success('Đang chuyển đến trang thanh toán...');
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Hero Search Section */}
      <div style={{ backgroundColor: '#164e63' }} className="py-4">
        <div className="container">
          <div className="bg-white rounded-3 p-3 shadow-sm d-flex flex-column flex-md-row align-items-center gap-0">

            {/* Vị trí */}
            <div className="flex-grow-1 px-3 py-2 w-100" style={{ borderRight: '1px solid #e2e8f0' }}>
              <div className="text-muted small mb-1">🔍 Vị trí</div>
              <input
                type="text"
                className="form-control border-0 p-0 fw-medium shadow-none"
                placeholder="Nhập khu vực, tên bãi..."
                value={search.location}
                onChange={e => setSearch({ ...search, location: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* Ngày nhận xe */}
            <div className="flex-grow-1 px-3 py-2 w-100" style={{ borderRight: '1px solid #e2e8f0' }}>
              <div className="text-muted small mb-1">📅 Ngày nhận xe</div>
              <input
                type="datetime-local"
                className="form-control border-0 p-0 fw-medium shadow-none"
                value={search.dateFrom}
                onChange={e => setSearch({ ...search, dateFrom: e.target.value })}
              />
            </div>

            {/* Ngày lấy xe */}
            <div className="flex-grow-1 px-3 py-2 w-100" style={{ borderRight: '1px solid #e2e8f0' }}>
              <div className="text-muted small mb-1">🕒 Ngày lấy xe</div>
              <input
                type="datetime-local"
                className="form-control border-0 p-0 fw-medium shadow-none"
                value={search.dateTo}
                onChange={e => setSearch({ ...search, dateTo: e.target.value })}
              />
            </div>

            {/* Phương tiện */}
            <div className="flex-grow-1 px-3 py-2 w-100">
              <div className="text-muted small mb-1">🚗 Phương tiện</div>
              <select
                className="form-select border-0 p-0 fw-medium shadow-none bg-transparent"
                value={search.vehicle}
                onChange={e => setSearch({ ...search, vehicle: e.target.value })}
              >
                <option>Ô tô (1 phương tiện)</option>
                <option>Xe máy (1 phương tiện)</option>
              </select>
            </div>
          </div>

          {/* Nút tìm kiếm */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleSearch}
              className="btn btn-lg fw-bold px-5 rounded-pill shadow-sm"
              style={{ backgroundColor: '#3b82f6', border: 'none', color: '#fff' }}
            >
              TÌM KIẾM
            </button>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-white border-bottom py-2 shadow-sm mb-4">
        <div className="container d-flex justify-content-between align-items-center small">
          <span className="text-danger fw-medium">🏷️ Đang tìm giá rẻ hơn? Chúng tôi vừa cập nhật 12 bãi đỗ xe có ưu đãi lớn hôm nay.</span>
          <span className="text-primary fw-bold">Xem ưu đãi ngay!</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="row g-4">

          {/* Sidebar Filters */}
          <div className="col-lg-3">
            <div className="card border-0 shadow-sm mb-4 overflow-hidden position-relative rounded-3" style={{ height: '150px' }}>
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80" alt="Map" className="w-100 h-100 object-fit-cover opacity-75" />
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(22,78,99,0.4)' }}>
                <button type="button" className="btn btn-light fw-bold btn-sm shadow px-3">📍 XEM VỊ TRÍ</button>
              </div>
            </div>

            <div className="card border-0 shadow-sm p-4 rounded-3">
              {/* Tìm nhanh trong sidebar */}
              <div className="input-group mb-4">
                <span className="input-group-text bg-light border-end-0">🔍</span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0 ps-0 shadow-none"
                  placeholder="Tìm kiếm tên bãi đỗ..."
                  value={search.location}
                  onChange={e => {
                    setSearch({ ...search, location: e.target.value });
                    const kw = e.target.value.toLowerCase();
                    setFiltered(!kw ? allLots : allLots.filter(l =>
                      l.name.toLowerCase().includes(kw) ||
                      l.area.toLowerCase().includes(kw)
                    ));
                  }}
                />
              </div>

              <h6 className="fw-bold mb-3">Giá mỗi giờ</h6>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div>
                  <small className="text-muted d-block mb-1">TỐI THIỂU</small>
                  <input type="text" className="form-control form-control-sm" defaultValue="0đ" />
                </div>
                <span className="mt-4">-</span>
                <div>
                  <small className="text-muted d-block mb-1">TỐI ĐA</small>
                  <input type="text" className="form-control form-control-sm" defaultValue="50.000đ" />
                </div>
              </div>

              <h6 className="fw-bold mb-3">Tiện ích bãi đỗ</h6>
              <div className="d-flex flex-column gap-2 mb-4">
                {['Sạc xe điện (EV)', 'Camera an ninh 24/7', 'Mái che ngoài trời', 'Đặt chỗ trước'].map((item, i) => (
                  <div className="form-check" key={i}>
                    <input className="form-check-input" type="checkbox" id={`f${i}`} />
                    <label className="form-check-label text-dark" htmlFor={`f${i}`}>{item}</label>
                  </div>
                ))}
              </div>

              <h6 className="fw-bold mb-3">Chất lượng bãi đỗ</h6>
              <div className="d-flex flex-column gap-2">
                {['★★★★★', '★★★★'].map((s, i) => (
                  <div className="form-check" key={i}>
                    <input className="form-check-input" type="checkbox" id={`r${i}`} />
                    <label className="form-check-label text-warning" htmlFor={`r${i}`}>{s}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0 text-dark">
                {filtered.length} bãi đỗ xe tìm thấy
                {search.location && <span className="text-muted fw-normal fs-6"> cho "{search.location}"</span>}
              </h5>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small text-nowrap">SẮP XẾP THEO:</span>
                <select className="form-select form-select-sm shadow-none" style={{ width: '150px' }}>
                  <option>Phù hợp nhất</option>
                  <option>Giá thấp nhất</option>
                  <option>Đánh giá cao</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: '3rem' }}>🔍</div>
                <h5 className="text-muted mt-3">Không tìm thấy bãi đỗ phù hợp</h5>
                <p className="text-muted small">Thử tìm với từ khóa khác như "Quận 1", "Hà Nội", "Landmark"...</p>
                <button className="btn btn-outline-primary mt-2" onClick={() => { setFiltered(allLots); setSearch({ ...search, location: '' }); }}>
                  Xem tất cả bãi đỗ
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                {filtered.map(lot => (
                  <div key={lot.id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="row g-0">
                      <div className="col-md-4 position-relative">
                        <img src={lot.image} alt={lot.title} className="w-100 h-100 object-fit-cover" style={{ minHeight: '220px' }} />
                        <span className={`position-absolute top-0 start-0 m-2 badge ${lot.tagColor} shadow-sm`}>{lot.tag}</span>
                      </div>
                      <div className="col-md-8">
                        <div className="card-body p-4 d-flex flex-column h-100">
                          <div className="row">
                            <div className="col-sm-8 border-end border-light">
                              <h5 className="fw-bold text-dark mb-1">{lot.title}</h5>
                              <div className="text-warning small mb-2">{'★'.repeat(lot.rating)}{'☆'.repeat(5 - lot.rating)}</div>
                              <p className="text-muted small mb-1">📍 {lot.address} • <span className="text-primary">{lot.distance}</span></p>

                              <div className="d-flex flex-wrap gap-2 mt-3 mb-3">
                                {lot.amenities.map((am, i) => (
                                  <span key={i} className="badge bg-light text-dark border fw-normal">✓ {am}</span>
                                ))}
                              </div>

                              <div className="mt-2">
                                <span className={`badge me-2 ${lot.badgeCls.includes('success') ? 'bg-success' : lot.badgeCls.includes('danger') ? 'bg-danger' : 'bg-info'}`}>
                                  {lot.free}/{lot.total} chỗ trống
                                </span>
                                <span className="text-muted small">{lot.status}</span>
                              </div>

                              {lot.badge && (
                                <div className="mt-2">
                                  <span className="text-danger fw-bold small">{lot.badge}</span>
                                  {lot.badgeDesc && <span className="text-muted small ms-2">{lot.badgeDesc}</span>}
                                </div>
                              )}
                            </div>

                            <div className="col-sm-4 text-end d-flex flex-column justify-content-between ps-sm-3 mt-3 mt-sm-0">
                              <div className="d-flex justify-content-end align-items-start gap-2">
                                <div className="text-end">
                                  <div className="fw-bold text-dark">{lot.scoreLabel}</div>
                                  <div className="text-muted small">{lot.reviews}</div>
                                </div>
                                <div className="bg-primary text-white fw-bold rounded px-2 py-1 fs-5 shadow-sm">{lot.score}</div>
                              </div>

                              <div className="mt-4">
                                <div className="d-flex align-items-center justify-content-end gap-2 mb-1">
                                  <h4 className="fw-bold m-0">{lot.price}</h4>
                                </div>
                                <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>Giá cho 1 giờ sử dụng</div>
                                <div className="fw-bold text-dark small mt-1">Gói tháng: {lot.monthlyPrice}</div>
                                <div className="text-primary small fw-bold mb-3" style={{ fontSize: '0.75rem' }}>Hủy MIỄN PHÍ</div>
                                <button type="button" onClick={handleBooking}
                                  className="btn btn-primary w-100 fw-bold shadow-sm"
                                  style={{ backgroundColor: '#3b82f6', border: 'none' }}>
                                  Đặt Chỗ Ngay
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}