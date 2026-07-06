import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import staffApi from '../../api/staffApi';
import parkingApi from '../../api/parkingApi';
import managerApi from '../../api/manager';
import { CameraFeed } from './GateInPanel';
import ZoneOccupancyTable from './ZoneOccupancyTable';
import SupportPanel from './SupportPanel';

const GATE_ID = 'GATE-04';
const PAY_METHODS = ['CASH', 'VNPAY'];

const fmtMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN');

const getVehicleTypeId = (item) =>
  item?.vehicleTypeId || item?.vehicleType?.vehicleTypeId || item?.vehicleType?.id;

const getVehicleTypeName = (item) =>
  item?.vehicleTypeName || item?.typeName || item?.vehicleType?.vehicleTypeName || item?.vehicleType?.typeName || item?.vehicleType?.name;

const getBranchId = (item) =>
  item?.parkingBranchId || item?.parkingBranch?.parkingBranchId || item?.parkingBranch?.branchId || item?.parkingBranch?.id;

const getSessionAmount = (session) => {
  const amount = session?.totalAmount ?? session?.parkingFee ?? session?.parkingFeeAmount ?? session?.amount ?? session?.fee;
  return amount === undefined || amount === null || amount === '' ? null : Number(amount);
};

const isPackagePolicy = (policy) => {
  const name = policy?.policyName || '';
  return name.startsWith('[Gói Tháng]') || name.startsWith('[Gói VIP President]');
};

const calculateParkingFee = (policy, durationMinutes) => {
  if (!policy) return null;

  const basePrice = Number(policy.basePrice ?? policy.hourlyRate ?? policy.price ?? policy.firstBlockPrice ?? 0);
  const baseDuration = Number(policy.baseDurationMinutes || 60);
  const extraHourPrice = Number(policy.extraHourPrice ?? policy.hourlyRate ?? basePrice);

  if (!basePrice || !durationMinutes) return 0;
  if (durationMinutes <= baseDuration) return basePrice;

  const extraMinutes = durationMinutes - baseDuration;
  return basePrice + Math.ceil(extraMinutes / 60) * extraHourPrice;
};

// Màn "Cổng ra" — khớp ảnh thiết kế (Payment Summary + Captured Entry/Exit)
export default function GateOutPanel() {
  const [cardCode, setCardCode] = useState('');
  const [exitPlate, setExitPlate] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [exitImages, setExitImages] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('CASH');
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pricePolicies, setPricePolicies] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    // Đồng thời hiển thị ảnh preview bên CapturedShot
    setExitImages(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const data = await managerApi.getAllZones();
        const zoneList = Array.isArray(data) ? data : (data?.content || []);
        const formatted = zoneList.map(z => {
          const used = z.capacity - z.availableCapacity;
          return {
            category: z.zoneName,
            current: used,
            max: z.capacity,
            status: z.availableCapacity === 0 ? 'FULL' : 'NORMAL',
            flowPerHour: Math.max(1, Math.round(used / 4))
          };
        });
        setZones(formatted);
      } catch (err) {
        console.error("Failed to fetch zones for table:", err);
      }
    };
    fetchZones();
    const interval = setInterval(fetchZones, 10000);
    return () => clearInterval(interval);
  }, []);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const loadPricePolicies = async () => {
      try {
        const policies = await parkingApi.getAllPricePolicies();
        setPricePolicies(Array.isArray(policies) ? policies : []);
      } catch (err) {
        console.error('Error loading price policies:', err);
      }
    };

    loadPricePolicies();
  }, []);

  useEffect(() => {
    if (searchParams.has('vnp_ResponseCode')) {
      const verifyPayment = async () => {
        try {
          const params = Object.fromEntries(searchParams.entries());
          const res = await staffApi.verifyVnPayReturn(params);
          if (res.success) {
            toast.success(`Thanh toán qua VNPay thành công! Phiên gửi xe đã kết thúc.`);
          } else {
            toast.error(`Thanh toán thất bại: ${res.message || 'Lỗi chưa xác định'}`);
          }
        } catch (err) {
          console.error(err);
          const msg = err.response?.data?.message || err.response?.data || 'Lỗi hệ thống khi xác thực thanh toán!';
          toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối server!');
        } finally {
          // Clear query params to clean URL and prevent double callbacks
          navigate('/staff/exit', { replace: true });
        }
      };
      verifyPayment();
    }
  }, [searchParams, navigate]);

  const handleSearch = async () => {
    if (!cardCode.trim()) {
      toast.error('Vui lòng nhập mã thẻ để tìm kiếm!');
      return;
    }
    setSearching(true);
    try {
      const session = await staffApi.getActiveSessionByCardCode(cardCode.trim());
      setActiveSession(session);
      setExitPlate(session.licensePlate); // Tự động điền biển số lúc ra khớp lúc vào để đỡ gõ
      
      toast.success('Tìm thấy phiên gửi xe hoạt động!');
    } catch (err) {
      console.error(err);
      setActiveSession(null);
      setExitImages([]);
      const msg = err.response?.data?.message || err.response?.data || 'Không tìm thấy phiên gửi xe hoạt động cho mã thẻ này!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối server!');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchByPlate = async () => {
    if (!exitPlate.trim()) {
      toast.error('Vui lòng nhập biển số xe để tìm kiếm!');
      return;
    }
    setSearching(true);
    try {
      const session = await staffApi.getActiveSessionByLicensePlate(exitPlate.trim());
      setActiveSession(session);
      setCardCode(session.cardCode || session.parkingCard?.cardCode || 'Không rõ'); 
      
      toast.success('Tìm thấy phiên gửi xe bằng biển số!');
    } catch (err) {
      console.error(err);
      setActiveSession(null);
      setExitImages([]);
      const msg = err.response?.data?.message || err.response?.data || 'Không tìm thấy phiên gửi xe hoạt động cho biển số này!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối server!');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (!cardCode.trim()) {
      toast.error('Vui lòng nhập mã thẻ!');
      return;
    }
    if (!exitPlate.trim()) {
      toast.error('Vui lòng nhập biển số xe thực tế lúc ra!');
      return;
    }
    
    if (selectedFiles.length === 0) {
      toast.error('Vui lòng chụp/tải lên ít nhất 1 ảnh phương tiện lúc ra để AI kiểm tra!');
      return;
    }

    // Cảnh báo nếu biển số lúc ra khác biển số lúc vào
    if (activeSession && activeSession.licensePlate !== exitPlate.trim().toUpperCase()) {
      const confirmDiff = window.confirm(
        `Cảnh báo: Biển số lúc vào (${activeSession.licensePlate}) khác biển số thực tế lúc ra (${exitPlate.trim().toUpperCase()}). Bạn có chắc chắn muốn tiếp tục checkout?`
      );
      if (!confirmDiff) return;
    }

    setConfirming(true);
    try {
      const verifyRes = await staffApi.verifyLicensePlate(exitPlate.trim().toUpperCase(), selectedFiles[0]);
      if (verifyRes.matched) {
        toast.success(`AI: ${verifyRes.message}`);
      } else {
        toast.error(`AI Cảnh báo: ${verifyRes.message}`);
        setConfirming(false);
        return;
      }

      const res = await staffApi.confirmExit({
        cardCode: cardCode.trim(),
        plateNumber: exitPlate.trim().toUpperCase(),
        paymentMethod: selectedMethod
      });
      const paidAmount = getSessionAmount(res) ?? parkingCharge?.amount;

      // Tự động đưa thẻ về trạng thái AVAILABLE (còn trống) đối với TẤT CẢ CÁC THẺ sau khi checkout xong
      try {
        const cleanCode = cardCode.trim().toUpperCase();
        const cardsData = await managerApi.getParkingCards();
        const parsedCards = Array.isArray(cardsData) ? cardsData : [];
        const matchedCard = parsedCards.find(c => (c.cardCode || '').trim().toUpperCase() === cleanCode);
        if (matchedCard) {
          const type = cleanCode.startsWith('VIP-') ? 'VIP' : cleanCode.startsWith('MONTH-') ? 'MONTHLY' : 'REGULAR';
          await managerApi.updateParkingCard(matchedCard.parkingCardId, {
            cardCode: matchedCard.matchedCard || matchedCard.cardCode,
            parkingBranchId: Number(matchedCard.parkingBranchId),
            status: 'AVAILABLE',
            type: type
          });
        }
      } catch (err) {
        console.warn("Failed to reset card status to AVAILABLE during checkout:", err);
      }

      if (selectedFiles.length > 0 && activeSession?.parkingSessionId) {
        try {
          await staffApi.uploadVehicleImages(activeSession.parkingSessionId, 'CHECK_OUT', selectedFiles);
        } catch (uploadErr) {
          console.warn("Upload exit image failed:", uploadErr);
        }
      }

      if (selectedMethod === 'CASH' || isPackageCard) {
        const msg = isPackageCard
          ? `✅ Thẻ ${cardCode.startsWith('VIP-') ? 'VIP' : 'Tháng'} hợp lệ — Xe ${exitPlate} ra cổng MIỄN PHÍ!`
          : `Thanh toán tiền mặt ${fmtMoney(paidAmount)}đ thành công! Đã mở barie cho xe ${exitPlate} ra.`;
        toast.success(msg);
        setActiveSession(null);
        setCardCode('');
        setExitPlate('');
        setExitImages([]);
        setSelectedFiles([]);
      } else if (selectedMethod === 'VNPAY') {
        if (res.paymentUrl) {
          toast.info('Đang mở trang thanh toán VNPay...');
          window.open(res.paymentUrl, '_blank');
        } else {
          toast.success('Giao dịch VNPay đã được khởi tạo.');
        }
      }
    } catch (err) {
      console.error("Check-out Error:", err.response?.data || err.message);
      let errorStr = 'Lỗi server khi check-out!';
      if (err.message === 'Network Error') {
        errorStr = 'Không thể kết nối tới Backend. Hãy chắc chắn Spring Boot đang chạy ở port 8081!';
      } else {
        const msg = err.response?.data;
        if (typeof msg === 'string' && msg.trim() !== '') {
          errorStr = msg;
        }
      }
      toast.error(errorStr);
    } finally {
      setConfirming(false);
    }
  };

  const parkingCharge = useMemo(() => {
    if (!activeSession) return null;

    const checkIn = activeSession.checkInTime ? new Date(activeSession.checkInTime) : null;
    const durationMinutes = checkIn && !Number.isNaN(checkIn.getTime())
      ? Math.max(1, Math.ceil((Date.now() - checkIn.getTime()) / 60000))
      : 0;

    const sessionAmount = getSessionAmount(activeSession);
    const sessionVehicleTypeId = getVehicleTypeId(activeSession);
    const sessionVehicleTypeName = (getVehicleTypeName(activeSession) || '').toLowerCase();
    const sessionBranchId = getBranchId(activeSession);

    const hourlyPolicies = pricePolicies.filter(policy => !isPackagePolicy(policy));
    const matchedPolicy =
      hourlyPolicies.find(policy =>
        String(getVehicleTypeId(policy)) === String(sessionVehicleTypeId) &&
        getBranchId(policy) &&
        String(getBranchId(policy)) === String(sessionBranchId)
      ) ||
      hourlyPolicies.find(policy => String(getVehicleTypeId(policy)) === String(sessionVehicleTypeId)) ||
      hourlyPolicies.find(policy => {
        const policyVehicleTypeName = (getVehicleTypeName(policy) || '').toLowerCase();
        return sessionVehicleTypeName && policyVehicleTypeName === sessionVehicleTypeName;
      });

    const calculatedAmount = calculateParkingFee(matchedPolicy, durationMinutes);

    return {
      amount: sessionAmount ?? calculatedAmount,
      durationMinutes,
      policy: matchedPolicy,
      isBackendAmount: sessionAmount !== null,
    };
  }, [activeSession, pricePolicies]);

  // Kiểm tra thẻ tháng hoặc VIP (miễn phí, không cần thu tiền)
  const isPackageCard = (cardCode || '').startsWith('MONTH-') || (cardCode || '').startsWith('VIP-');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', padding: '1.25rem' }}>
      {/* ── Cột trái: camera + ảnh chụp đối chiếu ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CapturedShot 
            title="CAPTURED ENTRY (REFERENCE - LÚC VÀO)" 
            plate={activeSession ? activeSession.licensePlate : 'CHƯA CÓ DỮ LIỆU'} 
            vehicleType={activeSession ? `${activeSession.vehicleTypeName} - ${activeSession.vehicleColor || 'Không rõ'} (${activeSession.vehicleBrand || 'Không rõ'})` : 'Vui lòng nhập mã thẻ để tìm kiếm'} 
            imageUrls={activeSession ? activeSession.imageUrls : []}
          />
          <CapturedShot 
            title="CAPTURED EXIT (CURRENT - THỰC TẾ LÚC RA)" 
            plate={exitPlate || 'CHƯA NHẬP'} 
            vehicleType={selectedFiles.length > 0 ? "Hình ảnh đã upload" : "Hình ảnh upload lên"}
            imageUrls={exitImages} 
          />
        </div>

        <ZoneOccupancyTable zones={zones} />
      </div>

      {/* ── Cột phải: payment summary + support ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="vin-card">
          <div style={{ fontWeight: 700, color: 'var(--vin-text-main)', marginBottom: '1.25rem', fontSize: '1.1rem' }}>
            📋 THÔNG TIN CHECK-OUT
          </div>

          <div className="vin-field" style={{ marginBottom: '1.25rem' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>CARD CODE (MÃ THẺ)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value)}
                placeholder="Nhập mã thẻ..."
                style={{ flex: 1, fontSize: '1.2rem', fontWeight: 700, background: 'var(--vin-bg-light)', color: 'var(--vin-text-main)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button 
                type="button"
                className="vin-btn vin-btn--primary"
                onClick={handleSearch}
                disabled={searching}
                style={{ padding: '0 1rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
              >
                {searching ? <span className="vin-spinner" /> : '🔍 Tìm'}
              </button>
            </div>
          </div>

          {activeSession ? (
            <>
              <div style={{ background: 'rgba(34,197,94,0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  🟢 ĐÃ TÌM THẤY PHIÊN GỬI XE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                  <div><strong>Biển số lúc vào:</strong> {activeSession.licensePlate}</div>
                  <div><strong>Loại xe:</strong> {activeSession.vehicleTypeName}</div>
                  <div><strong>Màu xe:</strong> {activeSession.vehicleColor || 'Không rõ'}</div>
                  <div><strong>Hiệu xe:</strong> {activeSession.vehicleBrand || 'Không rõ'}</div>
                  <div><strong>Giờ vào:</strong> {new Date(activeSession.checkInTime).toLocaleString()}</div>
                </div>
              </div>

              {((cardCode || '').startsWith('MONTH-') || (cardCode || '').startsWith('VIP-')) && (
                <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid #3b82f6', marginBottom: '1rem', color: 'var(--vin-primary)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4, color: 'var(--vin-primary)' }}>🎟️ THẺ THÁNG / VIP HỢP LỆ</div>
                  <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>Hệ thống ghi nhận thẻ tháng hoặc VIP còn hiệu lực. <strong style={{ color: 'var(--vin-text-main)' }}>Khách được miễn phí (Thanh toán = 0đ)</strong>. Không cần thu tiền!</div>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: 'rgba(239,68,68,0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#ef4444' }}>
              ⚠️ Vui lòng tìm kiếm thẻ để nạp phiên gửi xe!
            </div>
          )}

          <div className="vin-field" style={{ marginBottom: '1rem' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>BIỂN SỐ XE THỰC TẾ LÚC RA (TÌM KHI MẤT THẺ)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={exitPlate}
                onChange={(e) => setExitPlate(e.target.value.toUpperCase())}
                placeholder="Nhập biển số xe thực tế..."
                style={{ flex: 1, fontSize: '1.2rem', fontWeight: 700, background: 'var(--vin-bg-light)', color: 'var(--vin-text-main)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button 
                type="button"
                className="vin-btn vin-btn--primary"
                onClick={handleSearchByPlate}
                disabled={searching}
                style={{ padding: '0 1rem', fontSize: '0.9rem', whiteSpace: 'nowrap', background: 'var(--vin-primary)' }}
              >
                {searching ? <span className="vin-spinner" /> : '🔍 Tìm Biển Số'}
              </button>
            </div>
          </div>

          <div className="vin-field" style={{ marginBottom: '1rem' }}>
            <label>VEHICLE IMAGES (HÌNH ẢNH LÚC RA)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);
                  setSelectedFiles((prev) => {
                    const filtered = newFiles.filter(
                      nf => !prev.some(pf => pf.name === nf.name && pf.size === nf.size)
                    );
                    return [...prev, ...filtered];
                  });
                  e.target.value = '';
                }
              }}
              style={{ padding: '0.5rem', background: 'var(--vin-bg-light)', width: '100%', marginBottom: '0.5rem' }}
            />
            {selectedFiles.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  Danh sách ảnh đã chọn ({selectedFiles.length}):
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '120px', overflowY: 'auto' }}>
                  {selectedFiles.map((file, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', padding: '2px 0' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                        📷 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '0.85rem', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--vin-border)', margin: '1rem 0' }} />

          {/* Ẩn phí khi là thẻ Tháng / VIP */}
          {activeSession && !isPackageCard && (
            <div style={{ background: 'rgba(14,165,233,0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(14,165,233,0.25)', marginBottom: '1rem' }}>
              <div style={{ color: 'var(--vin-primary)', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                💵 TẠM TÍNH PHÍ ĐẬU XE
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.75rem' }}>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  <div>Thời gian gửi: <strong style={{ color: 'var(--vin-text-main)' }}>{parkingCharge?.durationMinutes || 0} phút</strong></div>
                  <div>Chính sách: <strong style={{ color: 'var(--vin-text-main)' }}>{parkingCharge?.policy?.policyName || 'Chưa có bảng giá'}</strong></div>
                  {!parkingCharge?.isBackendAmount && parkingCharge?.policy && (
                    <div>
                      Giá cơ bản: {fmtMoney(parkingCharge.policy.basePrice)}đ / {parkingCharge.policy.baseDurationMinutes || 60} phút
                    </div>
                  )}
                </div>
                <div style={{ color: 'var(--vin-text-main)', fontWeight: 900, fontSize: '1.5rem', whiteSpace: 'nowrap' }}>
                  {parkingCharge?.amount !== null && parkingCharge?.amount !== undefined
                    ? `${fmtMoney(parkingCharge.amount)}đ`
                    : 'Chưa có giá'}
                </div>
              </div>
              {!parkingCharge?.policy && parkingCharge?.amount === null && (
                <div style={{ marginTop: '0.6rem', color: '#fbbf24', fontSize: '0.78rem' }}>
                  Chưa tìm thấy chính sách giá cho loại xe này. Vui lòng cấu hình trong Manager &gt; Settings.
                </div>
              )}
            </div>
          )}

          {/* Ẩn phương thức thanh toán khi là thẻ Tháng / VIP */}
          {!isPackageCard && (
            <>
              <div style={{ marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>
                PHƯƠNG THỨC THANH TOÁN
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {PAY_METHODS.map((m) => (
                  <button key={m} 
                    className={`vin-btn vin-btn--sm ${selectedMethod === m ? 'vin-btn--primary' : 'vin-btn--secondary'}`}
                    onClick={() => setSelectedMethod(m)}
                    style={{ py: '0.75rem', fontWeight: 600 }}
                  >
                    {m === 'CASH' ? '💵 TIỀN MẶT' : '📱 VNPAY'}
                  </button>
                ))}
              </div>
            </>
          )}

          <button className="vin-btn vin-btn--full" style={{ background: 'var(--vin-success)', color: 'var(--vin-text-main)', padding: '0.85rem', fontSize: '1rem' }}
            disabled={confirming} onClick={handleConfirm}>
            {confirming ? <span className="vin-spinner" /> : '✅'} {((cardCode || '').startsWith('MONTH-') || (cardCode || '').startsWith('VIP-')) ? 'XÁC NHẬN CHO XE RA (MIỄN PHÍ - 0đ)' : 'XÁC NHẬN & MỞ CỔNG RA'}
          </button>
        </div>

        <SupportPanel plateNumber={exitPlate} gateId={GATE_ID} activeSession={activeSession} />
      </div>
    </div>
  );
}

function CapturedShot({ title, plate, vehicleType, matchAccuracy, imageUrls }) {
  return (
    <div className="vin-card" style={{ padding: '0.75rem' }}>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>{title}</div>
      {imageUrls && imageUrls.length > 0 ? (
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', marginBottom: '0.5rem', height: 240 }}>
          {imageUrls.map((url, i) => (
            <img 
              key={i} 
              src={url} 
              alt={`captured-${i}`} 
              style={{ height: 240, width: 'auto', borderRadius: 8, objectFit: 'contain', backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)' }} 
            />
          ))}
        </div>
      ) : (
        <div style={{
          height: 240, borderRadius: 8, background: 'var(--vin-bg-card)',
          marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem'
        }}>
          Không có ảnh
        </div>
      )}
      <div style={{ fontWeight: 700, color: 'var(--vin-text-main)', fontSize: '0.95rem' }}>{plate}</div>
      {vehicleType && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{vehicleType}</div>}
      {matchAccuracy != null && (
        <div style={{ fontSize: '0.75rem', color: 'var(--vin-success)' }}>● {matchAccuracy}% Match</div>
      )}
    </div>
  );
}
