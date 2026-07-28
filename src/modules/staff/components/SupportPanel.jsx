import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import staffApi from '../api/staffApi';
import API from '../../../shared/api/config';

// Phải khớp với enum IncidentType ở backend
const INCIDENT_TYPES = [
  { label: 'Mất thẻ',                  enum: 'LOST_CARD' },
  { label: 'Sai biển số',              enum: 'OTHER' },
  { label: 'Barie kẹt',               enum: 'BARRIER_ERROR' },
  { label: 'Khách không thanh toán',   enum: 'PAYMENT_ERROR' },
  { label: 'Lỗi kỹ thuật',            enum: 'TECHNICAL_ERROR' },
  { label: 'Khác',                     enum: 'OTHER' },
];

const MAX_IMAGES = 5;
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Panel "XỬ LÝ CÁC NGOẠI LỆ KHÁC" — xuất hiện ở cả màn Cổng VÀO và Cổng RA
export default function SupportPanel({ plateNumber, gateId, activeSession }) {
  const [type, setType] = useState(INCIDENT_TYPES[0].enum);
  const [label, setLabel] = useState(INCIDENT_TYPES[0].label);
  const [note, setNote] = useState('');
  
  const [images, setImages] = useState([]);
  
  const [status, setStatus] = useState('IDLE'); // IDLE, CREATING_REPORT, UPLOADING_IMAGES, UPLOAD_FAILED
  const [createdIncidentId, setCreatedIncidentId] = useState(null);
  const fileInputRef = useRef(null);
  
  const [branchId, setBranchId] = useState(() => {
    const cached = localStorage.getItem('parkingBranchId');
    return cached ? Number(cached) : null;
  });

  useEffect(() => {
    if (!branchId) {
      // Fallback: Fetch branches if staff branch is not cached or linked
      const fetchFallbackBranch = async () => {
        try {
          const res = await API.get('/api/parking-branches');
          const list = res.data || [];
          if (list.length > 0) {
            const firstBranchId = list[0].parkingBranchId || list[0].id;
            setBranchId(Number(firstBranchId));
          }
        } catch (err) {
          console.error('Failed to fetch fallback branches for support panel', err);
        }
      };
      fetchFallbackBranch();
    }
  }, [branchId]);

  const handleTypeChange = (e) => {
    const idx = e.target.selectedIndex;
    setType(INCIDENT_TYPES[idx].enum);
    setLabel(INCIDENT_TYPES[idx].label);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    let validFiles = [];
    let errorMsgs = [];
    
    files.forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errorMsgs.push(`${file.name}: Chỉ chấp nhận JPG, PNG, WEBP`);
      } else if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        errorMsgs.push(`${file.name}: Kích thước quá ${MAX_SIZE_MB}MB`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (errorMsgs.length > 0) {
      toast.error(errorMsgs.join('\n'));
    }
    
    if (images.length + validFiles.length > MAX_IMAGES) {
      toast.warn(`Chỉ được phép tải lên tối đa ${MAX_IMAGES} ảnh.`);
      validFiles = validFiles.slice(0, MAX_IMAGES - images.length);
    }
    
    setImages(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (incidentId) => {
    setStatus('UPLOADING_IMAGES');
    try {
      await staffApi.uploadIncidentImages(incidentId, images);
      toast.success('Đã gửi yêu cầu hỗ trợ và tải ảnh thành công!');
      resetForm();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Tải ảnh thất bại!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối khi tải ảnh!');
      setStatus('UPLOAD_FAILED');
    }
  };

  const handleSend = async () => {
    if (!note.trim()) {
      toast.warn('Vui lòng nhập mô tả chi tiết sự cố!');
      return;
    }

    if (status === 'UPLOAD_FAILED' && createdIncidentId) {
       // Retry image upload only
       await uploadImages(createdIncidentId);
       return;
    }

    const plateInfo = plateNumber ? ` — Biển số: ${plateNumber}` : '';

    const payload = {
      title:        `${label}${plateInfo}`,
      description:  note.trim(),
      incidentType: type,
      priority:     'MEDIUM',
      parkingBranchId: branchId,
      locationDetails: gateId || 'Cổng kiểm soát',
    };

    setStatus('CREATING_REPORT');
    try {
      let createdIncident;
      if (type === 'LOST_CARD') {
        if (!activeSession) {
           toast.error('Vui lòng tìm kiếm phiên gửi xe trước khi báo mất thẻ!');
           setStatus('IDLE');
           return;
        }
        createdIncident = await staffApi.reportLostCard({
          description: note || 'Báo mất thẻ cho xe ' + plateNumber,
          parkingSessionId: activeSession.parkingSessionId,
          cardCode: activeSession.cardCode || activeSession.parkingCard?.cardCode
        });
      } else {
        createdIncident = await staffApi.reportIncident({ type: label, note, plateNumber, gateId });
      }
      
      const incidentId = createdIncident?.incidentId || createdIncident?.id;
      
      if (!incidentId) {
         toast.error('Không lấy được ID sự cố từ máy chủ');
         setStatus('IDLE');
         return;
      }
      
      setCreatedIncidentId(incidentId);

      if (images.length > 0) {
        await uploadImages(incidentId);
      } else {
        toast.success('Đã gửi yêu cầu hỗ trợ!');
        resetForm();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Gửi yêu cầu thất bại!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối server!');
      setStatus('IDLE');
    }
  };
  
  const resetForm = () => {
    setNote('');
    setImages([]);
    setStatus('IDLE');
    setCreatedIncidentId(null);
  };

  const getButtonContent = () => {
    if (status === 'CREATING_REPORT') return <><span className="vin-spinner" /> ĐANG TẠO BÁO CÁO</>;
    if (status === 'UPLOADING_IMAGES') return <><span className="vin-spinner" /> ĐANG TẢI ẢNH LÊN...</>;
    if (status === 'UPLOAD_FAILED') return 'TẢI ẢNH THẤT BẠI - THỬ LẠI';
    return '🛟 GỬI YÊU CẦU HỖ TRỢ';
  };

  return (
    <div className="vin-card bg-white shadow-sm" style={{ padding: '1.25rem', borderRadius: '12px', border: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span className="vin-badge vin-badge--danger">HỆ THỐNG HỖ TRỢ</span>
      </div>
      <h6 style={{ color: 'var(--vin-text-main)', fontWeight: 700, marginBottom: '1rem' }}>
        🛎️ XỬ LÝ CÁC NGOẠI LỆ KHÁC
      </h6>

      <div className="vin-field" style={{ marginBottom: '0.75rem' }}>
        <label style={{ color: 'var(--vin-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>LOẠI NGOẠI LỆ</label>
        <select value={type} onChange={handleTypeChange} disabled={status !== 'IDLE'} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--vin-border)', background: '#f8fafc', color: 'var(--vin-text-main)', fontSize: '0.85rem' }}>
          {INCIDENT_TYPES.map((t, i) => (
            <option key={i} value={t.enum}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="vin-field" style={{ marginBottom: '1rem' }}>
        <label style={{ color: 'var(--vin-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>GHI CHÚ VẬN HÀNH <span style={{ color: '#ef4444' }}>*</span></label>
        <textarea
          rows={3}
          placeholder="Nhập chi tiết sự cố tại đây..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={status !== 'IDLE'}
          style={{
            width: '100%', background: '#f8fafc', border: '1px solid var(--vin-border)',
            borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--vin-text-main)', fontSize: '0.85rem',
            outline: 'none', resize: 'vertical',
          }}
        />
      </div>
      
      <div className="vin-field" style={{ marginBottom: '1rem' }}>
        <label style={{ color: 'var(--vin-text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
          ẢNH BẰNG CHỨNG (Tùy chọn)
          <span>{images.length}/{MAX_IMAGES}</span>
        </label>
        
        {images.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--vin-border)' }}>
                <img src={URL.createObjectURL(img)} alt={`preview-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  disabled={status === 'CREATING_REPORT' || status === 'UPLOADING_IMAGES'}
                  style={{
                    position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px',
                    background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        
        {images.length < MAX_IMAGES && (
          <div>
            <input
              type="file"
              multiple
              accept={ALLOWED_TYPES.join(',')}
              ref={fileInputRef}
              onChange={handleImageChange}
              disabled={status === 'CREATING_REPORT' || status === 'UPLOADING_IMAGES'}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === 'CREATING_REPORT' || status === 'UPLOADING_IMAGES'}
              style={{
                width: '100%', padding: '0.5rem', background: '#f8fafc', border: '1px dashed var(--vin-border)',
                borderRadius: '8px', color: 'var(--vin-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              + Chọn ảnh đính kèm
            </button>
          </div>
        )}
      </div>

      <button
        className="vin-btn vin-btn--full"
        style={{ 
          background: status === 'UPLOAD_FAILED' ? '#f59e0b' : 'var(--vin-success)', 
          color: '#ffffff', padding: '0.75rem', fontWeight: 'bold' 
        }}
        disabled={status === 'CREATING_REPORT' || status === 'UPLOADING_IMAGES'}
        onClick={handleSend}
      >
        {getButtonContent()}
      </button>
    </div>
  );
}
