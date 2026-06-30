import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import staffApi from '../../api/staffApi';
import parkingApi from '../../api/parkingApi';
import managerApi from '../../api/manager';
import ZoneOccupancyTable from './ZoneOccupancyTable';
import SupportPanel from './SupportPanel';

const GATE_ID = 'GATE-04';

// Màn "Vận hành Cổng VÀO" — khớp ảnh thiết kế (AI Smart Allocation + Issue Card)
export default function GateInPanel() {
  const [isBooking, setIsBooking] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  
  // Dữ liệu camera AI trả về — mock theo ảnh, thay bằng staffApi.getLiveEntryDetection(GATE_ID)
  const [detected] = useState({ plateNumber: '', entryTime: '' });
  const [licensePlate, setLicensePlate] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [zones, setZones] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  const fetchStatsData = async () => {
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

    try {
      const data = await managerApi.getAllSessions();
      const sessionList = Array.isArray(data) ? data : (data?.content || []);
      const sorted = sessionList
        .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
        .slice(0, 6);
      setRecentSessions(sorted);
    } catch (err) {
      console.error("Failed to fetch recent sessions:", err);
    }
  };

  useEffect(() => {
    fetchStatsData();
    const interval = setInterval(fetchStatsData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const types = await staffApi.getVehicleTypes();
        setVehicleTypes(types);
        if (types && types.length > 0) {
          setVehicleTypeId(types[0].vehicleTypeId);
        }
      } catch (err) {
        console.error(err);
        toast.error('Không tải được danh sách loại xe từ server!');
      }
    };
    fetchVehicleTypes();
  }, []);

  useEffect(() => {
    if (detected.plateNumber) {
      setLicensePlate(detected.plateNumber);
    }
  }, [detected.plateNumber]);

  useEffect(() => {
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleSuggest = async () => {
    try {
      const selectedType = vehicleTypes.find(t => String(t.vehicleTypeId) === String(vehicleTypeId));
      const vehicleTypeName = selectedType ? selectedType.typeName : 'Sedan / SUV';
      const res = await staffApi.suggestSlotAllocation(licensePlate, vehicleTypeName);
      setSuggestion(res);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Không lấy được gợi ý vị trí từ AI!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối AI!');
    }
  };

  const handleLookupBooking = async () => {
    if (!bookingCode.trim()) {
      toast.error('Vui lòng nhập mã đặt chỗ!');
      return;
    }
    try {
      const res = await parkingApi.getBookingByCode(bookingCode.trim());
      if (res) {
        setLicensePlate(res.licensePlate || '');
        if (res.vehicleTypeId) {
          setVehicleTypeId(res.vehicleTypeId);
        }
        
        // Cố gắng lấy từ nhiều tên thuộc tính khác nhau để đảm bảo không bị sót nếu backend đổi tên field
        setVehicleColor(res.vehicleColor || res.color || '');
        setVehicleBrand(res.vehicleBrand || res.brand || '');
        
        toast.success(`Tìm thấy đặt chỗ xe ${res.licensePlate} (${res.vehicleTypeName || 'Ô tô/Xe máy'})!`);
      }
    } catch (err) {
      console.error("Lookup Booking Error:", err);
      const msg = err.response?.data?.message || 'Không tìm thấy thông tin đặt chỗ!';
      toast.error(msg);
    }
  };

  const handleConfirm = async () => {
    if (isBooking && !bookingCode.trim()) {
      toast.error('Vui lòng nhập mã đặt chỗ!');
      return;
    }
    if (!licensePlate) {
      toast.error('Vui lòng nhập biển số xe!');
      return;
    }
    if (!cardCode) {
      toast.error('Vui lòng nhập mã thẻ!');
      return;
    }
    if (!vehicleTypeId) {
      toast.error('Vui lòng chọn loại xe!');
      return;
    }
    setSubmitting(true);
    try {
      let parkingSessionId;
      
      if (isBooking) {
        const checkInResult = await parkingApi.checkInBooking(bookingCode.trim(), cardCode.trim());
        parkingSessionId = checkInResult.parkingSessionId;
      } else {
        const checkInResult = await staffApi.confirmEntry({
          licensePlate: licensePlate.trim().replace(/[^A-Za-z0-9\-.]/g, ''),
          vehicleTypeId: Number(vehicleTypeId),
          cardCode: cardCode.trim(),
          vehicleColor: vehicleColor.trim(),
          vehicleBrand: vehicleBrand.trim()
        });
        parkingSessionId = checkInResult.parkingSessionId;
      }

      if (selectedFiles.length > 0 && parkingSessionId) {
        await staffApi.uploadVehicleImages(parkingSessionId, 'CHECK_IN', selectedFiles);
      }

      toast.success(`Đã cấp thẻ & mở barie cho ${licensePlate}!`);
      setSelectedFiles([]);
      setCardCode('');
      setLicensePlate('');
      if (isBooking) {
        setBookingCode('');
      }
      fetchStatsData();
    } catch (err) {
      console.error("Check-in Error:", err.response?.data || err.message);
      let errorStr = 'Lỗi server khi check-in!';
      if (err.message === 'Network Error') {
        errorStr = 'Không thể kết nối tới Backend. Hãy chắc chắn Spring Boot đang chạy ở port 8081!';
      } else {
        const msg = err.response?.data?.message || err.response?.data;
        if (typeof msg === 'string' && msg.trim() !== '') {
          errorStr = msg;
        }
      }
      toast.error(errorStr);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', padding: '1.25rem' }}>
      {/* ── Cột trái: camera + form nhận xe ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <CameraFeed 
          label={`LIVE ENTRY - ${GATE_ID}`} 
          sub="CAM 01: PLATE RECOGNITION" 
          status="READY" 
          tone="success" 
          imageUrl={previewUrls.length > 0 ? previewUrls[0] : null}
        />

        <div className="vin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
              ⚙️ Vehicle Details
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`vin-btn vin-btn--sm ${!isBooking ? 'vin-btn--primary' : 'vin-btn--secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px' }}
                onClick={() => setIsBooking(false)}
              >
                Khách vãng lai
              </button>
              <button
                type="button"
                className={`vin-btn vin-btn--sm ${isBooking ? 'vin-btn--primary' : 'vin-btn--secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px' }}
                onClick={() => setIsBooking(true)}
              >
                Đã đặt trước (Booking)
              </button>
            </div>
          </div>

          {isBooking && (
            <div className="vin-field" style={{ marginBottom: '0.75rem' }}>
              <label>BOOKING CODE (MÃ ĐẶT CHỖ)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  placeholder="Nhập mã đặt chỗ..."
                  style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)' }}
                />
                <button
                  type="button"
                  className="vin-btn vin-btn--primary"
                  onClick={handleLookupBooking}
                  style={{ whiteSpace: 'nowrap', padding: '0 1rem' }}
                >
                  Tra cứu
                </button>
              </div>
            </div>
          )}

          <div className="vin-field" style={{ marginBottom: '0.75rem' }}>
            <label>LICENSE PLATE (BIỂN SỐ XE)</label>
            <input
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              style={{ fontSize: '1.1rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)' }}
            />
          </div>

          <div className="vin-field" style={{ marginBottom: '0.75rem' }}>
            <label>CARD CODE (QUẸT THẺ)</label>
            <input
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value)}
              style={{ fontSize: '1.1rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="vin-field">
              <label>VEHICLE COLOR (MÀU XE)</label>
              <input value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} />
            </div>
            <div className="vin-field">
              <label>VEHICLE BRAND (HIỆU XE)</label>
              <input value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="vin-field">
              <label>ENTRY TIME (THỜI GIAN VÀO)</label>
              <input value={detected.entryTime} readOnly style={{ opacity: 0.7 }} />
            </div>
            <div className="vin-field">
              <label>VEHICLE TYPE (LOẠI XE)</label>
              <select value={vehicleTypeId} onChange={(e) => setVehicleTypeId(e.target.value)}>
                {vehicleTypes.map((type) => (
                  <option key={type.vehicleTypeId} value={type.vehicleTypeId}>
                    {type.typeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="vin-field" style={{ marginBottom: '1rem' }}>
            <label>VEHICLE IMAGES (HÌNH ẢNH PHƯƠNG TIỆN)</label>
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
              style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', width: '100%', marginBottom: '0.5rem' }}
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
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '0.85rem', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button className="vin-btn vin-btn--full" style={{ background: 'var(--vin-success)', color: '#fff' }}
            disabled={submitting} onClick={handleConfirm}>
            {submitting ? <span className="vin-spinner" /> : '⚡'} ISSUE CARD & OPEN BARRIER
          </button>
        </div>

        <ZoneOccupancyTable zones={zones} />
      </div>

      {/* ── Cột phải: Hỗ trợ ngoại lệ + Lượt xe gần đây ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* SupportPanel (Exception Handling) */}
        <SupportPanel plateNumber={detected.plateNumber || licensePlate} gateId={GATE_ID} />

        {/* Bảng các lượt gửi xe gần đây */}
        <div className="vin-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--vin-border)', paddingBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
              🚗 LƯỢT XE GỬI GẦN ĐÂY
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
              Mới nhất
            </span>
          </div>

          <div className="vin-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="vin-table" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px' }}>BIỂN SỐ</th>
                  <th style={{ padding: '6px' }}>THỜI GIAN</th>
                  <th style={{ padding: '6px' }}>LOẠI XE</th>
                  <th style={{ padding: '6px' }}>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '1rem' }}>
                      Chưa có lượt gửi xe nào gần đây
                    </td>
                  </tr>
                ) : (
                  recentSessions.map((s, idx) => {
                    const checkInTimeStr = s.checkInTime ? new Date(s.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
                    const isActive = s.sessionStatus === 'ACTIVE' || (!s.checkOutTime && s.checkInTime);
                    return (
                      <tr key={s.parkingSessionId || idx}>
                        <td style={{ padding: '8px 6px', fontWeight: 700, color: '#38bdf8' }}>{s.licensePlate}</td>
                        <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.6)' }}>{checkInTimeStr}</td>
                        <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.6)' }}>{s.vehicleTypeName || s.vehicleType?.typeName || 'Xe máy'}</td>
                        <td style={{ padding: '8px 6px' }}>
                          <span className={`vin-badge ${isActive ? 'vin-badge--success' : 'vin-badge--info'}`} style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                            {isActive ? 'Đang đỗ' : 'Đã ra'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Khung camera dùng chung cho cả entry/exit feed
export function CameraFeed({ label, sub, status = 'READY', tone = 'success', imageUrl }) {
  return (
    <div className="vin-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.5rem 0.85rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)',
      }}>
        <span>📷 {label}</span>
        <span className={`vin-badge ${tone === 'success' ? 'vin-badge--success' : 'vin-badge--info'}`}>{status}</span>
      </div>
      <div style={{
        height: 220, background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #0b1120, #111827)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', borderTop: '1px solid var(--vin-border)',
      }}>
        {!imageUrl && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>{sub}</span>}
        <span style={{
          position: 'absolute', bottom: 10, left: 10, fontSize: '0.7rem',
          color: '#22c55e', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4,
        }}>
          ● LIVE RECOGNIZING...
        </span>
      </div>
    </div>
  );
}
