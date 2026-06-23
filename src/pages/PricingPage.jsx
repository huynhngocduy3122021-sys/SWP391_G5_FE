import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PARKING_LOTS } from '../data/parkingData';

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLotId, setSelectedLotId] = useState(() => {
    if (location.state?.selectedLotId) {
      return Number(location.state.selectedLotId);
    }
    return 1;
  });

  useEffect(() => {
    if (location.state?.selectedLotId) {
      setSelectedLotId(Number(location.state.selectedLotId));
    }
  }, [location.state]);

  const [activeSubPlan, setActiveSubPlan] = useState(null);
  const [selectedSubVehicleId, setSelectedSubVehicleId] = useState(1); // Default to VinFast VF8 (Car)

  const mockVehicles = [
    { id: 1, type: 'Car', name: 'VinFast VF8', plate: '51H-987.65' },
    { id: 2, type: 'Car', name: 'Toyota Camry', plate: '30A-555.55' },
    { id: 3, type: 'Motorcycle', name: 'Honda SH 150i', plate: '29A-123.45' },
    { id: 4, type: 'Motorcycle', name: 'Yamaha Exciter', plate: '59F-999.99' },
  ];

  // Find currently selected lot or default to the first one
  const currentLot = PARKING_LOTS.find(lot => lot.id === Number(selectedLotId)) || PARKING_LOTS[0];

  const getSubPrices = (lot) => {
    const vipCarPrice = parseInt(lot.monthlyPrice.replace(/[^0-9]/g, ''), 10) || 2500000;
    const ecoCarPrice = Math.max(1000000, vipCarPrice - 1000000);
    const ecoMotorPrice = Math.max(150000, Math.round((ecoCarPrice / 6) / 10000) * 10000); // rounded to nearest 10k (e.g. 250.000)
    const vipMotorPrice = ecoMotorPrice * 2; // e.g. 500.000
    return {
      ecoCar: ecoCarPrice,
      ecoMotor: ecoMotorPrice,
      vipCar: vipCarPrice,
      vipMotor: vipMotorPrice
    };
  };

  const prices = getSubPrices(currentLot);
  const selectedVehicle = mockVehicles.find(v => v.id === selectedSubVehicleId) || mockVehicles[0];
  const activePlanPrice = activeSubPlan ? (
    activeSubPlan.baseType === 'Economic' 
      ? (selectedVehicle.type === 'Car' ? prices.ecoCar : prices.ecoMotor)
      : (selectedVehicle.type === 'Car' ? prices.vipCar : prices.vipMotor)
  ) : 0;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearchQuery, setDropdownSearchQuery] = useState('');
  const dropdownRef = useRef(null);

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
        <p className="text-muted small mb-4">Tiết kiệm hơn với các lựa chọn đăng ký theo tháng dành riêng cho phương tiện của bạn.</p>
        
        <div className="row g-4 mb-5">
          {/* Card 1: Gói Tháng Tiết Kiệm */}
          <div className="col-md-6">
            <div className="card border shadow-sm p-4 rounded-4 bg-white h-100 d-flex flex-column justify-content-between position-relative" style={{ transition: 'all 0.3s' }}>
              <div>
                <h5 className="fw-bold text-dark mb-1">Gói Tháng Tiết Kiệm</h5>
                <p className="text-muted small">Tiết kiệm chi phí gửi xe định kỳ hàng tháng.</p>
                
                <div className="bg-light rounded-3 p-3 mb-4 d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted fw-semibold small">🛵 Xe máy:</span>
                    <strong className="fs-5" style={{ color: '#164e63' }}>
                      {prices.ecoMotor.toLocaleString('vi-VN')}đ<span className="fs-6 text-muted fw-normal">/tháng</span>
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted fw-semibold small">🚗 Ô tô:</span>
                    <strong className="fs-5" style={{ color: '#164e63' }}>
                      {prices.ecoCar.toLocaleString('vi-VN')}đ<span className="fs-6 text-muted fw-normal">/tháng</span>
                    </strong>
                  </div>
                </div>

                <ul className="list-unstyled d-flex flex-column gap-2 small text-muted mb-4">
                  <li>🟢 Đỗ xe không giới hạn lượt ra vào</li>
                  <li>🟢 Áp dụng cho mọi vị trí đỗ phổ thông</li>
                  <li>🟢 Thanh toán tự động qua App</li>
                </ul>
              </div>
              
              <button 
                type="button"
                onClick={() => {
                  setSelectedSubVehicleId(1); // Pre-select Car VinFast VF8
                  setActiveSubPlan({ name: 'Economic Monthly', baseType: 'Economic' });
                }}
                className="btn text-white fw-bold py-2.5 rounded-3 w-100 mt-auto animate-pulse"
                style={{ backgroundColor: '#164e63' }}
              >
                Đăng Ký Ngay
              </button>
            </div>
          </div>

          {/* Card 2: Gói VIP Cư Dân */}
          <div className="col-md-6">
            <div className="card border shadow-sm p-4 rounded-4 bg-white h-100 d-flex flex-column justify-content-between position-relative" style={{ borderColor: '#164e63', borderWidth: '2px', transition: 'all 0.3s' }}>
              
              {/* Popular badge */}
              <div 
                className="position-absolute px-3 py-1 text-white fw-bold text-uppercase"
                style={{
                  top: 0,
                  right: '24px',
                  backgroundColor: '#164e63',
                  borderBottomLeftRadius: '8px',
                  borderBottomRightRadius: '8px',
                  fontSize: '0.68rem',
                  letterSpacing: '1px',
                  zIndex: 2
                }}
              >
                PHỔ BIẾN NHẤT
              </div>

              <div>
                <h5 className="fw-bold text-dark mb-1">Gói VIP Cư Dân</h5>
                <p className="text-muted small">Đặc quyền đỗ xe cao cấp và dịch vụ chăm sóc trọn gói.</p>
                
                <div className="bg-light rounded-3 p-3 mb-4 d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted fw-semibold small">🛵 Xe máy:</span>
                    <strong className="fs-5" style={{ color: '#164e63' }}>
                      {prices.vipMotor.toLocaleString('vi-VN')}đ<span className="fs-6 text-muted fw-normal">/tháng</span>
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted fw-semibold small">🚗 Ô tô:</span>
                    <strong className="fs-5" style={{ color: '#164e63' }}>
                      {prices.vipCar.toLocaleString('vi-VN')}đ<span className="fs-6 text-muted fw-normal">/tháng</span>
                    </strong>
                  </div>
                </div>

                <ul className="list-unstyled d-flex flex-column gap-2 small text-muted mb-4">
                  <li>🟢 Vị trí đỗ ưu tiên gần thang máy</li>
                  <li>🟢 Hỗ trợ rửa xe 2 lần/tháng</li>
                  <li>🟢 Miễn phí sạc EV (áp dụng cho 50kWh đầu)</li>
                  <li>🟢 Ưu tiên hỗ trợ từ Vinparking</li>
                </ul>
              </div>
              
              <button 
                type="button"
                onClick={() => {
                  setSelectedSubVehicleId(1); // Pre-select Car VinFast VF8
                  setActiveSubPlan({ name: 'VIP Monthly', baseType: 'VIP' });
                }}
                className="btn text-white fw-bold py-2.5 rounded-3 w-100 mt-auto"
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

        {/* Subscription Confirmation Modal Overlay matching Image 1 exactly */}
        {activeSubPlan && (
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
            style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 2000 }}
          >
            <div 
              className="bg-white rounded-4 shadow-lg p-4 p-md-5 overflow-auto w-100 m-3" 
              style={{ maxWidth: '1000px', maxHeight: '90vh', border: '1px solid #e2e8f0', color: '#1e293b' }}
            >
              {/* Header row matching figma */}
              <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: '1.5rem' }} className="text-teal">⚡</span>
                  <strong className="text-dark fs-5">Vinparking</strong>
                </div>
                <div className="text-muted d-flex gap-3 small">
                  <span style={{ cursor: 'pointer' }} className="fw-semibold">❓ Trợ giúp</span>
                  <span style={{ cursor: 'pointer' }} className="fw-semibold">👤 Tài khoản</span>
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <h4 className="fw-bold text-dark mb-1">Chi tiết đăng ký</h4>
                <p className="text-muted small">Hoàn tất các thông tin bên dưới để kích hoạt gói dịch vụ của bạn.</p>
              </div>

              <div className="row g-4">
                {/* Left Column */}
                <div className="col-lg-8">
                  
                  {/* PLAN SELECTED */}
                  <div className="border rounded-3 p-4 mb-4 bg-white position-relative">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 mb-2 px-2.5 py-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                          PLAN SELECTED
                        </span>
                        <h5 className="fw-bold text-dark mb-3">{activeSubPlan.name}</h5>
                        <div className="d-flex flex-column flex-sm-row gap-3 text-muted small mt-2">
                          <span>✓ Unlimited 24/7 parking</span>
                          <span>✓ Plate recognition (LPR)</span>
                          <span>✓ Automatic payment</span>
                        </div>
                      </div>
                      <div className="text-end">
                        <h4 className="fw-bold text-dark m-0">{activePlanPrice.toLocaleString('vi-VN')} VNĐ</h4>
                        <small className="text-muted">/tháng</small>
                      </div>
                    </div>
                  </div>

                  {/* CẤU HÌNH GÓI ĐĂNG KÝ */}
                  <div className="border rounded-3 p-4 mb-4 bg-white">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                      ⚙ Cấu hình gói đăng ký
                    </h6>
                    
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-muted small fw-bold">ĐỊA ĐIỂM ĐĂNG KÝ</label>
                        <select className="form-select text-dark fw-semibold" defaultValue="Vinhomes Central Park">
                          <option value="Vinhomes Central Park">Vinhomes Central Park</option>
                          <option value="Vincom Center Đồng Khởi">Vincom Center Đồng Khởi</option>
                          <option value="Grand Park Smart Garage">Grand Park Smart Garage</option>
                          <option value="Metropolis Underground">Metropolis Underground</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-muted small fw-bold">NGÀY BẮT ĐẦU</label>
                        <input type="date" className="form-control text-dark fw-semibold" defaultValue="2024-05-20" />
                      </div>

                      <div className="col-12">
                        <label className="form-label text-muted small fw-bold">CHU KỲ THANH TOÁN</label>
                        <input type="text" className="form-control bg-light text-muted fw-semibold" value="Monthly (Hàng tháng)" readOnly />
                      </div>
                    </div>
                  </div>

                  {/* CHỌN PHƯƠNG TIỆN */}
                  <div className="border rounded-3 p-4 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-dark m-0" style={{ fontSize: '0.9rem' }}>
                        🚗 Chọn phương tiện
                      </h6>
                      <button type="button" className="btn btn-link text-decoration-none p-0 fw-bold small text-teal animate-pulse" style={{ color: '#164e63' }}>
                        + THÊM MỚI
                      </button>
                    </div>

                    <div className="row g-3">
                      {[
                        { id: 1, type: 'Car', name: 'VinFast VF8', plate: '51H-987.65' },
                        { id: 3, type: 'Motorcycle', name: 'Honda SH 150i', plate: '29A-123.45' },
                      ].map(v => {
                        const isSelected = selectedSubVehicleId === v.id;
                        return (
                          <div className="col-md-6" key={v.id}>
                            <div 
                              className="border rounded-3 p-3 d-flex justify-content-between align-items-center cursor-pointer transition-all"
                              style={{ 
                                borderColor: isSelected ? '#164e63' : '#e2e8f0', 
                                backgroundColor: isSelected ? '#f0fdfa' : 'transparent',
                                cursor: 'pointer'
                              }}
                              onClick={() => setSelectedSubVehicleId(v.id)}
                            >
                              <div className="d-flex align-items-center gap-2">
                                <span className="fs-3">{v.type === 'Car' ? '🚗' : '🏍️'}</span>
                                <div>
                                  <h6 className="fw-bold text-dark mb-0 small">{v.name}</h6>
                                  <small className="text-muted">{v.plate}</small>
                                </div>
                              </div>
                              <input 
                                type="radio" 
                                className="form-check-input text-teal"
                                checked={isSelected}
                                onChange={() => setSelectedSubVehicleId(v.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Right Column */}
                <div className="col-lg-4">
                  
                  {/* TÓM TẮT THANH TOÁN */}
                  <div className="border rounded-3 p-4 bg-white h-100 d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="fw-bold text-dark mb-3">Tóm tắt thanh toán</h6>
                      
                      <div className="d-flex justify-content-between align-items-center mb-2 small text-muted">
                        <span>Tạm tính ({activeSubPlan.name})</span>
                        <span className="fw-semibold text-dark">{activePlanPrice.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3 small text-muted">
                        <span>VAT (10%)</span>
                        <span className="fw-semibold text-dark">{Math.floor(activePlanPrice * 0.1).toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                      
                      <hr className="my-3 text-muted opacity-25" />

                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <strong className="text-dark">Tổng cộng</strong>
                        <strong className="fs-5 text-dark" style={{ color: '#164e63' }}>
                          {Math.floor(activePlanPrice * 1.1).toLocaleString('vi-VN')} VNĐ
                        </strong>
                      </div>

                      <button 
                        type="button" 
                        onClick={() => {
                          toast.success('Đăng ký gói thành viên dài hạn thành công!');
                          setActiveSubPlan(null);
                        }}
                        className="btn text-white w-100 fw-bold py-2.5 rounded-3 mb-3 d-flex align-items-center justify-content-center gap-1 shadow-sm"
                        style={{ backgroundColor: '#164e63' }}
                      >
                        Xác nhận đăng ký ➔
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setActiveSubPlan(null)}
                        className="btn btn-outline-danger w-100 fw-bold py-2.5 rounded-3 border-0 bg-transparent text-danger mb-4"
                      >
                        Hủy bỏ
                      </button>
                    </div>

                    {/* Box Image / Terms */}
                    <div>
                      <p className="text-muted small mt-4 m-0" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>
                        Bằng cách xác nhận, bạn đồng ý với các Điều khoản & Chính sách của Vinparking Urban Solutions. Thuê bao sẽ tự động gia hạn vào mỗi tháng.
                      </p>
                      
                      <div className="rounded-3 overflow-hidden mt-3 shadow-sm" style={{ height: '90px' }}>
                        <img 
                          src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&q=80" 
                          alt="Vinparking Smart Network" 
                          className="w-100 h-100 object-fit-cover" 
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
