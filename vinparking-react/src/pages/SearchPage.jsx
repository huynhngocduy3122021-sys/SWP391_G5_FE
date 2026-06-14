import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function SearchPage() {
  const [parkingLots] = useState([
    {
      id: 1,
      title: 'Vinparking Landmark 81 - Tầng hầm B2-B3',
      rating: 5,
      address: 'Vinhomes Central Park, Bình Thạnh',
      distance: '0.8 km từ vị trí hiện tại',
      amenities: ['Sạc EV', 'An ninh 24/7', 'Phủ sóng'],
      badge: 'Bán chạy nhất',
      badgeDesc: 'Đã được đặt 42 lần hôm nay',
      score: 9.2,
      scoreLabel: 'Tuyệt vời',
      reviews: '1.245 bài đánh giá',
      originalPrice: '45.000đ',
      discount: '-30%',
      price: '30.000đ',
      monthlyPrice: '2.500.000đ',
      image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      tag: 'Tài trợ',
      tagColor: 'bg-primary'
    },
    {
      id: 2,
      title: 'Vinparking Tower A - Khu trung tâm',
      rating: 4,
      address: 'Quận 1, TP. HCM',
      distance: '1.2 km từ vị trí hiện tại',
      amenities: ['Camera giám sát', 'Thang máy đi lên'],
      badge: 'Chỉ còn 5 chỗ trống!',
      badgeDesc: '',
      score: 8.5,
      scoreLabel: 'Rất tốt',
      reviews: '856 bài đánh giá',
      originalPrice: '35.000đ',
      discount: '-28%',
      price: '25.000đ',
      monthlyPrice: '2.100.000đ',
      image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      tag: 'Mới',
      tagColor: 'bg-danger'
    },
    {
      id: 3,
      title: 'Vinparking Royal City - Khu dân cư',
      rating: 4,
      address: 'Thanh Xuân, Hà Nội',
      distance: '2.5 km từ vị trí hiện tại',
      amenities: ['Có mái che', 'Bảo vệ tuần tra'],
      badge: '',
      badgeDesc: '',
      score: 7.8,
      scoreLabel: 'Hài lòng',
      reviews: '542 bài đánh giá',
      originalPrice: '25.000đ',
      discount: '-20%',
      price: '20.000đ',
      monthlyPrice: '1.800.000đ',
      image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      tag: 'Ưu đãi tháng',
      tagColor: 'bg-success'
    }
  ]);
  const navigate = useNavigate();

  const handleBooking = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info('Vui lòng đăng nhập để đặt chỗ!');
      navigate('/auth');
    } else {
      toast.success('Đang chuyển đến trang thanh toán...');
      // Logic đặt chỗ sẽ triển khai sau
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Hero Search Section */}
      <div style={{ backgroundColor: '#164e63' }} className="py-4 position-relative">
        <div className="container">
          <div className="p-3 border border-2 border-info border-opacity-50 rounded-3" style={{ borderStyle: 'dashed !important' }}>
            <div className="bg-white rounded-2 p-2 d-flex flex-column flex-md-row align-items-center gap-2 shadow-sm">
              <div className="flex-grow-1 border-end px-3 py-2 w-100">
                <div className="text-muted small mb-1">🔍 Vị trí</div>
                <input type="text" className="form-control border-0 p-0 fw-medium shadow-none" defaultValue="Landmark 81, TP. Hồ Chí Minh" />
              </div>
              <div className="flex-grow-1 border-end px-3 py-2 w-100">
                <div className="text-muted small mb-1">📅 Ngày nhận xe</div>
                <input type="text" className="form-control border-0 p-0 fw-medium shadow-none" defaultValue="2 tháng 6 2026, 14:00" />
              </div>
              <div className="flex-grow-1 border-end px-3 py-2 w-100">
                <div className="text-muted small mb-1">🕒 Ngày lấy xe</div>
                <input type="text" className="form-control border-0 p-0 fw-medium shadow-none" defaultValue="3 tháng 6 2026, 16:00" />
              </div>
              <div className="flex-grow-1 px-3 py-2 w-100">
                <div className="text-muted small mb-1">🚗 Phương tiện</div>
                <select className="form-select border-0 p-0 fw-medium shadow-none bg-transparent">
                  <option>Ô tô (1 phương tiện)</option>
                  <option>Xe máy (1 phương tiện)</option>
                </select>
              </div>
            </div>
            <div className="text-center mt-4">
              <button type="button" className="btn btn-primary btn-lg fw-bold px-5 rounded-pill shadow-sm" style={{ backgroundColor: '#3b82f6', border: 'none' }}>
                TÌM KIẾM
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-white border-bottom py-2 shadow-sm mb-4">
        <div className="container d-flex justify-content-between align-items-center small">
          <span className="text-danger fw-medium">🏷️ Đang tìm giá rẻ hơn? Chúng tôi vừa cập nhật 12 bãi đỗ xe có ưu đãi lớn hôm nay.</span>
          <span className="text-primary fw-bold cursor-pointer">Xem ưu đãi ngay!</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="row g-4">
          
          {/* Sidebar Filters */}
          <div className="col-lg-3">
            {/* Map Placeholder */}
            <div className="card border-0 shadow-sm mb-4 overflow-hidden position-relative rounded-3" style={{ height: '150px' }}>
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Map" className="w-100 h-100 object-fit-cover opacity-75" />
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(22,78,99,0.4)' }}>
                <button type="button" className="btn btn-light fw-bold btn-sm shadow px-3">📍 XEM VỊ TRÍ</button>
              </div>
            </div>

            <div className="card border-0 shadow-sm p-4 rounded-3">
              <div className="input-group mb-4">
                <span className="input-group-text bg-light border-end-0">🔍</span>
                <input type="text" className="form-control bg-light border-start-0 ps-0 shadow-none" placeholder="Tìm kiếm tên bãi đỗ..." />
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
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="f1" />
                  <label className="form-check-label text-dark" htmlFor="f1">Sạc xe điện (EV)</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="f2" defaultChecked />
                  <label className="form-check-label text-dark" htmlFor="f2">Camera an ninh 24/7</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="f3" />
                  <label className="form-check-label text-dark" htmlFor="f3">Mái che ngoài trời</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="f4" />
                  <label className="form-check-label text-dark" htmlFor="f4">Đặt chỗ trước</label>
                </div>
              </div>

              <h6 className="fw-bold mb-3">Chất lượng bãi đỗ</h6>
              <div className="d-flex flex-column gap-2">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="r1" />
                  <label className="form-check-label text-warning" htmlFor="r1">★★★★★</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="r2" />
                  <label className="form-check-label text-warning" htmlFor="r2">★★★★</label>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0 text-dark">12 bãi đỗ xe tại Landmark 81</h5>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small text-nowrap">SẮP XẾP THEO:</span>
                <select className="form-select form-select-sm shadow-none" style={{ width: '150px' }}>
                  <option>Phù hợp nhất</option>
                  <option>Giá thấp nhất</option>
                  <option>Đánh giá cao</option>
                </select>
              </div>
            </div>

            <div className="d-flex flex-column gap-4">
              {parkingLots.map(lot => (
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

                            {lot.badge && (
                              <div className="mt-auto">
                                <span className={lot.badge.includes('trống') ? "text-danger fw-bold small" : "text-danger fw-bold small"}>{lot.badge}</span>
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
                              <div className="bg-primary text-white fw-bold rounded px-2 py-1 fs-5 shadow-sm">
                                {lot.score}
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <div className="text-muted small mb-1" style={{ fontSize: '0.7rem' }}>MÃ GIẢM GIÁ ĐÃ ÁP DỤNG</div>
                              <div className="d-flex align-items-center justify-content-end gap-2 mb-1">
                                <span className="badge bg-danger">{lot.discount}</span>
                                <h4 className="fw-bold text-danger m-0">{lot.price}</h4>
                              </div>
                              <div className="text-muted text-decoration-line-through small" style={{ fontSize: '0.8rem' }}>{lot.originalPrice}</div>
                              <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>Giá cho 1 giờ sử dụng</div>
                              <div className="fw-bold text-dark small mt-1">Gói tháng: {lot.monthlyPrice}</div>
                              <div className="text-primary small fw-bold mb-3" style={{ fontSize: '0.75rem' }}>Hủy MIỄN PHÍ</div>
                              
                              <button type="button" onClick={handleBooking} className="btn btn-primary w-100 fw-bold shadow-sm" style={{ backgroundColor: '#3b82f6', border: 'none' }}>
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
          </div>
        </div>
      </div>
    </div>
  );
}
