import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PARKING_LOTS } from '../data/parkingData';

export default function PricingPage() {
  const navigate = useNavigate();
  const [selectedLotId, setSelectedLotId] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearchQuery, setDropdownSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Find currently selected lot or default to the first one
  const currentLot = PARKING_LOTS.find(lot => lot.id === Number(selectedLotId)) || PARKING_LOTS[0];

  // Derived filtered lots for search inside dropdown menu
  const dropdownFilteredLots = PARKING_LOTS.filter(lot =>
    lot.name.toLowerCase().includes(dropdownSearchQuery.toLowerCase()) ||
    lot.area.toLowerCase().includes(dropdownSearchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setDropdownSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLot = (id) => {
    setSelectedLotId(id);
  };

  const handleBookNow = (tierType, vehicleType = 'Ô tô') => {
    // Navigate to booking page with selected lot and tier info
    navigate('/booking', {
      state: {
        lot: currentLot,
        selectedTier: tierType,
        selectedVehicle: vehicleType,
        entryTime: '2024-10-24T09:00',
        exitTime: '2024-10-24T17:00'
      }
    });
  };

  // Extract numeric price from string format (e.g. "30.000đ" -> 30000)
  const getBasePrice = (priceStr) => {
    const num = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 30000 : num;
  };

  const basePrice = getBasePrice(currentLot.price);
  const nextHourPrice = Math.floor(basePrice * 0.5);
  const overnightPrice = Math.floor(basePrice * 5);

  return (
    <div className="bg-light min-vh-100 pb-5" style={{ color: '#1e293b' }}>
      
      {/* Top Search & Selection Bar */}
      <div style={{ backgroundColor: '#164e63' }} className="py-4 text-white">
        <div className="container d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
          <div>
            <h4 className="fw-bold mb-1 m-0">🔍 Xem bảng giá bãi đỗ xe</h4>
            <p className="text-light opacity-75 small m-0">Đồng bộ dữ liệu thời gian thực từ hệ thống Vinparking</p>
          </div>
          
          <div ref={dropdownRef} className="position-relative align-self-start align-self-sm-center">
            <button
              type="button"
              className="btn btn-primary dropdown-toggle fw-bold px-4 py-2 d-flex align-items-center justify-content-between gap-2"
              style={{ backgroundColor: '#3b82f6', border: 'none', minWidth: '240px' }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span>{currentLot.name}</span>
            </button>
            {dropdownOpen && (
              <div 
                className="dropdown-menu show shadow-lg border-0 mt-2 p-2"
                style={{ 
                  position: 'absolute', 
                  right: 0, 
                  left: 'auto', 
                  minWidth: '280px', 
                  backgroundColor: '#ffffff',
                  zIndex: 1000,
                  borderRadius: '12px'
                }}
              >
                {/* Visual Arrow Callout */}
                <div 
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '24px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#ffffff',
                    transform: 'rotate(45deg)',
                    zIndex: 1
                  }}
                />

                {/* Search box inside dropdown popover */}
                <div className="px-2 py-1 mb-2 border-bottom pb-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    className="form-control form-control-sm text-dark bg-light border shadow-none"
                    placeholder="🔍 Tìm nhanh bãi đỗ..."
                    value={dropdownSearchQuery}
                    onChange={e => setDropdownSearchQuery(e.target.value)}
                  />
                </div>

                {/* Scrollable list */}
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {dropdownFilteredLots.length > 0 ? (
                    dropdownFilteredLots.map(lot => (
                      <button
                        key={lot.id}
                        type="button"
                        className="dropdown-item py-2 px-3 text-dark text-start border-0 bg-transparent w-100 rounded-2"
                        style={{ transition: 'background-color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => {
                          handleSelectLot(lot.id);
                          setDropdownOpen(false);
                          setDropdownSearchQuery('');
                        }}
                      >
                        <div className="fw-bold small text-dark">{lot.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>📍 {lot.area}</div>
                      </button>
                    ))
                  ) : (
                    <div className="text-muted small text-center py-3">Không tìm thấy bãi đỗ...</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Page Layout */}
      <div className="container mt-4">
        
        {/* Breadcrumbs */}
        <nav className="mb-4" style={{ fontSize: '0.85rem' }}>
          <span className="text-muted">Home &gt; Ho Chi Minh City &gt; {currentLot.area.split(',')[0]} &gt; </span>
          <span className="fw-bold text-dark">{currentLot.name}</span>
        </nav>

        {/* Dynamic Image Gallery Grid */}
        <div className="row g-2 mb-4">
          <div className="col-lg-6">
            <div className="rounded-3 overflow-hidden shadow-sm h-100" style={{ minHeight: '340px' }}>
              <img
                src={currentLot.image || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80"}
                alt={currentLot.name}
                className="w-100 h-100 object-fit-cover transition-all"
              />
            </div>
          </div>
          <div className="col-lg-6">
            <div className="row g-2 h-100">
              <div className="col-6">
                <div className="rounded-3 overflow-hidden shadow-sm" style={{ height: '166px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&q=80"
                    alt="Interior 1"
                    className="w-100 h-100 object-fit-cover"
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="rounded-3 overflow-hidden shadow-sm" style={{ height: '166px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400&q=80"
                    alt="Gate Entry"
                    className="w-100 h-100 object-fit-cover"
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="rounded-3 overflow-hidden shadow-sm" style={{ height: '166px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&q=80"
                    alt="Charging slot"
                    className="w-100 h-100 object-fit-cover"
                  />
                </div>
              </div>
              <div className="col-6 position-relative">
                <div className="rounded-3 overflow-hidden shadow-sm h-100" style={{ height: '166px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80"
                    alt="Camera security"
                    className="w-100 h-100 object-fit-cover brightness-50"
                  />
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <span className="fs-4 fw-bold">➕</span>
                    <span className="small fw-semibold mt-1">Xem thêm ảnh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chi tiết khu đặt vé Information Box */}
        <div className="card border-0 shadow-sm p-4 rounded-4 mb-4 bg-white">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-primary text-white fw-bold px-2 py-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  VINPARKING PLUS
                </span>
                <span className="text-warning">⭐⭐⭐⭐⭐</span>
              </div>
              <h2 className="fw-bold text-dark mb-1">{currentLot.name} - Bãi đỗ thông minh</h2>
              <p className="text-muted small d-flex align-items-center gap-1 mb-0">
                📍 {currentLot.address}
              </p>
            </div>
            
            <div className="bg-light border rounded-3 p-3 text-end d-flex align-items-center gap-3">
              <div>
                <span className="fw-bold text-dark d-block" style={{ fontSize: '1.1rem' }}>{currentLot.scoreLabel}</span>
                <small className="text-muted">{currentLot.reviews}</small>
              </div>
              <div className="bg-teal text-white fw-bold rounded px-3 py-2 fs-4 shadow-sm" style={{ backgroundColor: '#164e63' }}>
                {currentLot.score}
              </div>
            </div>
          </div>

          <hr className="my-3 text-muted opacity-25" />

          <p className="text-muted" style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
            Nằm tại vị trí chiến lược của khu vực {currentLot.area}, bãi đỗ xe thông minh {currentLot.name} được trang bị công nghệ nhận diện biển số tự động dựa trên AI, hệ thống camera giám sát liên tục 24/7 và hệ thống sạc điện EV thông minh. Đáp ứng hoàn hảo cho các dòng xe sedan thông thường, SUV cỡ lớn, đem đến trải nghiệm gửi xe an tâm và cao cấp hàng đầu Việt Nam.
          </p>

          {/* Popular Amenities */}
          <h5 className="fw-bold text-dark mt-4 mb-3">Tiện ích bãi đỗ xe nổi bật</h5>
          <div className="row g-3">
            {[
              { icon: '🔋', label: 'EV Charging', desc: 'Có sẵn trạm sạc điện' },
              { icon: '🛡️', label: '24/7 Security', desc: 'Camera & Bảo vệ tuần tra' },
              { icon: '🏠', label: 'Indoor Parking', desc: 'Mái che tầng hầm B2-B3' },
              { icon: '♿', label: 'Accessible', desc: 'Lối đi cho người khuyết tật' }
            ].map((amenity, i) => (
              <div className="col-6 col-md-3" key={i}>
                <div className="p-3 border rounded-3 text-center bg-light h-100 d-flex flex-column justify-content-center align-items-center">
                  <span className="fs-3 mb-1">{amenity.icon}</span>
                  <span className="fw-bold text-dark small">{amenity.label}</span>
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>{amenity.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parking Tiers Section */}
        <h4 className="fw-bold text-dark mb-3 mt-5">Các Gói Tùy Chọn Đỗ Xe (Parking Tiers)</h4>
        <div className="row g-4 mb-5">
          {/* STANDARD */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white">
              <div className="p-4 flex-grow-1">
                <small className="text-muted uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>STANDARD</small>
                <h2 className="fw-bold text-dark mt-2 mb-3">
                  {currentLot.price}<span className="fs-6 text-muted font-normal">/hour</span>
                </h2>
                <ul className="list-unstyled d-flex flex-column gap-2 small text-muted my-4">
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-success fw-bold">✓</span> Đỗ bất kì vị trí trống nào
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-success fw-bold">✓</span> Quét biển số ra vào tự động
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-success fw-bold">✓</span> Hỗ trợ thanh toán nhanh bằng ví
                  </li>
                </ul>
              </div>
              <div className="p-4 pt-0">
                <button
                  type="button"
                  onClick={() => handleBookNow('Standard')}
                  className="btn btn-outline-primary w-100 fw-bold py-2 rounded-3"
                  style={{ borderColor: '#164e63', color: '#164e63' }}
                >
                  Select Tier
                </button>
              </div>
            </div>
          </div>

          {/* FULL DAY */}
          <div className="col-lg-4">
            <div className="card shadow rounded-4 h-100 overflow-hidden bg-white position-relative" style={{ border: '2.5px solid #164e63' }}>
              <span 
                className="position-absolute top-0 end-0 bg-teal text-white fw-bold px-3 py-1 rounded-bl-3" 
                style={{ fontSize: '0.75rem', borderBottomLeftRadius: '12px', backgroundColor: '#164e63' }}
              >
                POPULAR
              </span>
              <div className="p-4 flex-grow-1">
                <small className="text-muted uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>FULL DAY</small>
                <h2 className="fw-bold text-dark mt-2 mb-3">
                  {Math.floor(basePrice * 8).toLocaleString('vi-VN')}đ<span className="fs-6 text-muted font-normal">/day</span>
                </h2>
                <ul className="list-unstyled d-flex flex-column gap-2 small text-muted my-4">
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-success fw-bold">✓</span> Không giới hạn số lượt ra vào bãi
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-success fw-bold">✓</span> Có khu vực đỗ xe ưu tiên riêng biệt
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-success fw-bold">✓</span> Dịch vụ Valet hỗ trợ đỗ hộ
                  </li>
                </ul>
              </div>
              <div className="p-4 pt-0">
                <button
                  type="button"
                  onClick={() => handleBookNow('Full Day')}
                  className="btn text-white w-100 fw-bold py-2 rounded-3"
                  style={{ backgroundColor: '#164e63' }}
                >
                  Select Tier
                </button>
              </div>
            </div>
          </div>

          {/* CORPORATE */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white">
              <div className="p-4 flex-grow-1">
                <small className="text-muted uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>CORPORATE</small>
                <h2 className="fw-bold text-dark mt-2 mb-3">
                  {currentLot.monthlyPrice || '2.500.000đ'}<span className="fs-6 text-muted font-normal">/month</span>
                </h2>
                <ul className="list-unstyled d-flex flex-column gap-2 small text-muted my-4">
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-success fw-bold">✓</span> Có ô đỗ gắn tên cố định 100%
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-success fw-bold">✓</span> Xuất hóa đơn đỏ (VAT) doanh nghiệp
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-success fw-bold">✓</span> Hỗ trợ rửa xe & sạc điện trọn gói
                  </li>
                </ul>
              </div>
              <div className="p-4 pt-0">
                <Link to="/contact" className="btn btn-outline-secondary w-100 fw-bold py-2 rounded-3">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Rates Section */}
        <h4 className="fw-bold text-dark mb-4 mt-5">🕒 Chi tiết Bảng giá dịch vụ (Rates Table)</h4>
        
        {/* Hourly Rates */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="fs-4">🚗</span>
                <h5 className="fw-bold text-dark m-0">Dành cho Ô tô</h5>
                <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 ms-auto">Ô tô</span>
              </div>
              <p className="text-muted small mb-4">Áp dụng cho xe từ 4 - 7 chỗ tại mọi điểm đỗ chính.</p>
              
              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
                  <span className="text-muted small">2 giờ đầu</span>
                  <span className="fw-bold text-dark">{currentLot.price}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
                  <span className="text-muted small">Mỗi giờ tiếp theo</span>
                  <span className="fw-bold text-dark">{nextHourPrice.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pb-2">
                  <span className="text-muted small">Gửi qua đêm (sau 0h)</span>
                  <span className="fw-bold text-dark">{overnightPrice.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={() => handleBookNow('Standard')}
                className="btn text-white fw-bold py-2.5 rounded-3 w-100 mt-auto"
                style={{ backgroundColor: '#164e63' }}
              >
                Đặt chỗ ngay
              </button>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="fs-4">🛵</span>
                <h5 className="fw-bold text-dark m-0">Dành cho Xe máy</h5>
                <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 ms-auto">Xe máy</span>
              </div>
              <p className="text-muted small mb-4">Áp dụng cho mọi loại xe máy và xe đạp điện.</p>
              
              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
                  <span className="text-muted small">Sáng (06h - 18h)</span>
                  <span className="fw-bold text-dark">5.000 VNĐ</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
                  <span className="text-muted small">Tối (18h - 06h)</span>
                  <span className="fw-bold text-dark">8.000 VNĐ</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pb-2">
                  <span className="text-muted small">Cả ngày (24h)</span>
                  <span className="fw-bold text-dark">12.000 VNĐ</span>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={() => handleBookNow('Standard', 'Xe máy')}
                className="btn text-white fw-bold py-2.5 rounded-3 w-100 mt-auto"
                style={{ backgroundColor: '#164e63' }}
              >
                Đặt chỗ ngay
              </button>
            </div>
          </div>
        </div>

        {/* Long term subscriptions */}
        <h5 className="fw-bold text-dark mt-5 mb-3">Gói Đăng Ký Dài Hạn (Subscriptions)</h5>
        <p className="text-muted small mb-4">Tiết kiệm hơn với các lựa chọn đăng ký theo tháng dành riêng cho cư dân hoặc doanh nghiệp.</p>
        
        <div className="row g-4 mb-5">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
              <h5 className="fw-bold text-dark mb-1">Gói Tháng Tiết Kiệm</h5>
              <h3 className="fw-bold text-teal my-3" style={{ color: '#164e63' }}>
                1.200.000đ<span className="fs-6 text-muted fw-normal">/tháng</span>
              </h3>
              <ul className="list-unstyled d-flex flex-column gap-2 small text-muted mb-4">
                <li>🟢 Đỗ xe không giới hạn lượt ra vào</li>
                <li>🟢 Áp dụng cho mọi vị trí đỗ phổ thông</li>
                <li>🟢 Thanh toán tự động qua App</li>
              </ul>
              <button 
                type="button"
                onClick={() => handleBookNow('Savings Monthly')}
                className="btn text-white fw-bold py-2 rounded-3 w-100 mt-auto"
                style={{ backgroundColor: '#164e63' }}
              >
                Đăng Ký Ngay
              </button>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border shadow-sm p-4 rounded-4 bg-white h-100 position-relative" style={{ border: '2px solid #164e63' }}>
              <span className="position-absolute top-0 end-0 bg-teal text-white fw-bold px-3 py-1 rounded-bl-3" style={{ fontSize: '0.75rem', borderBottomLeftRadius: '12px', backgroundColor: '#164e63' }}>
                PHỔ BIẾN NHẤT
              </span>
              <h5 className="fw-bold text-dark mb-1">Gói VIP Cư Dân</h5>
              <h3 className="fw-bold text-teal my-3" style={{ color: '#164e63' }}>
                2.500.000đ<span className="fs-6 text-muted fw-normal">/tháng</span>
              </h3>
              <ul className="list-unstyled d-flex flex-column gap-2 small text-muted mb-4">
                <li>🟢 Vị trí đỗ ưu tiên gần thang máy</li>
                <li>🟢 Hỗ trợ rửa xe 2 lần/tháng</li>
                <li>🟢 Miễn phí sạc EV (áp dụng cho 50kWh đầu)</li>
              </ul>
              <button 
                type="button"
                onClick={() => handleBookNow('VIP Monthly')}
                className="btn text-white fw-bold py-2 rounded-3 w-100 mt-auto"
                style={{ backgroundColor: '#164e63' }}
              >
                Đăng Ký Gói VIP
              </button>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <h4 className="fw-bold text-dark mb-3 mt-5">Đánh giá từ khách hàng</h4>
        <div className="card border-0 shadow-sm p-4 rounded-4 mb-4 bg-white">
          <div className="row g-4 align-items-center">
            <div className="col-md-4 text-center border-end">
              <h1 className="fw-bold text-dark m-0" style={{ fontSize: '4rem' }}>{currentLot.score}</h1>
              <h5 className="fw-bold text-dark mt-2 mb-1">{currentLot.scoreLabel}</h5>
              <p className="text-muted small m-0">Dựa trên {currentLot.reviews}</p>
            </div>
            <div className="col-md-8 px-md-4">
              <div className="mb-3">
                <div className="d-flex justify-content-between small fw-semibold text-dark mb-1">
                  <span>Sạch sẽ, thông thoáng</span>
                  <span>9.5 / 10</span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div className="progress-bar" style={{ width: '95%', backgroundColor: '#164e63' }} />
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between small fw-semibold text-dark mb-1">
                  <span>Vị trí thuận tiện</span>
                  <span>9.8 / 10</span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div className="progress-bar" style={{ width: '98%', backgroundColor: '#164e63' }} />
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between small fw-semibold text-dark mb-1">
                  <span>Dịch vụ hỗ trợ</span>
                  <span>8.8 / 10</span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div className="progress-bar" style={{ width: '88%', backgroundColor: '#164e63' }} />
                </div>
              </div>
            </div>
          </div>

          <hr className="my-4 text-muted opacity-25" />

          {/* Testimonial comments */}
          <div className="d-flex flex-column gap-3">
            <div className="border rounded-3 p-3 bg-light">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-secondary text-white rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>MN</div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0 small">Minh Nguyen</h6>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>👤 Verified Parker</small>
                  </div>
                </div>
                <span className="badge bg-teal text-white fw-bold" style={{ backgroundColor: '#164e63' }}>9.5</span>
              </div>
              <p className="text-muted small m-0" style={{ italic: 'true' }}>
                "Bãi đỗ sạch sẽ, ánh sáng cực tốt và làn đỗ rất rộng rãi. Rất thích hợp cho chiếc BMW X5 của tôi. Trạm sạc điện EV hoạt động tốt và rất dễ kết nối."
              </p>
              <div className="text-end mt-2">
                <small className="text-muted cursor-pointer" style={{ fontSize: '0.7rem' }}>👍 Hữu ích (12)</small>
              </div>
            </div>

            <div className="border rounded-3 p-3 bg-light">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-secondary text-white rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>HT</div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0 small">Hanh Tran</h6>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>👤 Verified Parker</small>
                  </div>
                </div>
                <span className="badge bg-teal text-white fw-bold" style={{ backgroundColor: '#164e63' }}>8.8</span>
              </div>
              <p className="text-muted small m-0">
                "Hệ thống sạc xe điện dễ tìm thấy và hoạt động trơn tru. Có chút hơi đắt đỏ so với các bãi đỗ ngoài trời thông thường nhưng cực kì xứng đáng với chất lượng dịch vụ của tòa nhà."
              </p>
              <div className="text-end mt-2">
                <small className="text-muted cursor-pointer" style={{ fontSize: '0.7rem' }}>👍 Hữu ích (5)</small>
              </div>
            </div>
          </div>

          <div className="text-center mt-3">
            <button className="btn btn-link text-decoration-none fw-bold" style={{ color: '#164e63' }}>
              Read all 1,248 reviews
            </button>
          </div>
        </div>

        {/* Good to Know Section */}
        <h4 className="fw-bold text-dark mb-3 mt-5">Thông tin cần lưu ý (Good to Know)</h4>
        <div className="row g-3">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
              <span className="fs-3 mb-2">📅</span>
              <h6 className="fw-bold text-dark">Cancellation Policy</h6>
              <p className="text-muted small mb-0">Hủy đặt chỗ miễn phí trước thời gian nhận xe tối thiểu 1 tiếng. Số tiền hoàn lại sẽ được cộng thẳng vào tài khoản ví Vinparking trong vòng 24 giờ.</p>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
              <span className="fs-3 mb-2">📲</span>
              <h6 className="fw-bold text-dark">Check-in Instructions</h6>
              <p className="text-muted small mb-0">Đơn giản chỉ cần lái xe đến cổng rào chắn. Camera nhận diện AI sẽ quét biển số xe đã đăng ký và tự động mở barie. Không cần in vé giấy.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
              <span className="fs-3 mb-2">ℹ️</span>
              <h6 className="fw-bold text-dark">Important Notes</h6>
              <p className="text-muted small mb-0">Chiều cao xe tối đa giới hạn là 2.1m. Nghiêm cấm các loại phương tiện chở khí gas hóa lỏng LPG đi vào hầm. Hệ thống an ninh tuần tra liên tục bảo đảm an toàn.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
