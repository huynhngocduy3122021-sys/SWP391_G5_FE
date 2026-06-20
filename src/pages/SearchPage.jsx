import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PARKING_LOTS } from '../data/parkingData';

export default function SearchPage() {
  const [search, setSearch] = useState({
    location: '',
    dateFrom: '',
    dateTo: '',
    vehicle: 'Ô tô (1 phương tiện)',
  });

  const [appliedSearch, setAppliedSearch] = useState({
    location: '',
    dateFrom: '',
    dateTo: '',
    vehicle: 'Ô tô (1 phương tiện)',
  });

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000);

  const [amenities, setAmenities] = useState({
    ev: false,
    security: false,
    covered: false,
    prebook: false,
  });

  const [ratings, setRatings] = useState({
    five: false,
    four: false,
  });

  const navigate = useNavigate();

  const handleSearchSubmit = () => {
    setAppliedSearch({ ...search });
  };

  const handleBooking = (lot) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info('Vui lòng đăng nhập để đặt chỗ!');
      navigate('/auth');
    } else {
      navigate('/booking', { 
        state: { 
          lot, 
          entryTime: search.dateFrom, 
          exitTime: search.dateTo,
          selectedVehicle: search.vehicle.includes('Xe máy') ? 'Xe máy' : 'Ô tô'
        } 
      });
    }
  };

  // Derive filtered results inside render to keep state clean and reactive
  const keyword = appliedSearch.location.toLowerCase().trim();
  const filtered = PARKING_LOTS.filter(lot => {
    // 1. Keyword search (Location matches name, area, address)
    if (keyword) {
      const matchKeyword = lot.name.toLowerCase().includes(keyword) ||
                           lot.area.toLowerCase().includes(keyword) ||
                           lot.address.toLowerCase().includes(keyword);
      if (!matchKeyword) return false;
    }

    // 2. Price filter (differentiation for Car vs Motorcycle)
    const isMotorcycle = appliedSearch.vehicle.toLowerCase().includes('xe máy');
    const priceNum = isMotorcycle ? 5000 : (parseInt(lot.price.replace(/[^0-9]/g, ''), 10) || 30000);
    if (priceNum < minPrice || priceNum > maxPrice) return false;

    // 3. Amenities filter
    if (amenities.ev && !lot.amenities.some(am => am.toLowerCase().includes('ev') || am.toLowerCase().includes('điện'))) {
      return false;
    }
    if (amenities.security && !lot.amenities.some(am => am.toLowerCase().includes('an ninh') || am.toLowerCase().includes('bảo vệ') || am.toLowerCase().includes('camera') || am.toLowerCase().includes('giám sát'))) {
      return false;
    }
    if (amenities.covered && !lot.amenities.some(am => am.toLowerCase().includes('mái che') || am.toLowerCase().includes('hầm'))) {
      return false;
    }
    if (amenities.prebook && !lot.amenities.some(am => am.toLowerCase().includes('phủ sóng') || am.toLowerCase().includes('đỗ trước') || am.toLowerCase().includes('đặt chỗ'))) {
      return false;
    }

    // 4. Rating filter
    const hasRatingFilter = ratings.five || ratings.four;
    if (hasRatingFilter) {
      if (ratings.five && lot.rating === 5) return true;
      if (ratings.four && lot.rating === 4) return true;
      return false;
    }

    return true;
  });

  return (
    <div className="bg-light min-vh-100 pb-5" style={{ color: '#1e293b' }}>
      {/* Hero Search Section */}
      <div style={{ backgroundColor: '#164e63' }} className="py-4">
        <div className="container">
          <div className="bg-white rounded-3 p-3 shadow-sm d-flex flex-column flex-md-row align-items-center gap-0">

            {/* Vị trí */}
            <div className="flex-grow-1 px-3 py-2 w-100" style={{ borderRight: '1px solid #e2e8f0' }}>
              <div className="text-muted small mb-1">🔍 Vị trí</div>
              <input
                type="text"
                className="form-control border-0 p-0 fw-medium shadow-none bg-transparent"
                placeholder="Nhập khu vực, tên bãi..."
                value={search.location}
                onChange={e => setSearch({ ...search, location: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
              />
            </div>

            {/* Ngày nhận xe */}
            <div className="flex-grow-1 px-3 py-2 w-100" style={{ borderRight: '1px solid #e2e8f0' }}>
              <div className="text-muted small mb-1">📅 Ngày nhận xe</div>
              <input
                type="datetime-local"
                className="form-control border-0 p-0 fw-medium shadow-none bg-transparent"
                value={search.dateFrom}
                onChange={e => setSearch({ ...search, dateFrom: e.target.value })}
              />
            </div>

            {/* Phương tiện */}
            <div className="flex-grow-1 px-3 py-2 w-100">
              <div className="text-muted small mb-1">🚗 Phương tiện</div>
              <select
                className="form-select border-0 p-0 fw-medium shadow-none bg-transparent text-dark"
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
              onClick={handleSearchSubmit}
              className="btn btn-lg fw-bold px-5 rounded-pill shadow-sm text-white"
              style={{ backgroundColor: '#3b82f6', border: 'none' }}
            >
              TÌM KIẾM
            </button>
          </div>
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

            <div className="card border-0 shadow-sm p-4 rounded-3 bg-white">
              {/* Tìm nhanh trong sidebar */}
              <div className="input-group mb-4">
                <span className="input-group-text bg-light border-end-0">🔍</span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0 ps-0 shadow-none text-dark"
                  placeholder="Tìm kiếm tên bãi đỗ..."
                  value={search.location}
                  onChange={e => {
                    setSearch({ ...search, location: e.target.value });
                    setAppliedSearch(prev => ({ ...prev, location: e.target.value }));
                  }}
                />
              </div>

              <h6 className="fw-bold mb-3 text-dark">Giá mỗi giờ</h6>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div>
                  <small className="text-muted d-block mb-1">TỐI THIỂU</small>
                  <input 
                    type="number" 
                    className="form-control form-control-sm text-dark bg-light border" 
                    value={minPrice} 
                    onChange={e => setMinPrice(Number(e.target.value) || 0)} 
                  />
                </div>
                <span className="mt-4 text-muted">-</span>
                <div>
                  <small className="text-muted d-block mb-1">TỐI ĐA</small>
                  <input 
                    type="number" 
                    className="form-control form-control-sm text-dark bg-light border" 
                    value={maxPrice} 
                    onChange={e => setMaxPrice(Number(e.target.value) || 0)} 
                  />
                </div>
              </div>

              <h6 className="fw-bold mb-3 text-dark">Tiện ích bãi đỗ</h6>
              <div className="d-flex flex-column gap-2 mb-4 text-dark">
                <div className="form-check">
                  <input 
                    className="form-check-input cursor-pointer" 
                    type="checkbox" 
                    id="fEv"
                    checked={amenities.ev}
                    onChange={e => setAmenities({ ...amenities, ev: e.target.checked })}
                  />
                  <label className="form-check-label cursor-pointer" htmlFor="fEv">Sạc xe điện (EV)</label>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input cursor-pointer" 
                    type="checkbox" 
                    id="fSecurity" 
                    checked={amenities.security}
                    onChange={e => setAmenities({ ...amenities, security: e.target.checked })}
                  />
                  <label className="form-check-label cursor-pointer" htmlFor="fSecurity">Camera an ninh 24/7</label>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input cursor-pointer" 
                    type="checkbox" 
                    id="fCovered" 
                    checked={amenities.covered}
                    onChange={e => setAmenities({ ...amenities, covered: e.target.checked })}
                  />
                  <label className="form-check-label cursor-pointer" htmlFor="fCovered">Mái che ngoài trời</label>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input cursor-pointer" 
                    type="checkbox" 
                    id="fPrebook" 
                    checked={amenities.prebook}
                    onChange={e => setAmenities({ ...amenities, prebook: e.target.checked })}
                  />
                  <label className="form-check-label cursor-pointer" htmlFor="fPrebook">Đặt chỗ trước</label>
                </div>
              </div>

              <h6 className="fw-bold mb-3 text-dark">Chất lượng bãi đỗ</h6>
              <div className="d-flex flex-column gap-2 text-dark">
                <div className="form-check">
                  <input 
                    className="form-check-input cursor-pointer" 
                    type="checkbox" 
                    id="rFive" 
                    checked={ratings.five}
                    onChange={e => setRatings({ ...ratings, five: e.target.checked })}
                  />
                  <label className="form-check-label text-warning cursor-pointer" htmlFor="rFive">★★★★★ (5 sao)</label>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input cursor-pointer" 
                    type="checkbox" 
                    id="rFour" 
                    checked={ratings.four}
                    onChange={e => setRatings({ ...ratings, four: e.target.checked })}
                  />
                  <label className="form-check-label text-warning cursor-pointer" htmlFor="rFour">★★★★ (4 sao)</label>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0 text-dark">
                {filtered.length} bãi đỗ xe tìm thấy
                {appliedSearch.location && <span className="text-muted fw-normal fs-6"> cho "{appliedSearch.location}"</span>}
              </h5>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small text-nowrap">SẮP XẾP THEO:</span>
                <select className="form-select form-select-sm shadow-none bg-white text-dark" style={{ width: '150px' }}>
                  <option>Phù hợp nhất</option>
                  <option>Giá thấp nhất</option>
                  <option>Đánh giá cao</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-light">
                <div style={{ fontSize: '3rem' }}>🔍</div>
                <h5 className="text-muted mt-3">Không tìm thấy bãi đỗ phù hợp</h5>
                <p className="text-muted small">Thử tìm với từ khóa khác như "Quận 1", "Hà Nội", "Landmark" hoặc điều chỉnh bộ lọc.</p>
                <button 
                  className="btn btn-outline-primary mt-2" 
                  onClick={() => {
                    setSearch({ location: '', dateFrom: '', dateTo: '', vehicle: 'Ô tô (1 phương tiện)' });
                    setAppliedSearch({ location: '', dateFrom: '', dateTo: '', vehicle: 'Ô tô (1 phương tiện)' });
                    setMinPrice(0);
                    setMaxPrice(50000);
                    setAmenities({ ev: false, security: false, covered: false, prebook: false });
                    setRatings({ five: false, four: false });
                  }}
                >
                  Xem tất cả bãi đỗ
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                {filtered.map(lot => {
                  const isMotorcycle = appliedSearch.vehicle.toLowerCase().includes('xe máy');
                  const hourlyPriceLabel = isMotorcycle ? "5.000đ" : lot.price;
                  const monthlyPriceLabel = isMotorcycle ? "200.000đ" : lot.monthlyPrice;
                  
                  return (
                    <div key={lot.id} className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
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
                                  <span className={`badge me-2 ${lot.badgeCls.includes('success') ? 'bg-success text-white' : lot.badgeCls.includes('danger') ? 'bg-danger text-white' : 'bg-info text-dark'}`}>
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
                                  <div className="text-end text-dark">
                                    <div className="fw-bold">{lot.scoreLabel}</div>
                                    <div className="text-muted small">{lot.reviews}</div>
                                  </div>
                                  <div className="bg-primary text-white fw-bold rounded px-2 py-1 fs-5 shadow-sm">{lot.score}</div>
                                </div>

                                <div className="mt-4 text-dark">
                                  <div className="d-flex align-items-center justify-content-end gap-2 mb-1">
                                    <h4 className="fw-bold m-0" style={{ color: '#164e63' }}>{hourlyPriceLabel}</h4>
                                  </div>
                                  <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                                    {isMotorcycle ? "Giá vé ban ngày cho xe máy" : "Giá cho 1 giờ sử dụng"}
                                  </div>
                                  <div className="fw-bold text-dark small mt-1">Gói tháng: {monthlyPriceLabel}</div>
                                  <div className="text-primary small fw-bold mb-3" style={{ fontSize: '0.75rem' }}>Hủy MIỄN PHÍ</div>
                                  <button 
                                    type="button" 
                                    onClick={() => handleBooking(lot)}
                                    className="btn text-white w-100 fw-bold shadow-sm"
                                    style={{ backgroundColor: '#3b82f6', border: 'none' }}
                                  >
                                    Đặt Chỗ Ngay
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}