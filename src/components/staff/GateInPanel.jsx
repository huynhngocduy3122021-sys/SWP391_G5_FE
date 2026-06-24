import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import staffApi from '../../api/staffApi';
import ZoneOccupancyTable, { MOCK_ZONES } from './ZoneOccupancyTable';
import SupportPanel from './SupportPanel';

const GATE_ID = 'GATE-04';

// Màn "Vận hành Cổng VÀO" — khớp ảnh thiết kế (AI Smart Allocation + Issue Card)
export default function GateInPanel() {
  // Dữ liệu camera AI trả về — mock theo ảnh, thay bằng staffApi.getLiveEntryDetection(GATE_ID)
  const [detected, setDetected] = useState({ plateNumber: '30K-888.88', entryTime: '14:42:05' });
  const [licensePlate, setLicensePlate] = useState('30K-888.88');
  const [cardCode, setCardCode] = useState('CARD-123');
  const [vehicleColor, setVehicleColor] = useState('Xanh');
  const [vehicleBrand, setVehicleBrand] = useState('Xe Dien');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [suggestion, setSuggestion] = useState({
    slotCode: 'B1-A05', matchPercent: 98.4, location: 'Level B1 - Sector A (Premium)', proximity: 'Near Elevator #4 (12m)',
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleConfirm = async () => {
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
      // B1: Gọi API Check-in để tạo parkingSession
      const checkInResult = await staffApi.confirmEntry({
        licensePlate: licensePlate.trim().replace(/[^A-Za-z0-9\-.]/g, ''),
        vehicleTypeId: Number(vehicleTypeId),
        cardCode: cardCode.trim(),
        vehicleColor: vehicleColor.trim(),
        vehicleBrand: vehicleBrand.trim()
      });

      const parkingSessionId = checkInResult.parkingSessionId;

      // B2: Nếu có chọn ảnh thì tải ảnh lên thông qua API 2
      if (selectedFiles.length > 0 && parkingSessionId) {
        await staffApi.uploadVehicleImages(parkingSessionId, 'CHECK_IN', selectedFiles);
      }

      toast.success(`Đã cấp thẻ & mở barie cho ${licensePlate}!`);
      setSelectedFiles([]);
      setCardCode('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Xác nhận vào cổng thất bại!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi server khi check-in!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', padding: '1.25rem' }}>
      {/* ── Cột trái: camera + form nhận xe ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <CameraFeed label={`LIVE ENTRY - ${GATE_ID}`} sub="CAM 01: PLATE RECOGNITION" status="READY" tone="success" />

        <div className="vin-card">
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
            ⚙️ Vehicle Details
          </div>

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

        <ZoneOccupancyTable zones={MOCK_ZONES} />
      </div>

      {/* ── Cột phải: AI suggestion + support ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="ai-card">
          <div className="ai-card__title" style={{ justifyContent: 'space-between' }}>
            <span>🤖 AI SMART ALLOCATION</span>
            <span className="vin-badge vin-badge--success">{suggestion.matchPercent}% MATCH</span>
          </div>
          <div className="ai-card__desc">SUGGESTED SLOT</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            {suggestion.slotCode}
          </div>
          <div className="ai-card__row"><span>📍 LOCATION</span></div>
          <div style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{suggestion.location}</div>
          <div className="ai-card__row"><span>🚶 PROXIMITY</span></div>
          <div style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '1rem' }}>{suggestion.proximity}</div>
          <button className="vin-btn vin-btn--full vin-btn--primary" onClick={handleSuggest}>
            ✅ CONFIRM ALLOCATION
          </button>
        </div>

        <SupportPanel plateNumber={detected.plateNumber} gateId={GATE_ID} />
      </div>
    </div>
  );
}

// Khung camera dùng chung cho cả entry/exit feed
export function CameraFeed({ label, sub, status = 'READY', tone = 'success' }) {
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
        height: 220, background: 'linear-gradient(135deg, #0b1120, #111827)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', borderTop: '1px solid var(--vin-border)',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>{sub}</span>
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
