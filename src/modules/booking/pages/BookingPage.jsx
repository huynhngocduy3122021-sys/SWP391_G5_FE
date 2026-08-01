// BookingPage - Trang xử lý quy trình đặt chỗ đỗ xe
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import parkingApi from '../../search/api/parkingApi';
import { Card, Button, Form, Row, Col, Badge, Container } from 'react-bootstrap';

const isMotorbikeType = (typeName = '') => {
  const normalizedName = typeName.toLowerCase();
  return normalizedName.includes('motorbike') || normalizedName.includes('xe máy') || normalizedName.includes('xe may');
};

const ACTIVE_PARKING_SERVICE_MESSAGE = 'Xe đã có dịch vụ đỗ xe nên không thể booking được.';

export default function BookingPage() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [pricePolicies, setPricePolicies] = useState([]);

  // Selected state
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState('');
  const bookableVehicleTypes = vehicleTypes.filter(v => !isMotorbikeType(v.typeName));

  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedUserVehicleId, setSelectedUserVehicleId] = useState('other');

  // Active monthly tickets & requests for checking booking eligibility
  const [userTickets, setUserTickets] = useState([]);
  const [userRequests, setUserRequests] = useState([]);

  // 1. Wizard Step State: 1 (Select Slot), 2 (Details), 3 (Success)
  const [step, setStep] = useState(1);

  // 2. Booking Data State
  const [arrivalDate, setArrivalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('14:00');
  const [customTime, setCustomTime] = useState('');
  const [showCustomTimeInput, setShowCustomTimeInput] = useState(false);

  // Driver details
  const [licensePlate, setLicensePlate] = useState('');
  const [isEditingPlate, setIsEditingPlate] = useState(false);
  const [fullName, setFullName] = useState(localStorage.getItem('fullName') || 'Nguyễn Văn A');
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem('phone') || localStorage.getItem('userPhone') || '0901 234 567');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');

  // Booking details confirmation
  const [confirmedBookingId, setConfirmedBookingId] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, vtData, policiesData, allVehiclesData, ticketsData, requestsData] = await Promise.all([
          parkingApi.getAllBranches(),
          parkingApi.getAllVehicleTypes(),
          parkingApi.getAllPricePolicies(),
          parkingApi.getAllVehicles().catch(() => []),
          parkingApi.getMyMonthlyTickets().catch(() => []),
          parkingApi.getMyMonthlyTicketRequests().catch(() => [])
        ]);
        
        setBranches(branchesData);
        setVehicleTypes(vtData);
        setPricePolicies(policiesData);
        setUserTickets(Array.isArray(ticketsData) ? ticketsData : []);
        setUserRequests(Array.isArray(requestsData) ? requestsData : []);

        const userId = localStorage.getItem('userId');
        const userVehiclesList = Array.isArray(allVehiclesData)
          ? allVehiclesData.filter(v => String(v.userId) === String(userId) && !v.deleted)
          : [];
        setUserVehicles(userVehiclesList);

        if (branchesData.length > 0) {
          setSelectedBranchId(branchesData[0].parkingBranchId || branchesData[0].branchId || branchesData[0].id);
        }
        if (vtData.length > 0) {
          const filteredTypes = vtData.filter(v => !isMotorbikeType(v.typeName));
          const carType = filteredTypes.find(v => v.typeName.toLowerCase().includes('ô tô') || v.typeName.toLowerCase().includes('car'));
          setSelectedVehicleTypeId(carType ? carType.vehicleTypeId : filteredTypes[0]?.vehicleTypeId || '');
        }

        if (userVehiclesList.length > 0) {
          const firstV = userVehiclesList[0];
          setSelectedUserVehicleId(firstV.vehicleId || firstV.id);
          setLicensePlate(firstV.licensePlate || '');
          setVehicleColor(firstV.color || '');
          setVehicleBrand(firstV.brand || '');
        }
      } catch (error) {
        console.error('Error fetching booking data:', error);
      }
    };
    fetchData();
  }, []);

  const handleUserVehicleChange = (e) => {
    const val = e.target.value;
    setSelectedUserVehicleId(val);
    if (val === 'other') {
      setLicensePlate('');
      setVehicleColor('');
      setVehicleBrand('');
    } else {
      const v = userVehicles.find(x => String(x.vehicleId || x.id) === String(val));
      if (v) {
        setLicensePlate(v.licensePlate || '');
        setVehicleColor(v.color || '');
        setVehicleBrand(v.brand || '');
      }
    }
  };



  // Calculate expiration time (Arrival time + 20 minutes)
  const getExpirationTime = () => {
    if (!timeSlot) return '';
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + 20, 0);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Helper to format Vietnamese date nicely
  const formatVietnameseDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[d.getDay()];
      const day = d.getDate();
      const month = d.getMonth() + 1;
      return `${dayName}, ${day} Tháng ${month}`;
    } catch {
      return dateStr;
    }
  };

  // Retrieve selected branch & vehicle info
  const selectedBranch = branches.find(b => 
    b.parkingBranchId === Number(selectedBranchId) || b.branchId === Number(selectedBranchId) || b.id === Number(selectedBranchId)
  ) || {};
  const selectedVehicleType = vehicleTypes.find(v => 
    v.vehicleTypeId === Number(selectedVehicleTypeId) || v.id === Number(selectedVehicleTypeId)
  ) || {};

  // Retrieve price dynamically
  // Find price policy matching vehicle type id and branch id
  let matchedPolicy = pricePolicies.find(
    p => (p.vehicleType?.vehicleTypeId === Number(selectedVehicleTypeId) || p.vehicleType?.id === Number(selectedVehicleTypeId)) && 
         (p.parkingBranch?.parkingBranchId === Number(selectedBranchId) || p.parkingBranch?.branchId === Number(selectedBranchId) || p.parkingBranch?.id === Number(selectedBranchId))
  );
  
  if (!matchedPolicy) {
    matchedPolicy = pricePolicies.find(p => p.vehicleType?.vehicleTypeId === Number(selectedVehicleTypeId) || p.vehicleType?.id === Number(selectedVehicleTypeId));
  }

  // Lấy giá thực tế từ backend, không dùng giá ảo
  const hourlyRate = matchedPolicy?.hourlyRate ?? matchedPolicy?.basePrice ?? matchedPolicy?.price ?? matchedPolicy?.firstBlockPrice ?? 0;
  
  // Lấy phí booking từ backend
  const bookingFee = matchedPolicy?.bookingFee ?? matchedPolicy?.reservationFee ?? 0;

  // Check if current vehicle already has monthly ticket / active parking service
  const cleanPlate = (licensePlate || '').trim().replace(/[^A-Za-z0-9\-.]/g, '').toUpperCase();
  const hasMonthlyService = Boolean(cleanPlate) && (
    userTickets.some(t => {
      const tPlate = (t.vehicle?.licensePlate || t.licensePlate || '').trim().replace(/[^A-Za-z0-9\-.]/g, '').toUpperCase();
      const isActive = t.status === 1 || t.status === true || t.status === 'ACTIVE';
      return isActive && tPlate === cleanPlate;
    }) ||
    userRequests.some(r => {
      const rPlate = (r.vehicle?.licensePlate || r.licensePlate || '').trim().replace(/[^A-Za-z0-9\-.]/g, '').toUpperCase();
      const isPendingOrActive = r.status !== 'REJECTED' && r.status !== 'CANCELLED' && r.status !== 'REJECTED_BY_USER';
      return isPendingOrActive && rPlate === cleanPlate;
    })
  );

  // Complete Booking (Step 2 -> Step 3)
  const handleCreateBooking = async () => {
    if (!fullName.trim() || !phoneNumber.trim() || !licensePlate.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin tài xế!');
      return;
    }

    if (hasMonthlyService) {
      toast.error(ACTIVE_PARKING_SERVICE_MESSAGE);
      return;
    }

    try {
      // Keep local time format for LocalDateTime backend validation
      const expectedArrivalTime = `${arrivalDate}T${timeSlot}:00`;
      
      const payload = {
        userId: Number(localStorage.getItem('userId')) || undefined,
        parkingBranchId: Number(selectedBranchId),
        vehicleTypeId: Number(selectedVehicleTypeId),
        licensePlate: licensePlate,
        expectedArrivalTime: expectedArrivalTime,
        vehicleColor: vehicleColor.trim(),
        vehicleBrand: vehicleBrand.trim()
      };
      
      const response = await parkingApi.createBooking(payload);
      
      // Save actual booking code and ID returned from database
      const actualBookingCode = response.bookingCode || `BK-${Date.now().toString().slice(-6)}`;
      setConfirmedBookingId(actualBookingCode);
      setCreatedBookingId(response.bookingId);

      // Save transaction to local storage
      const newTransaction = {
        id: actualBookingCode,
        date: `${arrivalDate} ${timeSlot}`,
        lotName: selectedBranch?.branchName || 'Bãi đỗ xe',
        plate: licensePlate,
        amount: bookingFee, // Save actual booking fee
        status: 'Thành công',
        service: `Đặt giữ chỗ ${selectedVehicleType?.typeName || 'Xe'}`,
        duration: '1h',
      };

      const existingTxStr = localStorage.getItem('customTransactions');
      const existingTx = existingTxStr ? JSON.parse(existingTxStr) : [];
      localStorage.setItem('customTransactions', JSON.stringify([newTransaction, ...existingTx]));

      setStep(3);
      toast.success('Đặt giữ chỗ thành công!');
    } catch (error) {
      console.error('Error creating booking:', error);
      
      if (error.response?.data) {
        const data = error.response.data;
        if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
          Object.values(data.errors).forEach(errMsg => toast.error(errMsg));
          return;
        }
        if (Array.isArray(data.errors)) {
          data.errors.forEach(err => toast.error(err.defaultMessage || err.message || err));
          return;
        }
        const backendMessage = typeof data === 'string' ? data : data.message;
        if (backendMessage) {
          const normalizedMessage = String(backendMessage).toLowerCase();
          if (normalizedMessage.includes('đặt chỗ đang hoạt động') || normalizedMessage.includes('active booking')) {
            return toast.error(ACTIVE_PARKING_SERVICE_MESSAGE);
          }
          return toast.error(backendMessage);
        }
      }
      
      toast.error('Có lỗi xảy ra khi tạo mã đặt chỗ trên hệ thống! Vui lòng thử lại.');
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (hasMonthlyService) {
        toast.error(ACTIVE_PARKING_SERVICE_MESSAGE);
        return;
      }
      handleCreateBooking();
    }
  };

  const stepsList = [
    { num: 1, label: 'Chọn Chỗ' },
    { num: 2, label: 'Chi Tiết' },
    { num: 3, label: 'Hoàn Tất' }
  ];

  return (
    <div className="bg-light min-vh-100 py-5 text-dark " style={{ fontFamily: 'Inter, sans-serif' }}>
      <Container style={{ maxWidth: '640px' }}>
        
        {/* Back Button */}
        {step < 3 && (
          <Button variant="link" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="text-decoration-none p-0 d-inline-flex align-items-center gap-1 fw-bold mb-3 text-secondary" style={{ fontSize: '0.9rem' }}>
            ← Quay lại
          </Button>
        )}

        {/* 3-Step Progress Tracker */}
        <Card className="border border-secondary border-opacity-25 border-dashed rounded-3 p-3 mb-4 bg-white shadow-sm">
          <div className="d-flex justify-content-between align-items-center">
            {stepsList.map((s) => (
              <div key={s.num} className="d-flex flex-column align-items-center flex-grow-1 position-relative">
                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white mb-1 shadow-sm ${step === s.num ? 'bg-primary' : step > s.num ? 'bg-success' : 'bg-secondary'}`} style={{ width: '32px', height: '32px', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`small ${step === s.num ? 'fw-bold text-primary' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Selected Lot Header Info */}
        {step < 3 && (
          <Card className="border-0 shadow-sm p-3 rounded-4 mb-4">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 overflow-hidden shadow-sm d-flex align-items-center justify-content-center bg-light fs-3" style={{ width: '80px', height: '60px', flexShrink: 0 }}>🏢</div>
              <div className="flex-grow-1">
                <small className="text-muted fw-bold d-block" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>BÃI ĐỖ XE DỰ KIẾN</small>
                <Form.Select size="sm" className="fw-bold border-0 shadow-none px-0 mt-1 fs-5 text-dark" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}>
                  {branches.map(b => <option key={b.parkingBranchId || b.branchId || b.id} value={b.parkingBranchId || b.branchId || b.id}>{b.branchName || b.name}</option>)}
                </Form.Select>
                <p className="text-muted small m-0 mt-1">📍 {selectedBranch?.location || 'Đang cập nhật địa chỉ'}</p>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 1: SELECT SLOT */}
        {step === 1 && (
          <div className="d-flex flex-column gap-4">
            <Card className="border-0 shadow-sm p-4 rounded-4">
              <h6 className="text-muted fw-bold mb-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>LOẠI PHƯƠNG TIỆN</h6>
              <Row className="g-3">
                {bookableVehicleTypes.map(v => {
                  const isSelected = String(selectedVehicleTypeId) === String(v.vehicleTypeId);
                  return (
                    <Col xs={6} key={v.vehicleTypeId}>
                      <Button variant={isSelected ? 'primary' : 'outline-secondary'} onClick={() => setSelectedVehicleTypeId(v.vehicleTypeId)} className={`w-100 py-3 rounded-3 d-flex flex-column align-items-center justify-content-center border shadow-sm ${isSelected ? 'bg-primary text-white border-primary' : 'bg-white text-dark'}`}>
                        <span className="fs-2 mb-1">{v.typeName?.toLowerCase().includes('ô tô') || v.typeName?.toLowerCase().includes('car') ? '🚗' : '🏍️'}</span>
                        <span className="fw-bold small">{v.typeName}</span>
                      </Button>
                    </Col>
                  );
                })}
              </Row>
            </Card>

            <Card className="border-0 shadow-sm p-4 rounded-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="text-muted fw-bold m-0" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>THỜI GIAN ĐẾN DỰ KIẾN</h6>
                <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded text-dark border">
                  <span>📅</span>
                  <Form.Control type="date" className="border-0 bg-transparent fw-bold small p-0 text-dark shadow-none" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} />
                </div>
              </div>
              <div className="text-primary fw-bold mb-3 fs-5">{formatVietnameseDate(arrivalDate)}</div>

              <Row className="g-2 mb-3">
                {['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map((slot) => (
                  <Col xs={4} key={slot}>
                    <Button variant={!showCustomTimeInput && timeSlot === slot ? 'primary' : 'outline-secondary'} onClick={() => { setTimeSlot(slot); setShowCustomTimeInput(false); }} className={`w-100 py-2 rounded-2 text-center small fw-semibold shadow-sm ${!showCustomTimeInput && timeSlot === slot ? 'text-white' : 'bg-white text-dark'}`}>
                      {slot}
                    </Button>
                  </Col>
                ))}
              </Row>

              <Button variant="outline-secondary" onClick={() => setShowCustomTimeInput(!showCustomTimeInput)} className="w-100 py-2 rounded-2 small fw-bold d-flex align-items-center justify-content-center gap-2 text-dark bg-light shadow-sm">
                <span>🕒</span> {showCustomTimeInput ? 'Chọn theo danh sách' : 'Chọn giờ khác'}
              </Button>

              {showCustomTimeInput && (
                <div className="mt-3">
                  <Form.Label className="text-muted small fw-bold">Nhập giờ đến mong muốn</Form.Label>
                  <Form.Control type="time" className="text-dark fw-bold" value={customTime} onChange={e => { setCustomTime(e.target.value); setTimeSlot(e.target.value); }} />
                </div>
              )}
            </Card>

            <Card className="border-0 shadow-sm p-4 rounded-4">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="fw-bold text-success mb-1" style={{ fontSize: '0.85rem' }}>PHÍ GIỮ CHỖ TRƯỚC (BOOKING)</h6>
                  <p className="text-muted small m-0">Khách hàng: {selectedVehicleType?.typeName} - {timeSlot}</p>
                </div>
                <h4 className="fw-bold text-primary m-0">{bookingFee.toLocaleString('vi-VN')}đ</h4>
              </div>
              <p className="text-muted small mb-3 border-top pt-2">ℹ️ Tiền gửi xe sẽ được tính thực tế theo block thời gian khi bạn check-out tại cổng ra.</p>

            </Card>

            {/* Sticky Step 1 footer */}
            <div className="card border-0 shadow-lg p-3 rounded-4 bg-white d-flex flex-row justify-content-between align-items-center position-sticky bottom-0">
              <div>
                <small className="text-muted d-block fw-bold">Tổng cộng</small>
                <h5 className="fw-bold text-primary m-0">{bookingFee.toLocaleString('vi-VN')}đ</h5>
              </div>
              <Button variant="primary" onClick={handleNextStep} className="fw-bold px-4 py-2 rounded-3 shadow-sm">Tiếp tục</Button>
            </div>
          </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === 2 && (
          <div className="d-flex flex-column gap-4">
            <Card className="border-0 shadow-sm p-4 rounded-4">
              <Row className="g-3">
                <Col md={6} className="border-md-end border-light">
                  <h6 className="text-muted fw-bold small mb-2 d-flex align-items-center gap-2"><span>🕒</span> THỜI GIAN</h6>
                  <p className="text-muted small mb-1">Thời gian đến dự kiến</p>
                  <strong className="text-primary d-block mb-2">{timeSlot}, {formatVietnameseDate(arrivalDate)}</strong>
                  <p className="text-danger small fst-italic m-0">* Slot đặt trước sẽ được giữ tối đa 30 phút. Vui lòng check-in đúng giờ.</p>
                </Col>

                <Col md={6} className="ps-md-4">
                  <h6 className="text-muted fw-bold small mb-2 d-flex align-items-center gap-2"><span>🚙</span> THÔNG TIN XE</h6>
                  {userVehicles.length > 0 && (
                    <Form.Group className="mb-3">
                      <Form.Label className="text-muted small fw-bold mb-1">Chọn xe của bạn</Form.Label>
                      <Form.Select size="sm" className="text-dark fw-bold" value={selectedUserVehicleId} onChange={handleUserVehicleChange}>
                        {userVehicles.map(v => <option key={v.vehicleId || v.id} value={v.vehicleId || v.id}>{v.licensePlate} {v.brand || v.color ? `(${v.brand || ''} ${v.color || ''})` : ''}</option>)}
                        <option value="other">+ Đặt cho xe khác</option>
                      </Form.Select>
                    </Form.Group>
                  )}

                  <p className="text-muted small fw-bold mb-1">Biển số xe</p>
                  {isEditingPlate || selectedUserVehicleId === 'other' ? (
                    <div className="d-flex gap-2 mb-2">
                      <Form.Control size="sm" type="text" className="text-dark fw-bold text-uppercase" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} onBlur={() => selectedUserVehicleId !== 'other' && setIsEditingPlate(false)} onKeyDown={e => e.key === 'Enter' && selectedUserVehicleId !== 'other' && setIsEditingPlate(false)} autoFocus={isEditingPlate} placeholder="Nhập biển số..." />
                      {selectedUserVehicleId !== 'other' && <Button size="sm" variant="secondary" className="fw-bold" onClick={() => setIsEditingPlate(false)}>Lưu</Button>}
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-between border rounded p-2 bg-light mb-2">
                      <strong className="text-primary fs-5">{licensePlate}</strong>
                      <Button variant="link" onClick={() => setIsEditingPlate(true)} className="text-decoration-none p-0 small fw-bold text-primary">✏️</Button>
                    </div>
                  )}

                  <Row className="g-2">
                    <Col xs={6}>
                      <Form.Label className="text-muted small fw-bold mb-1">Màu xe</Form.Label>
                      <Form.Control size="sm" type="text" placeholder="Ví dụ: Xanh, Đỏ" className="text-dark fw-medium" value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} disabled={selectedUserVehicleId !== 'other'} />
                    </Col>
                    <Col xs={6}>
                      <Form.Label className="text-muted small fw-bold mb-1">Hiệu xe</Form.Label>
                      <Form.Control size="sm" type="text" placeholder="Ví dụ: VinFast" className="text-dark fw-medium" value={vehicleBrand} onChange={e => setVehicleBrand(e.target.value)} disabled={selectedUserVehicleId !== 'other'} />
                    </Col>
                  </Row>
                  <p className="text-muted small mt-2 m-0">💡 Hệ thống AI sẽ tự động nhận diện biển số này khi xe vào bãi.</p>

                  {hasMonthlyService && (
                    <div className="rounded-3 p-3 mt-3 text-start" style={{ background: '#fef2f2', border: '1.5px solid #fca5a5' }}>
                      <div className="d-flex align-items-start gap-2">
                        <span className="fs-5">🚫</span>
                        <div>
                          <strong className="text-danger d-block mb-1" style={{ fontSize: '0.9rem' }}>
                            Phương tiện đã có dịch vụ đỗ xe!
                          </strong>
                          <small className="text-dark d-block mb-0" style={{ lineHeight: '1.4' }}>
                            Xe của bạn (<strong>{licensePlate}</strong>) đã được đăng ký dịch vụ đỗ xe (thẻ tháng / VIP). Xe đã có quyền ra vào bãi tự động, không thể đặt chỗ theo giờ thêm.
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                </Col>
              </Row>
            </Card>

            <Card className="border-0 shadow-sm p-4 rounded-4">
              <h6 className="text-muted fw-bold mb-3 d-flex align-items-center gap-2"><span>👤</span> THÔNG TIN NGƯỜI ĐẶT</h6>
              <Row className="g-3">
                <Col md={6}><Form.Group><Form.Label className="text-muted small fw-bold mb-1">Họ và Tên</Form.Label><Form.Control type="text" required className="text-dark fw-bold" value={fullName} onChange={e => setFullName(e.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="text-muted small fw-bold mb-1">Số điện thoại</Form.Label><Form.Control type="text" required className="text-dark fw-bold" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} /></Form.Group></Col>
              </Row>
            </Card>

            {/* Estimated breakdown cost details */}
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <h6 className="text-muted fw-bold mb-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>CHI TIẾT TẠM TÍNH</h6>
              
              <div className="d-flex justify-content-between align-items-center mb-2 small">
                <span className="text-muted">Phí giữ chỗ (Booking fee)</span>
                <span className="fw-bold text-dark">{bookingFee.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3 small">
                <span className="text-muted">Phí tiện ích AI</span>
                <span className="text-success fw-bold">Miễn phí</span>
              </div>

              <div className="p-2.5 rounded-3 bg-light text-muted small d-flex align-items-center gap-2">
                <span>🛡️</span>
                <span style={{ fontSize: '0.75rem' }}>Bạn có thể hoàn hủy đặt chỗ miễn phí trước giờ đặt 30 phút.</span>
              </div>
            </div>

            {/* Sticky Step 2 footer */}
            <div className="card border-0 shadow-lg p-3 rounded-4 bg-white d-flex flex-row justify-content-between align-items-center position-sticky bottom-0">
              <div>
                <small className="text-muted d-block">Phí giữ chỗ trước</small>
                <h5 className={`fw-bold m-0 ${bookingFee > 0 ? 'text-dark' : 'text-success'}`}>
                  {bookingFee > 0 ? `${bookingFee.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                </h5>
              </div>
              <button
                type="button"
                onClick={handleNextStep}
                className="btn text-white fw-bold px-4 py-2.5 rounded-3"
                style={{ backgroundColor: '#164e63' }}
              >
                Xác nhận đặt chỗ
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <Card className="border-0 shadow-lg p-4 p-md-5 rounded-4 text-center">
            <div className="d-flex justify-content-center mb-3">
              <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center shadow-sm" style={{ width: '70px', height: '70px' }}><span className="fs-1">✓</span></div>
            </div>
            <h3 className="fw-bold text-primary mb-1">Đặt chỗ thành công!</h3>
            <p className="text-muted small mb-4">Vui lòng lưu mã QR bên dưới để quét tại cổng vào.</p>

            <div className="border border-secondary border-dashed border-opacity-25 rounded-4 p-4 mb-4 bg-light position-relative shadow-sm">
              <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-2 fw-bold mb-4">⏰ HẾT HẠN LÚC {getExpirationTime()}</Badge>

              <div className="d-flex flex-column align-items-center justify-content-center my-3">
                <div className="bg-white border rounded-4 shadow-sm p-4 d-flex flex-column align-items-center justify-content-center" style={{ width: '220px', minHeight: '260px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${confirmedBookingId}`} alt="Ticket QR Code" className="img-fluid" style={{ width: '130px', height: '130px', objectFit: 'contain' }} />
                  <strong className="text-primary mt-3 fs-5">{confirmedBookingId}</strong>
                </div>
                <Button variant="link" className="text-decoration-none fw-bold mt-3 d-flex align-items-center gap-1 text-primary small">📥 Tải xuống mã QR</Button>
              </div>

              <Row className="g-3 w-100 text-start small border-top pt-4 mt-2">
                <Col xs={6}><span className="text-muted d-block small fw-bold">📍 VỊ TRÍ ĐỖ</span><strong className="text-dark">{selectedBranch?.branchName}</strong></Col>
                <Col xs={6}><span className="text-muted d-block small fw-bold">🚗 PHƯƠNG TIỆN</span><strong className="text-dark">{selectedVehicleType?.typeName} - {licensePlate}</strong>{(vehicleColor || vehicleBrand) && <span className="text-muted d-block small">({[vehicleBrand, vehicleColor].filter(Boolean).join(' - ')})</span>}</Col>
                <Col xs={6}><span className="text-muted d-block small fw-bold">📅 THỜI GIAN ĐẾN</span><strong className="text-dark">{timeSlot} - {formatVietnameseDate(arrivalDate)}</strong></Col>
                <Col xs={6}><span className="text-muted d-block small fw-bold">💵 PHÍ DỰ KIẾN</span><Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 py-1 px-2 fw-bold fs-6">{hourlyRate.toLocaleString('vi-VN')}đ/1h</Badge></Col>
              </Row>
            </div>

            <div className="text-start mb-4 p-3 border rounded-3 bg-light shadow-sm">
              <h6 className="fw-bold text-primary mb-3">ℹ️ HƯỚNG DẪN CHECK-IN</h6>
              <div className="d-flex flex-column gap-2 small fw-bold text-muted">
                <div className="d-flex gap-2 align-items-center"><Badge bg="primary" pill>1</Badge> <span>Di chuyển đến cổng bãi xe</span></div>
                <div className="d-flex gap-2 align-items-center"><Badge bg="primary" pill>2</Badge> <span>Quét mã QR tại máy ở cổng vào</span></div>
                <div className="d-flex gap-2 align-items-center"><Badge bg="primary" pill>3</Badge> <span>Đỗ xe vào đúng ô đỗ đã được cấp</span></div>
              </div>
            </div>

            <div className="d-flex flex-column gap-2 px-md-4">
              <Button variant="outline-primary" className="fw-bold py-2 rounded-3 w-100 shadow-sm">🗺️ Xem hướng dẫn đường đi</Button>
              <Button variant="primary" onClick={() => navigate('/user-dashboard', { state: { activeTab: 'bookings' } })} className="fw-bold py-2 rounded-3 w-100 shadow-sm">Quản lý lịch đặt giữ chỗ</Button>
              <Button variant="link" className="text-danger text-decoration-none fw-bold mt-2 small" onClick={async () => {
                if (createdBookingId) {
                  if (window.confirm('Bạn có chắc chắn muốn hủy lượt đặt giữ chỗ này?')) {
                    try {
                      await parkingApi.cancelBooking(createdBookingId);
                      toast.success('Hủy đặt chỗ thành công!');
                      navigate('/user-dashboard', { state: { activeTab: 'bookings' } });
                    } catch (err) { toast.error('Không thể hủy đặt giữ chỗ vào lúc này!'); }
                  }
                } else navigate('/');
              }}>
                Hủy đặt chỗ
              </Button>
            </div>
          </Card>
        )}
      </Container>
    </div>
  );
}
