import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import staffApi from '../../api/staffApi';
import API from '../../api/config';

// Phải khớp với enum IncidentType ở backend
const INCIDENT_TYPES = [
  { label: 'Mất thẻ',                  enum: 'LOST_CARD' },
  { label: 'Sai biển số',              enum: 'OTHER' },
  { label: 'Barie kẹt',               enum: 'BARRIER_ERROR' },
  { label: 'Khách không thanh toán',   enum: 'PAYMENT_ERROR' },
  { label: 'Lỗi kỹ thuật',            enum: 'TECHNICAL_ERROR' },
  { label: 'Khác',                     enum: 'OTHER' },
];

// Panel "XỬ LÝ CÁC NGOẠI LỆ KHÁC" — xuất hiện ở cả màn Cổng VÀO và Cổng RA
export default function SupportPanel({ plateNumber, gateId, activeSession }) {
  const [type, setType] = useState(INCIDENT_TYPES[0].enum);
  const [label, setLabel] = useState(INCIDENT_TYPES[0].label);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  
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

  const handleSend = async () => {
    if (!note.trim()) {
      toast.warn('Vui lòng nhập mô tả chi tiết sự cố!');
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

    setSending(true);
    try {
      if (type === 'LOST_CARD') {
        if (!activeSession) {
           toast.error('Vui lòng tìm kiếm phiên gửi xe trước khi báo mất thẻ!');
           setSending(false);
           return;
        }
        await staffApi.reportLostCard({
          description: note || 'Báo mất thẻ cho xe ' + plateNumber,
          parkingSessionId: activeSession.parkingSessionId,
          cardCode: activeSession.cardCode || activeSession.parkingCard?.cardCode
        });
      } else {
        await staffApi.reportIncident({ type: label, note, plateNumber, gateId });
      }
      toast.success('Đã gửi yêu cầu hỗ trợ!');
      setNote('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Gửi yêu cầu thất bại!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối server!');
    } finally {
      setSending(false);
    }
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
        <select value={type} onChange={handleTypeChange} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--vin-border)', background: '#f8fafc', color: 'var(--vin-text-main)', fontSize: '0.85rem' }}>
          {INCIDENT_TYPES.map((t, i) => (
            <option key={i} value={t.enum}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="vin-field" style={{ marginBottom: '1rem' }}>
        <label style={{ color: 'var(--vin-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>GHI CHÚ VẬN HÀNH <span style={{ color: '#ef4444' }}>*</span></label>
        <textarea
          rows={4}
          placeholder="Nhập chi tiết sự cố tại đây..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            width: '100%', background: '#f8fafc', border: '1px solid var(--vin-border)',
            borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--vin-text-main)', fontSize: '0.85rem',
            outline: 'none', resize: 'vertical',
          }}
        />
      </div>

      <button
        className="vin-btn vin-btn--full"
        style={{ background: 'var(--vin-success)', color: '#ffffff', padding: '0.75rem', fontWeight: 'bold' }}
        disabled={sending}
        onClick={handleSend}
      >
        {sending ? <span className="vin-spinner" /> : '🛟'} GỬI YÊU CẦU HỖ TRỢ
      </button>
    </div>
  );
}
