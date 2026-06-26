import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PARKING_LOTS } from '../data/parkingData';

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const passedLot = location.state?.lot;
  const passedVehicle = location.state?.selectedVehicle || 'Ô tô';

  const lot = passedLot || PARKING_LOTS[0] || { 
    name: 'Vinparking Landmark 81', 
    title: 'Vinparking Landmark 81',
    address: 'Bình Thạnh, TP. Hồ Chí Minh', 
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&q=80' 
  };
  const displayLotName = lot.title || lot.name || 'Vinparking Landmark 81';

  const [step, setStep] = useState(1);

  const [vehicle, setVehicle] = useState(passedVehicle);
  const [arrivalDate, setArrivalDate] = useState('2024-05-24');
  const [timeSlot, setTimeSlot] = useState('14:00');
  
  const [licensePlate, setLicensePlate] = useState('51H-123.45');
  const [isEditingPlate, setIsEditingPlate] = useState(false);
  const [fullName, setFullName] = useState(localStorage.getItem('fullName') || 'Nguyễn Văn A');
  const [phoneNumber, setPhoneNumber] = useState('0901 234 567');

  const [paymentMethod, setPaymentMethod] = useState('momo');

  const [confirmedBookingId, setConfirmedBookingId] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    if (step !== 4) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTimeLeft = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const bookingFee = 5000;
  const finalPrice = bookingFee;

  const handleNextStep = () => {
    if (step === 1) setStep(2);
    else if (step === 2) {
      if (!fullName.trim() || !phoneNumber.trim() || !licensePlate.trim()) {
        toast.error('Vui lòng nhập đầy đủ thông tin tài xế!');
        return;
      }
      setStep(3);
    }
  };

  const handleConfirmPayment = () => {
    const bookingId = `VP-${Math.floor(10000 + Math.random() * 90000)}`;
    setConfirmedBookingId(bookingId);
    setStep(4);
    toast.success('Đặt chỗ thành công!');
  };

  const stepsList = [
    { num: 1, label: 'Select Slot' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Payment' },
    { num: 4, label: 'Success' }
  ];

  const primaryColor = '#164e63';

  return (
    <div className="min-vh-100 d-flex justify-content-center" style={{ backgroundColor: '#222', padding: '2rem 1rem' }}>
      <div className="bg-white rounded shadow-lg d-flex flex-column" style={{ width: '100%', maxWidth: step === 4 ? '850px' : '700px', minHeight: '80vh', position: 'relative' }}>
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <button 
            onClick={() => step > 1 && step < 4 ? setStep(step - 1) : navigate('/')} 
            className="btn btn-link text-decoration-none fw-bold d-flex align-items-center gap-2"
            style={{ color: primaryColor, fontSize: '1rem' }}
          >
            <span>←</span> Vinparking
          </button>
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: '1.2rem', color: '#64748b' }}>🔔</span>
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, backgroundColor: primaryColor, color: '#fff' }}>
              <span style={{ fontSize: '0.9rem' }}>👤</span>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="px-5 pt-4 pb-3">
          <div className="d-flex justify-content-between align-items-center position-relative">
            <div className="position-absolute top-50 start-0 end-0 translate-middle-y" style={{ height: '2px', backgroundColor: '#e2e8f0', zIndex: 1, left: '10%', right: '10%' }}></div>
            {stepsList.map((s, idx) => (
              <div key={s.num} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2, flex: 1 }}>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-white mb-2"
                  style={{
                    width: '28px', height: '28px', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: step === s.num ? primaryColor : (step > s.num ? '#e2e8f0' : '#e2e8f0'),
                    color: step === s.num ? '#fff' : '#64748b'
                  }}
                >
                  {s.num}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: step === s.num ? 'bold' : 'normal', color: step === s.num ? primaryColor : '#64748b' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-grow-1 p-4 px-md-5 pb-5" style={{ paddingBottom: '100px' }}>
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="d-flex flex-column gap-4">
              
              <div className="border rounded p-3 d-flex align-items-center gap-3">
                <img src={lot.image} alt={displayLotName} style={{ width: '90px', height: '65px', objectFit: 'cover', borderRadius: '8px' }} />
                <div>
                  <div className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Bãi đỗ xe</div>
                  <div className="fw-bold" style={{ fontSize: '1rem', color: primaryColor }}>{displayLotName}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>📍 {lot.address}</div>
                </div>
              </div>

              <div>
                <h6 className="fw-bold mb-3 text-uppercase" style={{ fontSize: '0.8rem', color: primaryColor }}>Loại phương tiện</h6>
                <div className="row g-3">
                  <div className="col-6">
                    <div 
                      onClick={() => setVehicle('Ô tô')}
                      className="border rounded p-3 text-center cursor-pointer"
                      style={{ 
                        borderColor: vehicle === 'Ô tô' ? '#7dd3fc' : '#e2e8f0', 
                        backgroundColor: vehicle === 'Ô tô' ? '#e0f2fe' : '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="fs-3 mb-1">🚘</div>
                      <div className="fw-bold" style={{ color: primaryColor }}>Ô tô</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div 
                      onClick={() => setVehicle('Xe máy')}
                      className="border rounded p-3 text-center cursor-pointer"
                      style={{ 
                        borderColor: vehicle === 'Xe máy' ? '#7dd3fc' : '#e2e8f0', 
                        backgroundColor: vehicle === 'Xe máy' ? '#e0f2fe' : '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="fs-3 mb-1">🛵</div>
                      <div className="fw-bold" style={{ color: primaryColor }}>Xe máy</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h6 className="fw-bold mb-3 text-uppercase" style={{ fontSize: '0.8rem', color: primaryColor }}>Thời gian đến dự kiến</h6>
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="fw-bold">Hôm nay, 24 Tháng 5</div>
                  <span style={{ color: primaryColor }}>📅</span>
                </div>

                <div className="row g-2 mb-3">
                  {['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map((slot) => (
                    <div className="col-4" key={slot}>
                      <button
                        type="button"
                        onClick={() => setTimeSlot(slot)}
                        className="btn w-100 border py-2 text-center"
                        style={{
                          fontSize: '0.85rem',
                          borderColor: timeSlot === slot ? primaryColor : '#e2e8f0',
                          backgroundColor: timeSlot === slot ? primaryColor : '#fff',
                          color: timeSlot === slot ? '#fff' : '#64748b',
                        }}
                      >
                        {slot}
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" className="btn w-100 border text-center text-muted" style={{ borderStyle: 'dashed !important', fontSize: '0.9rem' }}>
                  🕒 Chọn giờ khác
                </button>
              </div>

              <div className="p-3 rounded" style={{ backgroundColor: '#f8fafc' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <div className="fw-bold" style={{ fontSize: '0.85rem' }}>PHÍ GIỮ CHỖ TRƯỚC: MIỄN PHÍ</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Khách hàng: {vehicle} - {timeSlot}</div>
                  </div>
                  <div className="fw-bold fs-5">{bookingFee.toLocaleString('vi-VN')}đ</div>
                </div>
                <div className="text-muted fst-italic mt-2" style={{ fontSize: '0.75rem' }}>
                  ℹ️ Tiền gửi xe sẽ được tính thực tế theo block thời gian khi bạn check-out tại cổng ra
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 p-3 rounded" style={{ backgroundColor: '#ccfbf1', color: '#0f766e' }}>
                <span className="fw-bold border rounded p-1" style={{ backgroundColor: '#99f6e4', fontSize: '0.7rem' }}>%</span>
                <div>
                  <div className="fw-bold" style={{ fontSize: '0.85rem' }}>Giảm 20% cho người mới</div>
                  <div style={{ fontSize: '0.75rem' }}>Áp dụng cho lần đầu đặt chỗ tại Vinparking</div>
                </div>
                <div className="ms-auto">›</div>
              </div>

            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="d-flex flex-column gap-4">
              
              <div className="border rounded p-3 d-flex align-items-center gap-3">
                <img src={lot.image} alt={displayLotName} style={{ width: '90px', height: '65px', objectFit: 'cover', borderRadius: '8px' }} />
                <div>
                  <div className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Bãi đỗ xe</div>
                  <div className="fw-bold" style={{ fontSize: '1rem', color: primaryColor }}>{displayLotName}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>📍 {lot.address}</div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="border rounded p-3 h-100">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', color: primaryColor }}>
                      <span>🕒</span> THỜI GIAN
                    </h6>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                      <span className="text-muted">Thời gian đến dự kiến</span>
                      <span className="fw-bold">{timeSlot}, Hôm nay, 24 Tháng 5</span>
                    </div>
                    <div className="text-muted mt-3" style={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                      ℹ️ "Slot đặt trước sẽ được giữ tối đa 30 phút kể từ thời gian check-in. Vui lòng check-in đúng giờ để tránh bị hủy đặt chỗ và ghi vi phạm."
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3 h-100">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', color: primaryColor }}>
                      <span>🚙</span> THÔNG TIN XE
                    </h6>
                    <div className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Biển số xe</div>
                    
                    <div className="d-flex align-items-center justify-content-between border rounded p-2 bg-light mb-2">
                      {isEditingPlate ? (
                        <input 
                          type="text" 
                          className="form-control form-control-sm border-0 bg-transparent fw-bold text-dark px-1"
                          value={licensePlate}
                          onChange={e => setLicensePlate(e.target.value)}
                          onBlur={() => setIsEditingPlate(false)}
                          autoFocus
                        />
                      ) : (
                        <span className="fw-bold px-2">{licensePlate}</span>
                      )}
                      <button onClick={() => setIsEditingPlate(true)} className="btn btn-sm btn-link text-dark text-decoration-none p-1">
                        ✏️
                      </button>
                    </div>

                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      ℹ️ Hệ thống AI sẽ tự động nhận diện biển số này khi xe vào bãi.
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', color: primaryColor }}>
                  <span>👤</span> THÔNG TIN NGƯỜI ĐẶT
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Họ và Tên</label>
                    <input type="text" className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Số điện thoại</label>
                    <input type="text" className="form-control" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', color: primaryColor }}>
                  <span>🧾</span> CHI TIẾT TẠM TÍNH
                </h6>
                <div className="d-flex justify-content-between mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
                  <span>Phí giữ chỗ (Booking fee)</span>
                  <span className="fw-bold text-dark">{bookingFee.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="d-flex justify-content-between text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                  <span>Phí tiện ích AI</span>
                  <span className="fw-bold" style={{ color: '#0f766e' }}>Miễn phí</span>
                </div>
                
                <div className="p-2 rounded text-center text-muted" style={{ backgroundColor: '#f8fafc', fontSize: '0.8rem' }}>
                  ℹ️ Bạn có thể hoàn hủy miễn phí trước giờ đặt 30 phút.
                </div>
              </div>

            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h5 className="fw-bold mb-1">Phương thức thanh toán</h5>
              <div className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>Vui lòng chọn phương thức thanh toán phù hợp để hoàn tất đặt chỗ.</div>

              <div className="row g-4">
                <div className="col-md-7">
                  <h6 className="fw-bold text-uppercase mb-3" style={{ fontSize: '0.8rem', color: primaryColor }}>Phương thức gợi ý</h6>
                  
                  <div 
                    onClick={() => setPaymentMethod('momo')}
                    className="border rounded p-3 d-flex justify-content-between align-items-center mb-4 cursor-pointer"
                    style={{ borderColor: paymentMethod === 'momo' ? '#db2777' : '#e2e8f0', backgroundColor: paymentMethod === 'momo' ? '#fdf2f8' : '#fff' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-dark rounded p-2" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#db2777', fontWeight: 'bold' }}>Mo</span>
                      </div>
                      <div>
                        <div className="fw-bold d-flex align-items-center gap-2">Ví MoMo <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.6rem' }}>KHUYÊN DÙNG</span></div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Thanh toán nhanh chóng, an toàn</div>
                      </div>
                    </div>
                    <div className="rounded-circle border" style={{ width: 20, height: 20, border: paymentMethod === 'momo' ? '6px solid #db2777' : '1px solid #cbd5e1' }}></div>
                  </div>

                  <h6 className="fw-bold text-uppercase mb-3" style={{ fontSize: '0.8rem', color: primaryColor }}>Các phương thức khác</h6>
                  <div className="d-flex flex-column gap-3">
                    <div onClick={() => setPaymentMethod('vnpay')} className="border rounded p-3 d-flex justify-content-between align-items-center cursor-pointer">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light border rounded p-2 text-center" style={{ width: 40, height: 40 }}>QR</div>
                        <div>
                          <div className="fw-bold">VNPAY QR</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Quét mã QR từ mọi ứng dụng ngân hàng</div>
                        </div>
                      </div>
                      <div className="rounded-circle border" style={{ width: 20, height: 20, border: paymentMethod === 'vnpay' ? `6px solid ${primaryColor}` : '1px solid #cbd5e1' }}></div>
                    </div>

                    <div onClick={() => setPaymentMethod('card')} className="border rounded p-3 d-flex justify-content-between align-items-center cursor-pointer">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light border rounded p-2 text-center" style={{ width: 40, height: 40 }}>💳</div>
                        <div>
                          <div className="fw-bold">Thẻ Quốc tế</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Visa, Mastercard, JCB</div>
                        </div>
                      </div>
                      <div className="rounded-circle border" style={{ width: 20, height: 20, border: paymentMethod === 'card' ? `6px solid ${primaryColor}` : '1px solid #cbd5e1' }}></div>
                    </div>

                    <div onClick={() => setPaymentMethod('cash')} className="border rounded p-3 d-flex justify-content-between align-items-center cursor-pointer">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light border rounded p-2 text-center" style={{ width: 40, height: 40 }}>💵</div>
                        <div>
                          <div className="fw-bold">Tiền mặt tại quầy</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Thanh toán khi đến nhận chỗ</div>
                        </div>
                      </div>
                      <div className="rounded-circle border" style={{ width: 20, height: 20, border: paymentMethod === 'cash' ? `6px solid ${primaryColor}` : '1px solid #cbd5e1' }}></div>
                    </div>
                  </div>
                </div>

                <div className="col-md-5">
                  <div className="border rounded p-3 mb-3">
                    <h6 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ fontSize: '0.85rem', color: primaryColor }}>
                      <span>🎟️</span> MÃ GIẢM GIÁ
                    </h6>
                    <div className="d-flex gap-2">
                      <input type="text" className="form-control" placeholder="Nhập mã ưu đãi" />
                      <button className="btn text-white fw-bold" style={{ backgroundColor: primaryColor, whiteSpace: 'nowrap' }}>ÁP DỤNG</button>
                    </div>
                  </div>

                  <div className="border rounded p-3">
                    <h6 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ fontSize: '0.85rem', color: primaryColor }}>
                      <span>🧾</span> CHI TIẾT THANH TOÁN
                    </h6>
                    
                    <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                      <span>Tạm tính</span>
                      <span className="fw-bold text-dark">{bookingFee.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                      <span>VAT (10%)</span>
                      <span className="fw-bold text-dark">0đ</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                      <span style={{ color: '#0f766e' }}>Giảm giá mã VP2024</span>
                      <span className="fw-bold" style={{ color: '#0f766e' }}>-0đ</span>
                    </div>
                    
                    <hr className="text-muted opacity-25" />
                    
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <span className="fw-bold">Tổng cộng</span>
                      <div className="text-end">
                        <h4 className="fw-bold m-0" style={{ color: primaryColor }}>{finalPrice.toLocaleString('vi-VN')}đ</h4>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>(Đã bao gồm VAT)</div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-2 mt-3 text-muted p-2" style={{ fontSize: '0.7rem' }}>
                    <span>🛡️</span>
                    <span>Giao dịch được bảo mật bởi chuẩn PCI DSS. Thông tin thẻ của bạn sẽ không được lưu trữ trên hệ thống.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="text-center pt-3">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 60, height: 60, backgroundColor: '#4ade80', color: '#fff', fontSize: '2rem' }}>
                ✓
              </div>
              <h4 className="fw-bold mb-1" style={{ color: primaryColor }}>Đặt chỗ thành công!</h4>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Vui lòng lưu mã QR bên dưới để quét tại cổng vào.</p>

              <div className="row g-4 mt-2 text-start">
                <div className="col-md-6">
                  <div className="border rounded overflow-hidden h-100 d-flex flex-column" style={{ borderColor: '#e2e8f0' }}>
                    <div className="bg-light text-center py-2 fw-bold" style={{ fontSize: '0.75rem', color: primaryColor, letterSpacing: '1px' }}>
                      HẾT HẠN TRONG {formatTimeLeft()}
                    </div>
                    <div className="flex-grow-1 p-4 d-flex flex-column align-items-center justify-content-center position-relative">
                      {/* Realistic phone mockup */}
                      <div className="bg-dark rounded-4 shadow position-relative p-2" style={{ width: '180px', height: '320px', border: '6px solid #1e293b' }}>
                        <div className="bg-white rounded-3 w-100 h-100 d-flex flex-column align-items-center pt-4 px-3 position-relative overflow-hidden">
                          {/* Notch */}
                          <div className="position-absolute bg-dark" style={{ top: 0, left: '50%', transform: 'translateX(-50%)', width: '50px', height: '12px', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}></div>
                          
                          <div className="fw-bold mb-1" style={{ fontSize: '0.6rem' }}>Vinparking</div>
                          <div className="text-muted mb-3" style={{ fontSize: '0.5rem', textAlign: 'center' }}>VÉ: {confirmedBookingId}</div>
                          
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${confirmedBookingId}|${licensePlate}|${lot.id}`} 
                            alt="QR Code" 
                            style={{ width: '100%', aspectRatio: '1/1', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    </div>
                    <button className="btn w-100 rounded-0 py-3 fw-bold text-white" style={{ backgroundColor: primaryColor }}>
                      📥 Tải xuống mã QR
                    </button>
                  </div>
                </div>

                <div className="col-md-6 d-flex flex-column gap-3">
                  <div className="border rounded p-4">
                    <h6 className="fw-bold mb-4" style={{ fontSize: '0.8rem', color: '#64748b' }}>THÔNG TIN ĐẶT CHỖ</h6>
                    
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <span className="text-muted">📍</span>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Vị trí đỗ</div>
                        <div className="fw-bold text-dark">{displayLotName}</div>
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <span className="text-muted">🚗</span>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Phương tiện</div>
                        <div className="fw-bold text-dark">{vehicle} - {licensePlate}</div>
                      </div>
                    </div>

                    <div className="d-flex align-items-start gap-3 mb-3">
                      <span className="text-muted">🕒</span>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Thời gian đến</div>
                        <div className="fw-bold text-dark">{timeSlot} - Hôm nay, 24 Tháng 5</div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded d-flex justify-content-between align-items-center bg-light">
                      <div className="d-flex align-items-center gap-2">
                        <span>💵</span>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Phí dự kiến</span>
                      </div>
                      <div className="fw-bold" style={{ color: primaryColor }}>5.000đ/1h</div>
                    </div>
                  </div>

                  <div className="border rounded p-3 bg-light">
                    <h6 className="fw-bold mb-3" style={{ fontSize: '0.8rem', color: '#64748b' }}>ℹ️ HƯỚNG DẪN CHECK-IN</h6>
                    <div className="d-flex flex-column gap-2" style={{ fontSize: '0.85rem' }}>
                      <div className="d-flex gap-2">
                        <span className="rounded-circle bg-dark text-white d-inline-flex align-items-center justify-content-center" style={{ width: 20, height: 20, fontSize: '0.7rem' }}>1</span>
                        <span>Di chuyển đến cổng bãi xe</span>
                      </div>
                      <div className="d-flex gap-2">
                        <span className="rounded-circle bg-dark text-white d-inline-flex align-items-center justify-content-center" style={{ width: 20, height: 20, fontSize: '0.7rem' }}>2</span>
                        <span>Quét mã QR tại máy</span>
                      </div>
                      <div className="d-flex gap-2">
                        <span className="rounded-circle bg-dark text-white d-inline-flex align-items-center justify-content-center" style={{ width: 20, height: 20, fontSize: '0.7rem' }}>3</span>
                        <span>Đỗ vào đúng bãi</span>
                      </div>
                    </div>
                  </div>

                  <button className="btn btn-outline-secondary w-100 fw-bold py-2 mt-2" style={{ color: primaryColor, borderColor: '#cbd5e1' }}>
                    ▲ Xem hướng dẫn đường đi
                  </button>
                  <button className="btn btn-link text-danger text-decoration-none p-0 mt-1" onClick={() => navigate('/')}>
                    Hủy đặt chỗ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        {step < 4 && (
          <div className="position-absolute bottom-0 start-0 w-100 border-top bg-white p-3 d-flex justify-content-between align-items-center rounded-bottom" style={{ zIndex: 10 }}>
            <div className="ps-3">
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>Tổng cộng</div>
              <div className="fw-bold fs-5" style={{ color: primaryColor }}>{step === 3 ? finalPrice.toLocaleString('vi-VN') : bookingFee.toLocaleString('vi-VN')}đ</div>
            </div>
            <button 
              onClick={step === 3 ? handleConfirmPayment : handleNextStep}
              className="btn text-white fw-bold px-4 py-2"
              style={{ backgroundColor: primaryColor }}
            >
              {step === 3 ? 'Xác nhận thanh toán' : (step === 2 ? 'Xác nhận' : 'Tiếp tục')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
