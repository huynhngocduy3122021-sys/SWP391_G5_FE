import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PARKING_LOTS, mapBranchToParkingLot } from '../data/parkingData';
import parkingApi from '../api/parkingApi';

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [pricePolicies, setPricePolicies] = useState([]);

  // Selected state
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, vtData, policiesData] = await Promise.all([
          parkingApi.getAllBranches(),
          parkingApi.getAllVehicleTypes(),
          parkingApi.getAllPricePolicies()
        ]);
        
        setBranches(branchesData);
        setVehicleTypes(vtData);
        setPricePolicies(policiesData);

        if (branchesData.length > 0) {
          setSelectedBranchId(branchesData[0].parkingBranchId || branchesData[0].branchId || branchesData[0].id);
        }
        if (vtData.length > 0) {
          const carType = vtData.find(v => v.typeName.toLowerCase().includes('ô tô') || v.typeName.toLowerCase().includes('car'));
          setSelectedVehicleTypeId(carType ? carType.vehicleTypeId : vtData[0].vehicleTypeId);
        }
      } catch (error) {
        console.error('Error fetching booking data:', error);
      }
    };
    fetchData();
  }, []);

  // 1. Wizard Step State: 1 (Select Slot), 2 (Details), 3 (Success)
  const [step, setStep] = useState(1);

  // 2. Booking Data State
  const [arrivalDate, setArrivalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('14:00');
  const [customTime, setCustomTime] = useState('');
  const [showCustomTimeInput, setShowCustomTimeInput] = useState(false);

  // Driver details
  const [licensePlate, setLicensePlate] = useState('51H-123.45');
  const [isEditingPlate, setIsEditingPlate] = useState(false);
  const [fullName, setFullName] = useState(localStorage.getItem('fullName') || 'Nguyễn Văn A');
  const [phoneNumber, setPhoneNumber] = useState('0901 234 567');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');

  // Booking details confirmation
  const [confirmedBookingId, setConfirmedBookingId] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState(null);

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

  // Complete Booking (Step 2 -> Step 3)
  const handleCreateBooking = async () => {
    if (!fullName.trim() || !phoneNumber.trim() || !licensePlate.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin tài xế!');
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
      const actualBookingCode = response.bookingCode || `BK-${Math.floor(10000000 + Math.random() * 90000000)}`;
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
        
        // Xử lý lỗi validation từ Spring Boot (dạng Object { field: 'message' })
        if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
          Object.values(data.errors).forEach(errMsg => {
            toast.error(errMsg);
          });
          return;
        }
        
        // Xử lý lỗi validation dạng mảng (Array)
        if (Array.isArray(data.errors)) {
          data.errors.forEach(err => {
            toast.error(err.defaultMessage || err.message || err);
          });
          return;
        }

        // Xử lý khi backend trả về một message cụ thể
        if (data.message) {
          toast.error(data.message);
          return;
        }
        
        // Xử lý khi data là chuỗi
        if (typeof data === 'string') {
          toast.error(data);
          return;
        }
      }
      
      toast.error('Có lỗi xảy ra khi tạo mã đặt chỗ trên hệ thống! Vui lòng thử lại.');
    }
  };

  // Proceed to next steps
  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      handleCreateBooking();
    }
  };

  // Steps breadcrumb data
  const stepsList = [
    { num: 1, label: 'Select Slot' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Success' }
  ];

  return (
    <div className="bg-light min-vh-100 py-5" style={{ color: '#1e293b' }}>
      <div className="container" style={{ maxWidth: '640px' }}>
        
        {/* Back Button */}
        {step < 3 && (
          <button 
            type="button" 
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} 
            className="btn btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-1 fw-bold mb-3 text-secondary"
            style={{ fontSize: '0.9rem' }}
          >
            ← Quay lại
          </button>
        )}

        {/* 3-Step Progress Tracker */}
        <div className="d-flex justify-content-between align-items-center border border-dashed rounded-3 p-3 mb-4 bg-white" style={{ borderColor: '#cbd5e1' }}>
          {stepsList.map((s) => (
            <div key={s.num} className="d-flex flex-column align-items-center flex-grow-1 position-relative">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white mb-1 shadow-sm" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: step === s.num ? '#164e63' : step > s.num ? '#10b981' : '#cbd5e1',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: step === s.num ? 'bold' : 'normal', color: step === s.num ? '#164e63' : '#64748b' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Selected Lot Header Info */}
        {step < 3 && (
          <div className="card border-0 shadow-sm p-3 rounded-4 mb-4 bg-white">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 overflow-hidden shadow-sm d-flex align-items-center justify-content-center bg-light" style={{ width: '80px', height: '60px', flexShrink: 0, fontSize: '1.5rem' }}>
                🏢
              </div>
              <div className="flex-grow-1">
                <small className="text-muted d-block" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>BÃI ĐỖ XE DỰ KIẾN</small>
                <select 
                  className="form-select form-select-sm fw-bold border-0 shadow-none px-0 mt-1" 
                  value={selectedBranchId} 
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  {branches.map(b => {
                    const id = b.parkingBranchId || b.branchId || b.id;
                    const name = b.branchName || b.name;
                    return <option key={id} value={id}>{name}</option>;
                  })}
                </select>
                <p className="text-muted small m-0 mt-1" style={{ fontSize: '0.8rem' }}>📍 {selectedBranch?.location || 'Đang cập nhật địa chỉ'}</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: SELECT SLOT */}
        {step === 1 && (
          <div className="d-flex flex-column gap-4">
            
            {/* LOẠI PHƯƠNG TIỆN (Vehicle Type Selector) */}
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <h6 className="text-muted fw-bold mb-3" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>LOẠI PHƯƠNG TIỆN</h6>
              <div className="row g-3">
                {vehicleTypes.map(v => {
                  const isSelected = String(selectedVehicleTypeId) === String(v.vehicleTypeId);
                  return (
                    <div className="col-6" key={v.vehicleTypeId}>
                      <button
                        type="button"
                        onClick={() => setSelectedVehicleTypeId(v.vehicleTypeId)}
                        className="btn w-100 py-3 rounded-3 d-flex flex-column align-items-center justify-content-center border transition-all shadow-sm"
                        style={{
                          borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
                          backgroundColor: isSelected ? '#eff6ff' : '#fff',
                        }}
                      >
                        <span className="fs-2 mb-1">{v.typeName?.toLowerCase().includes('ô tô') || v.typeName?.toLowerCase().includes('car') ? '🚗' : '🏍️'}</span>
                        <span className="fw-bold text-dark small">{v.typeName}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* THỜI GIAN ĐẾN DỰ KIẾN */}
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="text-muted fw-bold m-0" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>THỜI GIAN ĐẾN DỰ KIẾN</h6>
                <div className="d-flex align-items-center gap-1.5 bg-light px-2.5 py-1 rounded text-dark" style={{ fontSize: '0.75rem' }}>
                  <span>📅</span>
                  <input
                    type="date"
                    className="border-0 bg-transparent fw-bold small p-0 text-dark shadow-none outline-none"
                    value={arrivalDate}
                    onChange={e => setArrivalDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="text-dark fw-bold mb-3" style={{ fontSize: '1rem' }}>
                {formatVietnameseDate(arrivalDate)}
              </div>

              {/* Time Slots Grid */}
              <div className="row g-2 mb-3">
                {['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map((slot) => (
                  <div className="col-4" key={slot}>
                    <button
                      type="button"
                      onClick={() => {
                        setTimeSlot(slot);
                        setShowCustomTimeInput(false);
                      }}
                      className="btn w-100 py-2 rounded-2 border text-center small fw-semibold transition-all"
                      style={{
                        borderColor: !showCustomTimeInput && timeSlot === slot ? '#164e63' : '#e2e8f0',
                        backgroundColor: !showCustomTimeInput && timeSlot === slot ? '#164e63' : '#ffffff',
                        color: !showCustomTimeInput && timeSlot === slot ? '#ffffff' : '#475569',
                      }}
                    >
                      {slot}
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowCustomTimeInput(!showCustomTimeInput)}
                className="btn btn-outline-secondary w-100 py-2 rounded-2 small fw-bold d-flex align-items-center justify-content-center gap-1.5"
                style={{ borderColor: '#cbd5e1' }}
              >
                <span>🕒</span> {showCustomTimeInput ? 'Chọn theo danh sách' : 'Chọn giờ khác'}
              </button>

              {showCustomTimeInput && (
                <div className="mt-3">
                  <label className="form-label text-muted small fw-bold">Nhập giờ đến mong muốn</label>
                  <input
                    type="time"
                    className="form-control text-dark fw-bold"
                    value={customTime}
                    onChange={e => {
                      setCustomTime(e.target.value);
                      setTimeSlot(e.target.value);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Estimated Deposit breakdown box */}
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="fw-bold text-success" style={{ fontSize: '0.85rem' }}>PHÍ GIỮ CHỖ TRƯỚC (BOOKING)</h6>
                  <p className="text-muted small m-0">Khách hàng: {selectedVehicleType?.typeName} - {timeSlot}</p>
                </div>
                <h4 className="fw-bold m-0" style={{ color: '#164e63' }}>{bookingFee.toLocaleString('vi-VN')}đ</h4>
              </div>

              <p className="text-muted small mb-3 border-top pt-2" style={{ lineHeight: '1.4' }}>
                ℹ️ Tiền gửi xe sẽ được tính thực tế theo block thời gian khi bạn check-out tại cổng ra.
              </p>

              {/* Promo code notice banner */}
              <div className="p-2.5 rounded-3 text-dark small d-flex align-items-center gap-2" style={{ backgroundColor: '#ccfbf1', border: '1px solid #99f6e4' }}>
                <span>🎁</span>
                <span className="fw-medium text-teal" style={{ color: '#0f766e' }}>
                  Giảm 20% cho người mới. Áp dụng cho lần đầu đặt chỗ.
                </span>
              </div>
            </div>

            {/* Sticky Step 1 footer */}
            <div className="card border-0 shadow-lg p-3 rounded-4 bg-white d-flex flex-row justify-content-between align-items-center">
              <div>
                <small className="text-muted d-block">Tổng cộng</small>
                <h5 className="fw-bold m-0" style={{ color: '#164e63' }}>{bookingFee.toLocaleString('vi-VN')}đ</h5>
              </div>
              <button
                type="button"
                onClick={handleNextStep}
                className="btn text-white fw-bold px-4 py-2.5 rounded-3"
                style={{ backgroundColor: '#164e63' }}
              >
                Tiếp tục
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === 2 && (
          <div className="d-flex flex-column gap-4">
            
            {/* Time & License details */}
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <div className="row g-3">
                <div className="col-md-6 border-end border-light">
                  <h6 className="text-muted fw-bold small mb-2 d-flex align-items-center gap-1.5">
                    <span>🕒</span> THỜI GIAN
                  </h6>
                  <p className="text-muted small mb-1">Thời gian đến dự kiến</p>
                  <strong className="text-dark d-block mb-2">{timeSlot}, {formatVietnameseDate(arrivalDate)}</strong>
                  <p className="text-muted m-0" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                    * Slot đặt trước sẽ được giữ tối đa 30 phút. Vui lòng check-in đúng giờ để tránh bị hủy.
                  </p>
                </div>

                <div className="col-md-6 ps-md-4">
                  <h6 className="text-muted fw-bold small mb-2 d-flex align-items-center gap-1.5">
                    <span>🚙</span> THÔNG TIN XE
                  </h6>
                  <p className="text-muted small mb-1">Biển số xe</p>
                  
                  {isEditingPlate ? (
                    <div className="d-flex gap-2">
                      <input 
                        type="text" 
                        className="form-control form-control-sm text-dark fw-bold uppercase"
                        value={licensePlate}
                        onChange={e => setLicensePlate(e.target.value)}
                        onBlur={() => setIsEditingPlate(false)}
                        onKeyDown={e => e.key === 'Enter' && setIsEditingPlate(false)}
                        autoFocus
                      />
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => setIsEditingPlate(false)}>Lưu</button>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-between border rounded p-2.5 bg-light">
                      <strong className="text-dark">{licensePlate}</strong>
                      <button 
                        type="button" 
                        onClick={() => setIsEditingPlate(true)} 
                        className="btn btn-link text-decoration-none p-0 small fw-bold"
                        style={{ color: '#164e63' }}
                      >
                        ✏️
                      </button>
                    </div>
                  )}

                  <div className="row g-2 mt-2">
                    <div className="col-6">
                      <label className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Màu xe</label>
                      <input 
                        type="text" 
                        placeholder="Ví dụ: Xanh, Đỏ"
                        className="form-control form-control-sm text-dark fw-medium"
                        value={vehicleColor}
                        onChange={e => setVehicleColor(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Hiệu xe</label>
                      <input 
                        type="text" 
                        placeholder="Ví dụ: VinFast"
                        className="form-control form-control-sm text-dark fw-medium"
                        value={vehicleBrand}
                        onChange={e => setVehicleBrand(e.target.value)}
                      />
                    </div>
                  </div>

                  <p className="text-muted mt-2 m-0" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                    💡 Hệ thống AI sẽ tự động nhận diện biển số này khi xe vào bãi.
                  </p>
                </div>
              </div>
            </div>

            {/* Thông tin người đặt Form */}
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <h6 className="text-muted fw-bold mb-3 d-flex align-items-center gap-1.5" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                <span>👤</span> THÔNG TIN NGƯỜI ĐẶT
              </h6>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Họ và Tên</label>
                  <input
                    type="text"
                    required
                    className="form-control text-dark fw-medium"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    className="form-control text-dark fw-medium"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

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
            <div className="card border-0 shadow-lg p-3 rounded-4 bg-white d-flex flex-row justify-content-between align-items-center">
              <div>
                <small className="text-muted d-block">Phí giữ chỗ trước</small>
                <h5 className="fw-bold m-0 text-success">Miễn phí</h5>
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
          <div className="card border-0 shadow-lg p-4 p-md-5 rounded-4 bg-white text-center">
            
            <div className="d-flex justify-content-center mb-3">
              <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center shadow-sm animate-pulse" style={{ width: '70px', height: '70px' }}>
                <span className="fs-2">✓</span>
              </div>
            </div>

            <h3 className="fw-bold text-dark mb-1">Đặt chỗ thành công!</h3>
            <p className="text-muted small mb-4">Vui lòng lưu mã QR bên dưới để quét tại cổng vào.</p>

            {/* Dotted Ticket Stub Container */}
            <div className="border border-dashed rounded-4 p-4 mb-4 bg-light position-relative">
              
              {/* Timeout expiration */}
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-1.5 fw-bold mb-4" style={{ fontSize: '0.75rem' }}>
                ⏰ HẾT HẠN LÚC {getExpirationTime()}
              </span>

              {/* QR Code Phone Display Mockup */}
              <div className="d-flex flex-column align-items-center justify-content-center my-3">
                <div 
                  className="bg-white border rounded-4 shadow-sm p-4 d-flex flex-column align-items-center justify-content-center" 
                  style={{ width: '220px', minHeight: '260px' }}
                >
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${confirmedBookingId}`} 
                    alt="Ticket QR Code" 
                    className="img-fluid"
                    style={{ width: '130px', height: '130px', objectFit: 'contain' }}
                  />
                  <strong className="text-dark mt-3 fs-5" style={{ letterSpacing: '1px' }}>{confirmedBookingId}</strong>
                </div>
                
                <button 
                  type="button" 
                  className="btn btn-link text-decoration-none fw-bold mt-3 d-flex align-items-center gap-1.5"
                  style={{ color: '#164e63', fontSize: '0.85rem' }}
                >
                  📥 Tải xuống mã QR
                </button>
              </div>

              {/* Synchronized Lot Price & details */}
              <div className="row g-3 w-100 text-start small border-top pt-4 mt-2">
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>📍 VỊ TRÍ ĐỖ</span>
                  <strong className="text-dark">{selectedBranch?.branchName}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>🚗 PHƯƠNG TIỆN</span>
                  <strong className="text-dark">{selectedVehicleType?.typeName} - {licensePlate}</strong>
                  {(vehicleColor || vehicleBrand) && (
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                      ({[vehicleBrand, vehicleColor].filter(Boolean).join(' - ')})
                    </span>
                  )}
                </div>
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>📅 THỜI GIAN ĐẾN</span>
                  <strong className="text-dark">{timeSlot} - {formatVietnameseDate(arrivalDate)}</strong>
                </div>
                
                {/* Dynamically Syncing lot price from mock API data file! */}
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>💵 PHÍ DỰ KIẾN</span>
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 py-1 px-2.5 fw-bold">
                    {hourlyRate.toLocaleString('vi-VN')}đ/1h
                  </span>
                </div>
              </div>
            </div>

            {/* Check-in steps */}
            <div className="text-start mb-4 p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-2.5" style={{ fontSize: '0.85rem' }}>ℹ️ HƯỚNG DẪN CHECK-IN</h6>
              <ol className="list-unstyled d-flex flex-column gap-2 small text-muted m-0">
                <li className="d-flex gap-2">
                  <span className="badge bg-secondary rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', flexShrink: 0 }}>1</span>
                  <span>Di chuyển đến cổng bãi xe</span>
                </li>
                <li className="d-flex gap-2">
                  <span className="badge bg-secondary rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', flexShrink: 0 }}>2</span>
                  <span>Quét mã QR tại máy ở cổng vào</span>
                </li>
                <li className="d-flex gap-2">
                  <span className="badge bg-secondary rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', flexShrink: 0 }}>3</span>
                  <span>Đỗ xe vào đúng ô đỗ đã được cấp</span>
                </li>
              </ol>
            </div>

            {/* Back action links */}
            <div className="d-flex flex-column gap-2 px-md-4">
              <button
                type="button"
                className="btn btn-outline-secondary fw-bold py-2 rounded-3 w-100"
              >
                🗺️ Xem hướng dẫn đường đi
              </button>
              <button
                type="button"
                onClick={() => navigate('/user-dashboard', { state: { activeTab: 'bookings' } })}
                className="btn text-white fw-bold py-2.5 rounded-3 w-100"
                style={{ backgroundColor: '#164e63' }}
              >
                Quản lý lịch đặt giữ chỗ
              </button>
              
               <button 
                type="button" 
                onClick={async () => {
                  if (createdBookingId) {
                    if (window.confirm('Bạn có chắc chắn muốn hủy lượt đặt giữ chỗ này?')) {
                      try {
                        await parkingApi.cancelBooking(createdBookingId);
                        toast.success('Hủy đặt chỗ thành công!');
                        navigate('/user-dashboard', { state: { activeTab: 'bookings' } });
                      } catch (err) {
                        toast.error('Không thể hủy đặt giữ chỗ vào lúc này!');
                      }
                    }
                  } else {
                    navigate('/');
                  }
                }}
                className="btn btn-link text-danger text-decoration-none fw-bold mt-2 small"
              >
                Hủy đặt chỗ
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
