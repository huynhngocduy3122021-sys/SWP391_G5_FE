import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../../api/managerApi';

export default function ZoneOverviewPanel() {
  const [zones, setZones] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [zonesRes, incidentsRes] = await Promise.all([
        managerApi.getZones(),
        managerApi.getIncidents()
      ]);
      setZones(zonesRes);
      setIncidents(incidentsRes.content || incidentsRes || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu phân khu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (incident) => {
    const notes = prompt("Nhập ghi chú khắc phục sự cố (Bắt buộc):");
    if (!notes) return;
    
    let lostCardFee = 0;
    if (incident.incidentType === 'LOST_CARD') {
      const feeInput = prompt("Nhập phụ phí đền bù thẻ mất (VNĐ):", "50000");
      if (feeInput !== null && !isNaN(feeInput)) {
        lostCardFee = Number(feeInput);
      }
    }

    try {
      await managerApi.resolveIncident(incident.incidentId, { resolutionNotes: notes, lostCardFee });
      alert("Đã giải quyết sự cố!");
      fetchData(); // Tải lại danh sách
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || err.message;
      alert("Lỗi khi giải quyết sự cố: " + errorMsg);
    }
  };

  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  const totalUsed = totalCapacity - zones.reduce((sum, z) => sum + z.availableCapacity, 0);
  const totalPct = totalCapacity === 0 ? 0 : Math.round((totalUsed / totalCapacity) * 100);

  // Remove filter to show all incidents including RESOLVED
  const allIncidents = Array.isArray(incidents) ? incidents : [];

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: mt.textMuted }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {zones.map((b) => {
            const used = b.capacity - b.availableCapacity;
            const pct = b.capacity === 0 ? 0 : Math.round((used / b.capacity) * 100);
            let status = 'Còn chỗ';
            let statusColor = mt.success;
            if (pct >= 100) {
              status = 'Đầy';
              statusColor = mt.danger;
            } else if (!b.active) {
              status = 'Bảo trì';
              statusColor = mt.textMuted;
            }
            return (
              <div key={b.parkingZoneId || b.zoneName} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: mt.text }}>{b.zoneName}</span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: `${statusColor}1A`, color: statusColor,
                  }}>{status}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: mt.textMuted, marginBottom: 10 }}>Đã dùng {pct}%</div>
                <div style={{ height: 6, borderRadius: 4, background: '#f1f5f9', marginBottom: 6 }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: mt.primary }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: mt.textMuted }}>{used} / {b.capacity} slots</div>
              </div>
            );
          })}
          <button type="button" style={{
            ...card, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px dashed ${mt.border}`, color: mt.textMuted, cursor: 'pointer', fontWeight: 600,
            background: 'transparent',
          }}>
            + Thêm phân khu mới
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ ...card, background: mt.primary, color: '#fff' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 6 }}>TỔNG CÔNG SUẤT</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalPct}%</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 12 }}>{totalUsed} / {totalCapacity} vị trí</div>
          </div>
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Chi tiết hiện trạng</div>
            {zones.map((r) => {
              const used = r.capacity - r.availableCapacity;
              const pct = r.capacity === 0 ? 0 : Math.round((used / r.capacity) * 100);
              return (
                <div key={r.parkingZoneId || r.zoneName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '0.8rem' }}>
                  <span style={{ color: mt.textMuted }}>{r.zoneName}</span>
                  <span style={{ fontWeight: 700, color: pct > 85 ? mt.danger : mt.text }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: mt.danger }}>&#9888; Nhật ký xử lý ngoại lệ &amp; Sự cố khẩn cấp</div>
          <button type="button" style={{ border: 'none', background: 'transparent', color: mt.accent, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>Xem tất cả</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>THỜI GIAN</th>
              <th style={{ padding: '6px 8px' }}>LOẠI SỰ CỐ</th>
              <th style={{ padding: '6px 8px' }}>TIÊU ĐỀ</th>
              <th style={{ padding: '6px 8px' }}>TRẠNG THÁI</th>
              <th style={{ padding: '6px 8px' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {allIncidents.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '10px', textAlign: 'center', color: mt.textMuted }}>Không có sự cố nào</td></tr>
            ) : allIncidents.map((l) => {
              const isResolved = l.status === 'RESOLVED' || l.status === 'CLOSED';
              return (
              <tr key={l.incidentId} style={{ borderTop: `1px solid ${mt.border}` }}>
                <td style={{ padding: '8px' }}>{new Date(l.createdAt).toLocaleString('vi-VN')}</td>
                <td style={{ padding: '8px', color: l.incidentType === 'LOST_CARD' ? mt.danger : mt.text }}>&#9679; {l.incidentType}</td>
                <td style={{ padding: '8px', fontWeight: 600 }}>{l.title}</td>
                <td style={{ padding: '8px', color: isResolved ? mt.success : mt.warning, fontWeight: 600 }}>{l.status}</td>
                <td style={{ padding: '8px' }}>
                  {!isResolved ? (
                    <button type="button" onClick={() => handleResolve(l)} style={{
                      border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 6,
                      padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', color: mt.success, fontWeight: 600
                    }}>Giải quyết</button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: mt.textMuted }}>Đã đóng</span>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
