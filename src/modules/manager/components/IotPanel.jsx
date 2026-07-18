import { useState, useEffect } from 'react';
import managerApi from '../api/manager';
import { toast } from 'react-toastify';

export default function IotPanel({ branchId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trạng thái cho dòng session đang được chọn
  const [selectedSession, setSelectedSession] = useState(null);
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    const cleanBranchId = (branchId && branchId !== 'undefined' && branchId !== 'null') ? String(branchId) : localStorage.getItem('parkingBranchId');
    try {
      const data = await managerApi.getAllSessions(cleanBranchId ? { parkingBranchId: Number(cleanBranchId), branchId: Number(cleanBranchId) } : {});
      const parsed = Array.isArray(data) ? data : data?.content || [];
      
      const getBranchId = (obj) => {
        if (!obj) return '';
        if (obj.parkingBranchId) return String(obj.parkingBranchId);
        if (obj.branchId) return String(obj.branchId);
        if (obj.parkingBranch?.parkingBranchId) return String(obj.parkingBranch.parkingBranchId);
        if (obj.parkingBranch?.id) return String(obj.parkingBranch.id);
        if (obj.branch?.id) return String(obj.branch.id);
        if (obj.parkingBranch && (typeof obj.parkingBranch === 'number' || typeof obj.parkingBranch === 'string')) {
          return String(obj.parkingBranch);
        }
        if (obj.branch && (typeof obj.branch === 'number' || typeof obj.branch === 'string')) {
          return String(obj.branch);
        }
        return '';
      };

      const filtered = cleanBranchId
        ? parsed.filter(s => getBranchId(s) === cleanBranchId)
        : parsed;
      // Sắp xếp thời gian check-in mới nhất lên đầu
      const sorted = filtered.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
      setSessions(sorted);
      
      // Mặc định chọn dòng đầu tiên nếu có dữ liệu và chưa chọn dòng nào
      if (sorted.length > 0) {
        setSelectedSession(sorted[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không tải được danh sách lượt xe!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [branchId]);

  // Gọi API lấy ảnh thật của phiên gửi xe khi thay đổi dòng được chọn
  useEffect(() => {
    if (!selectedSession) {
      setImages([]);
      return;
    }

    let isMounted = true;
    const fetchSessionImages = async () => {
      setLoadingImages(true);
      try {
        const data = await managerApi.getSessionImages(selectedSession.parkingSessionId);
        if (isMounted) {
          setImages(data || []);
        }
      } catch (err) {
        console.error('Không lấy được ảnh của phiên gửi xe:', err);
        if (isMounted) {
          setImages([]);
        }
      } finally {
        if (isMounted) {
          setLoadingImages(false);
        }
      }
    };

    fetchSessionImages();
    return () => {
      isMounted = false;
    };
  }, [selectedSession]);

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Đang đỗ...';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN');
    } catch {
      return timeStr;
    }
  };

  // Lọc theo tìm kiếm biển số hoặc mã thẻ
  const filteredSessions = sessions.filter(s => {
    const plate = (s.licensePlate || '').toLowerCase();
    const card = (s.cardCode || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return plate.includes(query) || card.includes(query);
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Left Section: Vehicle List */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--vin-primary)' }}>Danh sách Lượt xe Gần đây</h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '12px' }}>Chọn một hàng để xem ảnh chụp camera tương ứng ở cột bên phải.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 6, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6, width: 220 }}>
              <span style={{ color: '#64748b' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Tìm biển số, mã thẻ..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px', color: 'var(--vin-primary)' }} 
              />
            </div>
            <button 
              onClick={fetchSessions}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#1b6eff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--vin-text-main)', cursor: 'pointer' }}
            >
              🔄 Tải lại
            </button>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto', padding: '0 24px 24px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600' }}>
                <th style={{ padding: '16px 8px' }}>BIỂN SỐ</th>
                <th style={{ padding: '16px 8px' }}>LOẠI XE</th>
                <th style={{ padding: '16px 8px' }}>CHI NHÁNH</th>
                <th style={{ padding: '16px 8px' }}>THỜI GIAN VÀO</th>
                <th style={{ padding: '16px 8px' }}>THỜI GIAN RA</th>
                <th style={{ padding: '16px 8px' }}>SỐ THẺ</th>
                <th style={{ padding: '16px 8px' }}>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>⏳ Đang tải dữ liệu lượt xe thực tế...</td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>📭 Không tìm thấy lượt xe nào.</td>
                </tr>
              ) : filteredSessions.map((row) => {
                const isActive = String(row.sessionStatus || '').toUpperCase() === 'ACTIVE';
                const isSelected = selectedSession?.parkingSessionId === row.parkingSessionId;
                const isMonthly = (row.cardCode || '').startsWith('MONTH-');
                const isVip = (row.cardCode || '').startsWith('VIP-');
                const displayCard = isMonthly ? row.cardCode.replace('MONTH-', '') : isVip ? row.cardCode.replace('VIP-', '') : (row.cardCode || '—');
                
                return (
                  <tr 
                    key={row.parkingSessionId} 
                    onClick={() => setSelectedSession(row)}
                    style={{ 
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f0f7ff' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <td style={{ padding: '16px 8px', fontWeight: '700', color: isSelected ? '#1b6eff' : '#1e293b' }}>{row.licensePlate || '—'}</td>
                    <td style={{ padding: '16px 8px', color: '#475569' }}>{row.vehicleTypeName || '—'}</td>
                    <td style={{ padding: '16px 8px', color: '#475569' }}>{row.parkingBranchName || '—'}</td>
                    <td style={{ padding: '16px 8px', color: '#475569' }}>{formatTime(row.checkInTime)}</td>
                    <td style={{ padding: '16px 8px', color: isActive ? '#16a34a' : '#475569', fontWeight: isActive ? '600' : 'normal' }}>
                      {formatTime(row.checkOutTime)}
                    </td>
                    <td style={{ padding: '16px 8px', color: 'var(--vin-primary)', fontWeight: '600' }}>
                      {displayCard}
                      {(isMonthly || isVip) && (
                        <span style={{
                          marginLeft: '6px',
                          backgroundColor: isMonthly ? '#f3e8ff' : '#fef3c7',
                          color: isMonthly ? '#6b21a8' : '#b45309',
                          padding: '2px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: '700'
                        }}>
                          {isMonthly ? 'Tháng' : 'VIP'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        backgroundColor: isActive ? '#dcfce7' : '#f1f5f9', 
                        color: isActive ? '#166534' : '#475569', 
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600'
                      }}>
                        {isActive ? 'Đang đỗ' : 'Đã ra'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Section: Cameras */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Camera Views Card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--vin-primary)' }}>Ảnh Chụp Thực Tế (IoT)</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '12px', fontWeight: '600' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></div> Camera ANPR
            </div>
          </div>

          {selectedSession ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Thông tin nhanh về lượt xe đang được chọn */}
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>BIỂN SỐ XE</span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>MÃ THẺ RFID</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#1b6eff' }}>{selectedSession.licensePlate || '—'}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                    {selectedSession.cardCode ? (selectedSession.cardCode.startsWith('MONTH-') ? selectedSession.cardCode.replace('MONTH-', '') : selectedSession.cardCode.startsWith('VIP-') ? selectedSession.cardCode.replace('VIP-', '') : selectedSession.cardCode) : '—'}
                  </span>
                </div>
              </div>

              {loadingImages ? (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                  ⏳ Đang tải ảnh từ server...
                </div>
              ) : (() => {
                let inImg = images.find(img => img.imageType === 'IN' || img.imageType === 'PLATE_IN' || String(img.imageType).toUpperCase().includes('IN'));
                let outImg = images.find(img => img.imageType === 'OUT' || img.imageType === 'PLATE_OUT' || String(img.imageType).toUpperCase().includes('OUT'));
                
                if (!inImg && images.length > 0) inImg = images[0];
                if (!outImg && images.length > 1) outImg = images[1];

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* IN GATE IMAGE BOX */}
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                      <div style={{ backgroundColor: '#f1f5f9', padding: '6px 12px', borderBottom: '1px solid #cbd5e1', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                        📥 ẢNH CAMERA CỔNG VÀO (IN GATE)
                      </div>
                      {inImg ? (
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={inImg.imageUrl} 
                            alt="Gate In" 
                            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '300px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML = `<div style="height: 120px; background: #e2e8f0; display:flex; align-items:center; justify-content:center; color:#475569; font-size:12px;">[Link ảnh lỗi hoặc không truy cập được]</div>`;
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                          Không có ảnh cổng vào
                        </div>
                      )}
                    </div>

                    {/* OUT GATE IMAGE BOX */}
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                      <div style={{ backgroundColor: '#f1f5f9', padding: '6px 12px', borderBottom: '1px solid #cbd5e1', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                        📤 ẢNH CAMERA CỔNG RA (OUT GATE)
                      </div>
                      {outImg ? (
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={outImg.imageUrl} 
                            alt="Gate Out" 
                            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '300px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML = `<div style="height: 120px; background: #e2e8f0; display:flex; align-items:center; justify-content:center; color:#475569; font-size:12px;">[Link ảnh lỗi hoặc không truy cập được]</div>`;
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                          {selectedSession.sessionStatus === 'ACTIVE' ? 'Xe đang đỗ (Chưa có ảnh cổng ra)' : 'Không có ảnh cổng ra'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
              Chọn một lượt xe để xem thông tin chi tiết & ảnh chụp.
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
