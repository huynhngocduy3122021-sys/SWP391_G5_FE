import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import staffApi from '../../api/staffApi';
import { CameraFeed } from './GateInPanel';
import ZoneOccupancyTable from './ZoneOccupancyTable';
import SupportPanel from './SupportPanel';

const GATE_ID = 'GATE-04';
const PAY_METHODS = ['CASH', 'VNPAY'];

// Màn "Cổng ra" — khớp ảnh thiết kế (Payment Summary + Captured Entry/Exit)
export default function GateOutPanel() {
  const [cardCode, setCardCode] = useState('');
  const [exitPlate, setExitPlate] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('CASH');
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
      const msg = err.response?.data?.message || err.response?.data || 'Không tìm thấy phiên gửi xe hoạt động cho mã thẻ này!';
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

    // Cảnh báo nếu biển số lúc ra khác biển số lúc vào
    if (activeSession && activeSession.licensePlate !== exitPlate.trim().toUpperCase()) {
      const confirmDiff = window.confirm(
        `Cảnh báo: Biển số lúc vào (${activeSession.licensePlate}) khác biển số thực tế lúc ra (${exitPlate.trim().toUpperCase()}). Bạn có chắc chắn muốn tiếp tục checkout?`
      );
      if (!confirmDiff) return;
    }

    setConfirming(true);
    try {
      const res = await staffApi.confirmExit({
        cardCode: cardCode.trim(),
        plateNumber: exitPlate.trim().toUpperCase(),
        paymentMethod: selectedMethod
      });

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

      if (selectedMethod === 'CASH') {
        toast.success(`Thanh toán tiền mặt thành công! Đã mở barie cho xe ${exitPlate} ra.`);
        setActiveSession(null);
        setCardCode('');
        setExitPlate('');
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', padding: '1.25rem' }}>
      {/* ── Cột trái: camera + ảnh chụp đối chiếu ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CameraFeed label={`LIVE EXIT - ${GATE_ID}`} sub="CAM 01: PLATE RECOGNITION" status="READY" tone="success" />
          <CameraFeed label="CAM 04: WIDE OVERVIEW" sub="CAM 02: OVERVIEW" status="ACTIVE" tone="info" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CapturedShot 
            title="CAPTURED ENTRY (REFERENCE - LÚC VÀO)" 
            plate={activeSession ? activeSession.licensePlate : 'CHƯA CÓ DỮ LIỆU'} 
            vehicleType={activeSession ? `${activeSession.vehicleTypeName} - ${activeSession.vehicleColor} (${activeSession.vehicleBrand})` : 'Vui lòng nhập mã thẻ để tìm kiếm'} 
            imageUrls={activeSession ? activeSession.imageUrls : []}
          />
          <CapturedShot 
            title="CAPTURED EXIT (CURRENT - THỰC TẾ LÚC RA)" 
            plate={exitPlate || 'CHƯA NHẬP'} 
            vehicleType="Ảnh camera thực tế tại cổng ra"
            imageUrls={[]} 
          />
        </div>

        <ZoneOccupancyTable zones={[]} />
      </div>

      {/* ── Cột phải: payment summary + support ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="vin-card">
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '1.25rem', fontSize: '1.1rem' }}>
            📋 THÔNG TIN CHECK-OUT
          </div>

          <div className="vin-field" style={{ marginBottom: '1.25rem' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>CARD CODE (MÃ THẺ)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value)}
                placeholder="Nhập mã thẻ..."
                style={{ flex: 1, fontSize: '1.2rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
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
                <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid #3b82f6', marginBottom: '1rem', color: '#60a5fa' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4, color: '#93c5fd' }}>🎟️ THẺ THÁNG / VIP HỢP LỆ</div>
                  <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>Hệ thống ghi nhận thẻ tháng hoặc VIP còn hiệu lực. <strong style={{ color: '#fff' }}>Khách được miễn phí (Thanh toán = 0đ)</strong>. Không cần thu tiền!</div>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: 'rgba(239,68,68,0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#ef4444' }}>
              ⚠️ Vui lòng tìm kiếm thẻ để nạp phiên gửi xe!
            </div>
          )}

          <div className="vin-field" style={{ marginBottom: '1rem' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>BIỂN SỐ XE THỰC TẾ LÚC RA</label>
            <input
              value={exitPlate}
              onChange={(e) => setExitPlate(e.target.value.toUpperCase())}
              placeholder="Nhập biển số xe thực tế..."
              style={{ fontSize: '1.2rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--vin-border)', margin: '1rem 0' }} />

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

          <button className="vin-btn vin-btn--full" style={{ background: 'var(--vin-success)', color: '#fff', padding: '0.85rem', fontSize: '1rem' }}
            disabled={confirming} onClick={handleConfirm}>
            {confirming ? <span className="vin-spinner" /> : '✅'} {((cardCode || '').startsWith('MONTH-') || (cardCode || '').startsWith('VIP-')) ? 'XÁC NHẬN CHO XE RA (MIỄN PHÍ - 0đ)' : 'XÁC NHẬN & MỞ CỔNG RA'}
          </button>
        </div>

        <SupportPanel plateNumber={exitPlate} gateId={GATE_ID} />
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
              style={{ height: 240, width: 'auto', borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
            />
          ))}
        </div>
      ) : (
        <div style={{
          height: 240, borderRadius: 8, background: 'linear-gradient(135deg, #111827, #1f2937)',
          marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem'
        }}>
          Không có ảnh
        </div>
      )}
      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{plate}</div>
      {vehicleType && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{vehicleType}</div>}
      {matchAccuracy != null && (
        <div style={{ fontSize: '0.75rem', color: 'var(--vin-success)' }}>● {matchAccuracy}% Match</div>
      )}
    </div>
  );
}
