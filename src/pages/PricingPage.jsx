import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Dropdown } from 'react-bootstrap';
import { PARKING_LOTS, mapBranchToParkingLot } from '../data/parkingData';
import parkingApi from '../api/parkingApi';
import { CheckCircle2, ChevronLeft, MapPin, Car, Clock, ShieldCheck, Info } from 'lucide-react';

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lots, setLots] = useState(PARKING_LOTS);
  const [loading, setLoading] = useState(true);
  const [selectedLotId, setSelectedLotId] = useState(() => Number(location.state?.selectedLotId) || 1);

  useEffect(() => {
    if (location.state?.selectedLotId) setSelectedLotId(Number(location.state.selectedLotId));
  }, [location.state]);

  // GIỮ NGUYÊN 100% CODE GỌI API THEO YÊU CẦU LẰN RANH ĐỎ
  useEffect(() => {
    const fetchLots = async () => {
      try {
        const branchesData = await parkingApi.getAllBranches();
        const branches = Array.isArray(branchesData) ? branchesData : (branchesData?.content || branchesData?.data || []);
        if (branches.length > 0) {
          const mapped = branches.map(mapBranchToParkingLot);
          setLots(mapped);
          if (!mapped.some(lot => lot.id === Number(selectedLotId))) setSelectedLotId(mapped[0].id);
        }
      } catch (error) {
        console.error('Error fetching branches in PricingPage:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, []);

  const [activeSubPlan, setActiveSubPlan] = useState(null);
  const [subModalStep, setSubModalStep] = useState(1);
  const [selectedSubVehicleId, setSelectedSubVehicleId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [discount, setDiscount] = useState(0);
  const [userVehicles, setUserVehicles] = useState([]);
  const [newVehicleData, setNewVehicleData] = useState({ licensePlate: '', vehicleBrand: '', vehicleColor: '', type: 'Car' });
  const userId = localStorage.getItem('userId');

  const [pricePolicies, setPricePolicies] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(true);

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const [polData, vtData] = await Promise.all([
          parkingApi.getAllPricePolicies(),
          parkingApi.getAllVehicleTypes()
        ]);
        setPricePolicies(Array.isArray(polData) ? polData : []);
        setVehicleTypes(Array.isArray(vtData) ? vtData : []);
      } catch (err) {
        console.error("Failed to load pricing data:", err);
      } finally {
        setLoadingPricing(false);
      }
    };
    fetchPricingData();
  }, []);

  useEffect(() => {
    if (userId) {
      parkingApi.getAllVehicles().then(data => {
        const list = Array.isArray(data) ? data : (data?.content || data?.data || []);
        const uVehicles = list.filter(v => String(v.userId) === String(userId) && !v.deleted);
        setUserVehicles(uVehicles);
        if (uVehicles.length > 0) {
          setSelectedSubVehicleId(uVehicles[0].vehicleId || uVehicles[0].id);
        } else {
          setSelectedSubVehicleId('new');
        }
      }).catch(e => console.error("Error fetching user vehicles:", e));
    } else {
      setSelectedSubVehicleId('new');
    }
  }, [userId]);

  const currentLot = lots.find(lot => lot.id === Number(selectedLotId)) || lots[0];

  const isPackage = (p) => {
    const name = p.policyName || '';
    return name.startsWith('[Gói Tháng]') || name.startsWith('[Gói VIP President]');
  };

  const getPackageDetails = (p) => {
    const name = p.policyName || '';
    const isVip = name.startsWith('[Gói VIP President]');
    const prefix = isVip ? '[Gói VIP President] ' : '[Gói Tháng] ';
    const cleanName = name.replace(prefix, '').trim();
    const days = Math.round((p.baseDurationMinutes || 0) / (24 * 60));
    return {
      policyId: p.pricePolicyId || p.id,
      title: cleanName,
      type: isVip ? 'VIP' : 'Economic',
      price: p.basePrice || 0,
      days: days,
      desc: isVip ? 'Đặc quyền đỗ xe cao cấp và dịch vụ chăm sóc trọn gói.' : 'Tiết kiệm chi phí gửi xe định kỳ hàng tháng.',
      vehicleTypeName: p.vehicleType?.typeName || 'Mọi xe',
      vehicleTypeId: p.vehicleType?.vehicleTypeId || p.vehicleTypeId,
      perks: isVip 
        ? ['Vị trí đỗ ưu tiên gần thang máy', 'Hỗ trợ rửa xe 2 lần/tháng', 'Miễn phí sạc EV (áp dụng cho 50kWh đầu)', 'Ưu tiên hỗ trợ từ Vinparking']
        : ['Đỗ xe không giới hạn lượt ra vào', 'Áp dụng cho mọi vị trí đỗ phổ thông', 'Thanh toán tự động qua App']
    };
  };

  const activeHourlyPolicies = pricePolicies.filter(p => p.active && !isPackage(p));
  const activePackages = pricePolicies.filter(p => p.active && isPackage(p)).map(getPackageDetails);

  const prices = (() => {
    const vipCarPrice = parseInt(currentLot.monthlyPrice.replace(/[^0-9]/g, ''), 10) || 2500000;
    const ecoCarPrice = Math.max(1000000, vipCarPrice - 1000000);
    const ecoMotorPrice = Math.max(150000, Math.round((ecoCarPrice / 6) / 10000) * 10000);
    return { ecoCar: ecoCarPrice, ecoMotor: ecoMotorPrice, vipCar: vipCarPrice, vipMotor: ecoMotorPrice * 2 };
  })();

  let currentSelectedVehicle = null;
  if (selectedSubVehicleId === 'new') {
    currentSelectedVehicle = { type: newVehicleData.type, plate: newVehicleData.licensePlate || 'Xe mới' };
  } else {
    const v = userVehicles.find(v => String(v.vehicleId || v.id) === String(selectedSubVehicleId));
    if (v) {
      const isMotor = v.vehicleTypeName?.toLowerCase().includes('máy') || v.vehicleTypeName?.toLowerCase().includes('moto');
      currentSelectedVehicle = { type: isMotor ? 'Motorcycle' : 'Car', plate: v.licensePlate };
    }
  }
  if (!currentSelectedVehicle) currentSelectedVehicle = { type: 'Car', plate: '' };

  const activePlanPrice = activeSubPlan ? (
    activeSubPlan.price 
      ? activeSubPlan.price 
      : (activeSubPlan.type === 'Economic' 
          ? (currentSelectedVehicle.type === 'Car' ? prices.ecoCar : prices.ecoMotor)
          : (currentSelectedVehicle.type === 'Car' ? prices.vipCar : prices.vipMotor))
  ) : 0;

  const [dropdownSearchQuery, setDropdownSearchQuery] = useState('');
  const dropdownFilteredLots = lots.filter(lot =>
    lot.name.toLowerCase().includes(dropdownSearchQuery.toLowerCase()) || lot.area.toLowerCase().includes(dropdownSearchQuery.toLowerCase())
  );

  const handleBookNow = (tierType, vehicleType = 'Ô tô') => {
    navigate('/booking', {
      state: { lot: currentLot, selectedTier: tierType, selectedVehicle: vehicleType, entryTime: '2024-10-24T09:00', exitTime: '2024-10-24T17:00' }
    });
  };

  const getBasePrice = (priceStr) => {
    const num = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 30000 : num;
  };

  const basePrice = getBasePrice(currentLot.price);
  
  if (loading) return <div className="p-5 text-center text-muted">Đang tải dữ liệu bãi đỗ...</div>;

  return (
    <div className="bg-light min-vh-100 pb-5 text-dark">
      {/* Top Search Bar */}
      <div className="py-4 text-white" style={{ backgroundColor: '#164e63' }}>
        <div className="container d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
          <div>
            <h4 className="fw-bold mb-1">🔍 Xem bảng giá bãi đỗ xe</h4>
            <p className="text-light opacity-75 small m-0">Đồng bộ dữ liệu thời gian thực từ hệ thống Vinparking</p>
          </div>
          
          <Dropdown onSelect={(k) => setSelectedLotId(Number(k))}>
            <Dropdown.Toggle as="button" className="btn fw-bold px-4 py-2 text-white border-0" style={{ backgroundColor: '#3b82f6', minWidth: '240px' }}>
              {currentLot.name}
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-lg border-0 mt-2 p-2" style={{ minWidth: '280px', borderRadius: '12px' }}>
              <div className="px-2 mb-2 border-bottom pb-2" onClick={e => e.stopPropagation()}>
                <input type="text" className="form-control form-control-sm bg-light shadow-none" placeholder="🔍 Tìm nhanh bãi đỗ..." value={dropdownSearchQuery} onChange={e => setDropdownSearchQuery(e.target.value)} />
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {dropdownFilteredLots.length > 0 ? dropdownFilteredLots.map(lot => (
                  <Dropdown.Item key={lot.id} eventKey={lot.id} onClick={() => setDropdownSearchQuery('')} className="py-2 px-3 rounded-2">
                    <div className="fw-bold small">{lot.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>📍 {lot.area}</div>
                  </Dropdown.Item>
                )) : <div className="text-muted small text-center py-3">Không tìm thấy bãi đỗ...</div>}
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <div className="container mt-4">
        <nav className="mb-4 small">
          <span className="text-muted">Home &gt; Ho Chi Minh City &gt; {currentLot.area.split(',')[0]} &gt; </span>
          <span className="fw-bold">{currentLot.name}</span>
        </nav>

        {/* Dynamic Image Gallery Grid */}
        <div className="row g-2 mb-4">
          <div className="col-lg-6">
            <img src={currentLot.image || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800"} alt="Lot" className="w-100 h-100 object-fit-cover rounded-3 shadow-sm" style={{ minHeight: '340px' }} />
          </div>
          <div className="col-lg-6">
            <div className="row g-2 h-100">
              {["1506521781263-d8422e82f27a", "1573348722427-f1d6819fdf98", "1524413840807-0c3cb6fa808d", "1621905251189-08b45d6a269e"].map((id, i) => (
                <div className="col-6 position-relative" key={i}>
                  <img src={`https://images.unsplash.com/photo-${id}?w=400`} alt={`img-${i}`} className={`w-100 h-100 object-fit-cover rounded-3 shadow-sm ${i === 3 ? 'brightness-50' : ''}`} style={{ height: '166px' }} />
                  {i === 3 && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white" style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <span className="fs-4 fw-bold">➕</span><span className="small mt-1">Xem thêm ảnh</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lot Information */}
        <div className="card border-0 shadow-sm p-4 rounded-4 mb-4 bg-white">
          <span className="badge bg-primary text-white fw-bold px-2 py-1 mb-2 d-table" style={{ fontSize: '0.75rem' }}>VINPARKING PLUS</span>
          <h2 className="fw-bold mb-1">{currentLot.name} - Bãi đỗ thông minh</h2>
          <p className="text-muted small">📍 {currentLot.address}</p>
          <hr className="my-3 text-muted opacity-25" />
          <p className="text-muted" style={{ lineHeight: '1.6' }}>Nằm tại vị trí chiến lược của khu vực {currentLot.area}, bãi đỗ xe thông minh {currentLot.name} được trang bị công nghệ nhận diện biển số tự động dựa trên AI, hệ thống camera giám sát liên tục 24/7 và hệ thống sạc điện EV thông minh. Đáp ứng hoàn hảo cho các dòng xe sedan thông thường, SUV cỡ lớn, đem đến trải nghiệm gửi xe an tâm và cao cấp hàng đầu Việt Nam.</p>
          
          <h5 className="fw-bold mt-4 mb-3">Tiện ích bãi đỗ xe nổi bật</h5>
          <div className="row g-3">
            {[
              { icon: '🔋', label: 'EV Charging', desc: 'Có sẵn trạm sạc điện' }, { icon: '🛡️', label: '24/7 Security', desc: 'Camera & Bảo vệ tuần tra' },
              { icon: '🏠', label: 'Indoor Parking', desc: 'Mái che tầng hầm B2-B3' }, { icon: '♿', label: 'Accessible', desc: 'Lối đi cho người khuyết tật' }
            ].map((a, i) => (
              <div className="col-6 col-md-3 text-center" key={i}>
                <div className="p-3 border rounded-3 bg-light h-100">
                  <span className="fs-3 mb-1 d-block">{a.icon}</span>
                  <strong className="small text-dark">{a.label}</strong><br/>
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>{a.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Rates Table */}
        <h4 className="fw-bold mt-5 mb-4">🕒 Chi tiết Bảng giá dịch vụ (Rates Table)</h4>
        <div className="row g-4 mb-4">
          {(() => {
            const hourlySections = vehicleTypes.map(vt => {
              const vtPolicies = activeHourlyPolicies.filter(p => 
                String(p.vehicleType?.vehicleTypeId || p.vehicleTypeId || p.vehicleType?.id) === String(vt.vehicleTypeId)
              );
              if (vtPolicies.length === 0) return null;
              
              const isMotor = vt.typeName?.toLowerCase().includes('máy') || vt.typeName?.toLowerCase().includes('moto') || vt.typeName?.toLowerCase().includes('đạp');
              
              return {
                type: vt.typeName || 'Loại xe',
                icon: isMotor ? '🛵' : '🚗',
                badge: isMotor ? 'bg-secondary text-secondary border-secondary' : 'bg-info text-info border-info',
                desc: isMotor ? 'Áp dụng cho mọi loại xe máy và xe đạp điện.' : 'Áp dụng cho xe ô tô tại mọi điểm đỗ chính.',
                rows: vtPolicies.map(p => {
                  const baseMin = p.baseDurationMinutes || 0;
                  const baseH = baseMin >= 60 ? `${Math.round(baseMin / 60)} giờ` : `${baseMin} phút`;
                  return [
                    p.policyName, 
                    `${(p.basePrice || 0).toLocaleString('vi-VN')} đ / ${baseH}`,
                    p.extraHourPrice > 0 
                      ? `Cộng thêm: ${(p.extraHourPrice || 0).toLocaleString('vi-VN')} đ / ${p.extraDurationMinutes || 60} phút`
                      : 'Không phụ trội'
                  ];
                }),
                canBook: !isMotor
              };
            }).filter(Boolean);

            const displayList = hourlySections.length > 0 ? hourlySections : [
              { type: 'Ô tô', icon: '🚗', badge: 'bg-info text-info border-info', desc: 'Áp dụng cho xe từ 4 - 7 chỗ tại mọi điểm đỗ chính.', rows: [['Vé lượt ô tô tiêu chuẩn', `${basePrice.toLocaleString('vi-VN')} VNĐ / 2 giờ`, `Mỗi giờ tiếp theo: ${Math.floor(basePrice * 0.5).toLocaleString('vi-VN')} VNĐ`], ['Gửi qua đêm (sau 0h)', `${Math.floor(basePrice * 5).toLocaleString('vi-VN')} VNĐ`, 'Giá cố định']], canBook: true },
              { type: 'Xe máy', icon: '🛵', badge: 'bg-secondary text-secondary border-secondary', desc: 'Áp dụng cho mọi loại xe máy và xe đạp điện.', rows: [['Sáng (06h - 18h)', '5.000 VNĐ', 'Giá cố định'], ['Tối (18h - 06h)', '8.000 VNĐ', 'Giá cố định'], ['Cả ngày (24h)', '12.000 VNĐ', 'Giá cố định']], canBook: false }
            ];

            return displayList.map((r, i) => (
              <div className="col-md-6" key={i}>
                <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100 d-flex flex-column">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="fs-4">{r.icon}</span><h5 className="fw-bold m-0">Dành cho {r.type}</h5>
                    <span className={`badge bg-opacity-10 border border-opacity-25 ms-auto ${r.badge}`}>{r.type}</span>
                  </div>
                  <p className="text-muted small mb-4">{r.desc}</p>
                  <div className="d-flex flex-column gap-3 mb-4 flex-grow-1">
                    {r.rows.map((row, idx) => (
                      <div className={`d-flex justify-content-between pb-2 ${idx < r.rows.length - 1 ? 'border-bottom' : ''}`} key={idx}>
                        <div>
                          <span className="text-muted small d-block fw-bold">{row[0]}</span>
                          <small className="text-muted">{row[2]}</small>
                        </div>
                        <strong className="text-dark align-self-center">{row[1]}</strong>
                      </div>
                    ))}
                  </div>
                  <button disabled={!r.canBook} onClick={() => r.canBook && handleBookNow('Standard')} className={`btn fw-bold py-2.5 rounded-3 w-100 ${r.canBook ? 'text-white' : 'btn-secondary'}`} style={{ backgroundColor: r.canBook ? '#164e63' : '', cursor: r.canBook ? 'pointer' : 'not-allowed' }}>
                    {r.canBook ? 'Đặt chỗ ngay' : 'Không hỗ trợ đặt trước xe máy'}
                  </button>
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Subscriptions */}
        <h5 className="fw-bold mt-5 mb-3">Gói Đăng Ký Dài Hạn (Subscriptions)</h5>
        <p className="text-muted small mb-4">Tiết kiệm hơn với các lựa chọn đăng ký theo tháng dành riêng cho phương tiện của bạn.</p>
        <div className="row g-4 mb-5">
          {(() => {
            const displayList = activePackages.length > 0 ? activePackages : [
              { policyId: 1, title: 'Gói Tháng Tiết Kiệm', name: 'Economic Monthly', type: 'Economic', price: prices.ecoCar, mP: prices.ecoMotor, desc: 'Tiết kiệm chi phí gửi xe định kỳ hàng tháng.', perks: ['Đỗ xe không giới hạn lượt ra vào', 'Áp dụng cho mọi vị trí đỗ phổ thông', 'Thanh toán tự động qua App'] },
              { policyId: 3, title: 'Gói VIP Cư Dân', name: 'VIP Monthly', type: 'VIP', price: prices.vipCar, mP: prices.vipMotor, desc: 'Đặc quyền đỗ xe cao cấp và dịch vụ chăm sóc trọn gói.', perks: ['Vị trí đỗ ưu tiên gần thang máy', 'Hỗ trợ rửa xe 2 lần/tháng', 'Miễn phí sạc EV (áp dụng cho 50kWh đầu)', 'Ưu tiên hỗ trợ từ Vinparking'] }
            ];

            return displayList.map((s, idx) => {
              const isVip = s.type === 'VIP';
              const priceLabel = s.price ? `${s.price.toLocaleString('vi-VN')} đ` : '';
              const durationLabel = s.days ? `/ ${s.days} ngày` : '/ tháng';

              return (
                <div className="col-md-6" key={s.policyId || idx}>
                  <div className="card shadow-sm p-4 rounded-4 bg-white h-100 d-flex flex-column position-relative" style={{ border: isVip ? '2px solid #164e63' : '1px solid #dee2e6' }}>
                    {isVip && <div className="position-absolute px-3 py-1 bg-primary text-white fw-bold text-uppercase" style={{ top: 0, right: 24, fontSize: '0.68rem', borderRadius: '0 0 8px 8px' }}>PHỔ BIẾN NHẤT</div>}
                    <h5 className="fw-bold mb-1">{s.title}</h5>
                    <p className="text-muted small mb-2">{s.desc}</p>
                    
                    <div className="bg-light rounded-3 p-3 mb-4">
                      {s.mP ? (
                        <>
                          <div className="d-flex justify-content-between mb-2"><span className="text-muted small">🛵 Xe máy:</span><strong className="fs-5" style={{color: '#164e63'}}>{s.mP.toLocaleString('vi-VN')} đ<span className="fs-6 text-muted fw-normal">/tháng</span></strong></div>
                          <div className="d-flex justify-content-between"><span className="text-muted small">🚗 Ô tô:</span><strong className="fs-5" style={{color: '#164e63'}}>{s.cP.toLocaleString('vi-VN')} đ<span className="fs-6 text-muted fw-normal">/tháng</span></strong></div>
                        </>
                      ) : (
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">🚙 Loại xe: {s.vehicleTypeName}</span>
                          <strong className="fs-5" style={{color: '#164e63'}}>{priceLabel}<span className="fs-6 text-muted fw-normal"> {durationLabel}</span></strong>
                        </div>
                      )}
                    </div>
                    
                    <ul className="list-unstyled d-flex flex-column gap-2 small text-muted mb-4 flex-grow-1">
                      {s.perks.map((p, i) => <li key={i}>🟢 {p}</li>)}
                    </ul>
                    
                    <button onClick={() => { 
                        if (!userId) {
                          toast.info("Vui lòng đăng nhập để đăng ký gói cước!");
                          navigate('/auth');
                          return;
                        }
                        navigate('/user-dashboard', { state: { tab: 'vehicles', autoSubscribePackage: s } });
                      }} 
                      className="btn text-white fw-bold py-2.5 rounded-3 w-100" style={{ backgroundColor: '#164e63' }}>
                      {isVip ? 'Đăng Ký Gói VIP' : 'Đăng Ký Ngay'}
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Good to Know Section */}
        <h4 className="fw-bold mt-5 mb-3">Thông tin cần lưu ý (Good to Know)</h4>
        <div className="row g-3">
          {[
            { icon: '📅', title: 'Cancellation Policy', desc: 'Hủy đặt chỗ miễn phí trước thời gian nhận xe tối thiểu 1 tiếng. Số tiền sẽ được hoàn trả lại cho quý khách trong vòng 24 giờ.' },
            { icon: '📲', title: 'Check-in Instructions', desc: 'Đơn giản chỉ cần lái xe đến cổng rào chắn. Camera nhận diện AI sẽ quét biển số xe đã đăng ký và tự động mở barie. Không cần in vé giấy.' },
            { icon: 'ℹ️', title: 'Important Notes', desc: 'Chiều cao xe tối đa giới hạn là 2.1m. Nghiêm cấm các loại phương tiện chở khí gas hóa lỏng LPG đi vào hầm. Hệ thống an ninh tuần tra liên tục bảo đảm an toàn.' }
          ].map((g, i) => (
            <div className="col-md-4" key={i}>
              <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
                <span className="fs-3 mb-2">{g.icon}</span><h6 className="fw-bold">{g.title}</h6><p className="text-muted small mb-0">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Subscription Confirmation Modal Overlay */}
        {activeSubPlan && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 2000 }} onClick={(e) => { if (e.target === e.currentTarget) { setActiveSubPlan(null); setSubModalStep(1); } }}>
            <div className="bg-white rounded-4 shadow-lg p-4 p-md-5 overflow-auto w-100 m-3" style={{ maxWidth: subModalStep === 2 ? 1000 : 750, maxHeight: '90vh' }}>
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  {subModalStep > 1 && subModalStep < 3 && <button onClick={() => setSubModalStep(s => s - 1)} className="btn btn-link text-dark p-0"><ChevronLeft size={24} /></button>}
                  <strong className="fs-5" style={{ color: '#164e63' }}>Vinparking</strong>
                </div>
              </div>

              {subModalStep === 1 && (
                <>
                  <div className="mb-4">
                    <h4 className="fw-bold mb-1">Chi tiết đăng ký</h4>
                    <p className="text-muted small">Hoàn tất các thông tin bên dưới để kích hoạt gói dịch vụ của bạn.</p>
                  </div>
                  
                  <div className="border rounded-3 p-4 mb-4 bg-white shadow-sm">
                    <span className="badge bg-info bg-opacity-10 text-info fw-bold mb-2 px-3 py-1 text-uppercase">PLAN SELECTED</span>
                    <div className="d-flex justify-content-between align-items-center">
                      <h4 className="fw-bold m-0">{activeSubPlan.name}</h4>
                      <div className="text-end">
                        <h4 className="fw-bold m-0">{activePlanPrice.toLocaleString('vi-VN')} VNĐ</h4>
                        <small className="text-muted">/tháng</small>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-4 text-muted small border-top pt-3 mt-3">
                      <span><CheckCircle2 size={14} className="text-secondary" /> Unlimited 24/7 parking</span>
                      <span><CheckCircle2 size={14} className="text-secondary" /> Plate recognition</span>
                      <span><CheckCircle2 size={14} className="text-secondary" /> Auto payment</span>
                    </div>
                  </div>

                  <div className="border rounded-3 p-4 mb-4 bg-white">
                    <h6 className="fw-bold mb-3">⚙ Cấu hình gói đăng ký</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-muted small fw-bold">ĐỊA ĐIỂM ĐĂNG KÝ</label>
                        <select className="form-select fw-semibold" defaultValue={currentLot.name}><option>{currentLot.name}</option></select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted small fw-bold">NGÀY BẮT ĐẦU</label>
                        <input type="date" className="form-control fw-semibold" defaultValue="2024-05-20" />
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-3 p-4 bg-white">
                    <h6 className="fw-bold mb-3">🚗 Chọn phương tiện</h6>
                    <div className="row g-3">
                      {userVehicles.length > 0 && userVehicles.map(v => (
                        <div className="col-md-6" key={v.vehicleId || v.id}>
                          <div 
                            className="border rounded-3 p-3 d-flex align-items-center justify-content-between cursor-pointer shadow-sm"
                            style={{ 
                              borderColor: String(selectedSubVehicleId) === String(v.vehicleId || v.id) ? '#164e63' : '#e2e8f0', 
                              borderWidth: '2px',
                              backgroundColor: String(selectedSubVehicleId) === String(v.vehicleId || v.id) ? '#f0f9ff' : '#fff'
                            }} 
                            onClick={() => setSelectedSubVehicleId(v.vehicleId || v.id)}
                          >
                            <div>
                              <strong className="d-block" style={{ color: String(selectedSubVehicleId) === String(v.vehicleId || v.id) ? '#1e3a8a' : '#334155' }}>
                                {v.vehicleBrand || 'Xe cá nhân'}
                              </strong>
                              <small className="text-muted">{v.licensePlate}</small>
                            </div>
                            <input type="radio" className="form-check-input mt-0" checked={String(selectedSubVehicleId) === String(v.vehicleId || v.id)} readOnly style={{ cursor: 'pointer' }} />
                          </div>
                        </div>
                      ))}
                      
                      <div className="col-md-6">
                        <div 
                          className="border rounded-3 p-3 d-flex align-items-center justify-content-between cursor-pointer shadow-sm"
                          style={{ 
                            borderColor: selectedSubVehicleId === 'new' ? '#164e63' : '#e2e8f0', 
                            borderWidth: '2px',
                            backgroundColor: selectedSubVehicleId === 'new' ? '#f0f9ff' : '#fff'
                          }} 
                          onClick={() => setSelectedSubVehicleId('new')}
                        >
                          <div>
                            <strong className="d-block" style={{ color: selectedSubVehicleId === 'new' ? '#1e3a8a' : '#334155' }}>+ Thêm xe mới</strong>
                            <small className="text-muted">Nhập thông tin biển số</small>
                          </div>
                          <input type="radio" className="form-check-input mt-0" checked={selectedSubVehicleId === 'new'} readOnly style={{ cursor: 'pointer' }} />
                        </div>
                      </div>
                    </div>
                    
                    {selectedSubVehicleId === 'new' && (
                      <div className="mt-3 p-3 bg-light rounded-3 border">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-dark mb-1">Loại xe</label>
                            <select className="form-select" value={newVehicleData.type} onChange={e => setNewVehicleData({...newVehicleData, type: e.target.value})}>
                              <option value="Car">Ô tô</option>
                              <option value="Motorcycle">Xe máy</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-dark mb-1">Biển số xe *</label>
                            <input type="text" className="form-control" value={newVehicleData.licensePlate} onChange={e => setNewVehicleData({...newVehicleData, licensePlate: e.target.value})} placeholder="VD: 30A-123.45" />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-dark mb-1">Hãng xe</label>
                            <input type="text" className="form-control" value={newVehicleData.vehicleBrand} onChange={e => setNewVehicleData({...newVehicleData, vehicleBrand: e.target.value})} placeholder="VD: VinFast" />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-dark mb-1">Màu xe</label>
                            <input type="text" className="form-control" value={newVehicleData.vehicleColor} onChange={e => setNewVehicleData({...newVehicleData, vehicleColor: e.target.value})} placeholder="VD: Đen" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-end">
                    <button className="btn text-white px-5 py-2.5 rounded-3 fw-bold" style={{ backgroundColor: '#164e63' }} onClick={() => setSubModalStep(2)}>Tiếp tục thanh toán ➔</button>
                  </div>
                </>
              )}

              {subModalStep === 2 && (
                <div className="row g-5 pb-5 position-relative">
                  <div className="col-lg-7">
                    <h5 className="fw-bold mb-1">Thanh toán</h5>
                    <p className="text-muted small mb-4">Vui lòng chọn phương thức thanh toán phù hợp.</p>
                    <div className="d-flex flex-column gap-3">
                      {[
                        { id: 'vnpay', img: 'https://vincheck.vn/wp-content/uploads/2021/05/logo-vnpay.png', t: 'VNPAY QR', d: 'Quét mã QR từ ứng dụng' },
                        { id: 'card', txt: '💳', t: 'Thẻ Quốc tế', d: 'Visa, Mastercard, JCB' },
                        { id: 'cash', txt: '💵', t: 'Tiền mặt tại quầy', d: 'Thanh toán khi đến nhận chỗ' }
                      ].map(pm => (
                        <label key={pm.id} className={`border rounded-3 p-3 d-flex justify-content-between align-items-center cursor-pointer shadow-sm`} style={{ borderColor: paymentMethod === pm.id ? '#0ea5e9' : '#e2e8f0', borderWidth: paymentMethod === pm.id ? '2px' : '1px' }} onClick={() => setPaymentMethod(pm.id)}>
                          <div className="d-flex align-items-center gap-3">
                            <div className="bg-white rounded d-flex align-items-center justify-content-center border p-1" style={{ width: 45, height: 45 }}>
                              {pm.img ? <img src={pm.img} className="w-100 h-100 object-fit-contain" alt="Logo" /> : <span className="fs-4 text-primary">{pm.txt}</span>}
                            </div>
                            <div><strong className="d-block m-0">{pm.t}</strong><small className="text-muted">{pm.d}</small></div>
                          </div>
                          <input type="radio" className="d-none" checked={paymentMethod === pm.id} readOnly />
                          <div className="rounded-circle d-flex align-items-center justify-content-center p-1" style={{ width: 22, height: 22, border: `2px solid ${paymentMethod === pm.id ? '#0ea5e9' : '#cbd5e1'}` }}>
                            {paymentMethod === pm.id && <div className="rounded-circle w-100 h-100 bg-info"></div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="col-lg-5">
                    <div className="border rounded-3 p-4 bg-white shadow-sm mt-3">
                      <h6 className="fw-bold mb-4 pb-3 border-bottom d-flex align-items-center gap-2">🧾 CHI TIẾT THANH TOÁN</h6>
                      <div className="d-flex justify-content-between mb-4"><span className="text-muted">Tạm tính</span><strong>{activePlanPrice.toLocaleString('vi-VN')}đ</strong></div>
                      <div className="d-flex justify-content-between mb-4 border-bottom pb-4"><span className="text-muted">VAT (10%)</span><strong>{Math.floor(activePlanPrice * 0.1).toLocaleString('vi-VN')}đ</strong></div>
                      <div className="d-flex justify-content-between mt-3"><strong>Tổng cộng</strong><strong className="fs-4" style={{color: '#164e63'}}>{Math.floor(activePlanPrice * 1.1).toLocaleString('vi-VN')}đ</strong></div>
                    </div>
                  </div>
                  <div className="position-absolute bottom-0 start-0 w-100 bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center" style={{ margin: '0 -2rem -2rem -2rem', width: 'calc(100% + 4rem)' }}>
                    <div><small className="text-muted">Tổng cộng</small><strong className="d-block fs-5" style={{ color: '#164e63' }}>{Math.floor(activePlanPrice * 1.1 - discount).toLocaleString('vi-VN')}đ</strong></div>
                    <button onClick={() => setSubModalStep(3)} className="btn text-white px-4 py-2.5 rounded-3 fw-bold" style={{ backgroundColor: '#164e63' }}><ShieldCheck size={18} /> Xác nhận thanh toán</button>
                  </div>
                </div>
              )}

              {subModalStep === 3 && (
                <div className="row justify-content-center g-4 py-2">
                  <div className="col-md-6 col-lg-5">
                    <div className="border rounded-4 bg-white shadow-sm h-100 text-center d-flex flex-column">
                      <div className="bg-light py-2 border-bottom fw-bold small text-dark">HẾT HẠN TRONG 14:58</div>
                      <div className="p-4 flex-grow-1 bg-light d-flex flex-column align-items-center justify-content-center">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VP-${Date.now()}`} alt="QR" className="bg-white p-2 rounded-3 shadow-sm mb-4" />
                        <div className="fw-bold text-dark" style={{ letterSpacing: '4px' }}>VIN - 1234 - 5678</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-5 d-flex flex-column gap-3">
                    <div className="border rounded-3 p-4 bg-white">
                      <h6 className="text-muted fw-bold mb-4 small">THÔNG TIN VÉ THÁNG</h6>
                      <div className="d-flex align-items-start gap-3 mb-3"><MapPin size={18} className="text-muted"/><div><small className="text-muted d-block">Bãi đỗ</small><strong>{currentLot.name}</strong></div></div>
                      <div className="d-flex align-items-start gap-3 mb-3"><Car size={18} className="text-muted"/><div><small className="text-muted d-block">Phương tiện</small><strong>{currentSelectedVehicle.type === 'Car' ? 'Ô tô' : 'Xe máy'} - {currentSelectedVehicle.plate}</strong></div></div>
                      <div className="bg-light rounded-3 p-3 mt-3 d-flex justify-content-between align-items-center">
                        <span className="fw-semibold small">Phí thuê tháng</span><strong style={{color: '#164e63'}}>{Math.floor(activePlanPrice * 1.1).toLocaleString('vi-VN')}đ</strong>
                      </div>
                    </div>
                    <button onClick={async () => { 
                      try {
                        const payload = {
                          vehicleId: selectedSubVehicleId === 'new' ? undefined : Number(selectedSubVehicleId),
                          policyId: activeSubPlan.policyId
                        };
                        
                        if (!payload.policyId) {
                          payload.policyId = activeSubPlan.type === 'Economic' ? (currentSelectedVehicle.type === 'Car' ? 1 : 2) : (currentSelectedVehicle.type === 'Car' ? 3 : 4);
                        }
                        
                        let finalLicensePlate = currentSelectedVehicle.plate;
                        if (selectedSubVehicleId === 'new') {
                          const created = await parkingApi.createVehicle({
                            licensePlate: newVehicleData.licensePlate.trim().replace(/[^A-Za-z0-9\-.]/g, ''),
                            vehicleColor: newVehicleData.vehicleColor.trim(),
                            vehicleBrand: newVehicleData.vehicleBrand.trim(),
                            vehicleTypeId: currentSelectedVehicle.type === 'Car' ? 1 : 2,
                            userId: Number(userId)
                          });
                          payload.vehicleId = created.vehicleId || created.id;
                          finalLicensePlate = created.licensePlate;
                        }

                        await parkingApi.submitMonthlyTicketRequest({
                          vehicleId: payload.vehicleId,
                          policyId: payload.policyId,
                          branchId: Number(selectedLotId)
                        });
                        
                        toast.success(`Đã gửi yêu cầu đăng ký gói "${activeSubPlan.title || activeSubPlan.name}" cho xe ${finalLicensePlate}! Ban quản lý sẽ sớm duyệt yêu cầu của bạn.`);
                        setActiveSubPlan(null);
                        setSubModalStep(1);
                      } catch (err) {
                        console.error(err);
                        toast.error('Có lỗi xảy ra khi gửi yêu cầu đăng ký. Vui lòng thử lại!');
                      }
                    }} className="btn text-white w-100 fw-bold py-2.5 rounded-3" style={{ backgroundColor: '#164e63' }}>Hoàn tất đăng ký</button>
                    <button onClick={() => { toast.info('Đã hủy đặt chỗ!'); setActiveSubPlan(null); }} className="btn btn-link text-danger w-100 small text-decoration-none">Hủy đặt chỗ</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
