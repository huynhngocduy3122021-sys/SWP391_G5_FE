import React, { useState, useEffect } from 'react';
import managerApi from '../../api/manager';
import adminApi from '../../api/admin';
import { toast } from 'react-toastify';
import { Search, Download, RefreshCw, BarChart2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function AIConfigPage() {
  const [branches, setBranches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [zones, setZones] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Detail States
  const [selectedBranchForSessions, setSelectedBranchForSessions] = useState(null);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  
  // Resolve / Cancel Incident States
  const [resolvingIncident, setResolvingIncident] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [lostCardFee, setLostCardFee] = useState('0');

  const [cancellingIncident, setCancellingIncident] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [br, se, zo, incRes] = await Promise.all([
        managerApi.getParkingBranches().catch(() => []),
        adminApi.getAllSessions().catch(() => []),
        managerApi.getAllZones().catch(() => []),
        adminApi.getAllIncidents().catch(() => ({ content: [] })),
      ]);

      const brList = Array.isArray(br) ? br : (br?.content || br?.data || []);
      const seList = Array.isArray(se) ? se : (se?.content || se?.data || []);
      const zoList = Array.isArray(zo) ? zo : (zo?.content || zo?.data || []);

      setBranches(brList);
      setSessions(seList);
      setZones(zoList);
      
      const incList = Array.isArray(incRes) ? incRes : (incRes?.content || incRes?.data || []);
      setIncidents(incList);
    } catch (err) {
      console.error(err);
      toast.error('Không tải được dữ liệu phân tích và sự cố!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Aggregate stats per branch
  const branchAnalytics = branches.map(b => {
    const bSessions = sessions.filter(s => s.parkingBranchId === b.parkingBranchId);
    const revenue = bSessions.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
    const txCount = bSessions.length;
    const activeParked = bSessions.filter(s => String(s.sessionStatus || '').toUpperCase() === 'ACTIVE').length;
    
    const bZones = zones.filter(z => z.parkingBranchId === b.parkingBranchId);
    const capacity = bZones.reduce((sum, z) => sum + Number(z.capacity || 0), 0);

    return {
      id: b.parkingBranchId,
      name: b.branchName,
      address: b.address || '—',
      revenue,
      txCount,
      activeParked,
      capacity,
      active: b.active
    };
  }).filter(b => (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  // Count incidents by type
  const incidentCounts = incidents.reduce((acc, inc) => {
    const t = inc.incidentType || 'OTHER';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const typeConfig = [
    { type: 'LOST_CARD', label: 'Mất thẻ xe', color: 'var(--vin-primary)' },
    { type: 'TECHNICAL_ERROR', label: 'Lỗi kỹ thuật', color: '#ef4444' },
    { type: 'BARRIER_ERROR', label: 'Lỗi Barrier', color: '#f59e0b' },
    { type: 'PAYMENT_ERROR', label: 'Lỗi thanh toán', color: '#10b981' },
    { type: 'VEHICLE_DAMAGE', label: 'Hư hại xe', color: '#8b5cf6' },
    { type: 'SECURITY_INCIDENT', label: 'An ninh bãi', color: '#ec4899' },
    { type: 'OTHER', label: 'Khác', color: '#64748b' }
  ];

  const totalIncidents = incidents.length;

  // Build conic-gradient slices for the pie chart
  let cumulativePercentage = 0;
  const gradientSegments = typeConfig.map(c => {
    const count = incidentCounts[c.type] || 0;
    const pct = totalIncidents > 0 ? (count / totalIncidents) * 100 : 0;
    const start = cumulativePercentage;
    cumulativePercentage += pct;
    return { ...c, count, pct, start, end: cumulativePercentage };
  }).filter(s => s.count > 0);

  const conicGradientString = gradientSegments.length > 0
    ? `conic-gradient(${gradientSegments.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`
    : '#cbd5e1';

  // Handle resolving incident
  const handleResolveIncident = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return toast.warn('Vui lòng nhập ghi chú khắc phục!');
    
    setActionLoading(true);
    try {
      await adminApi.resolveIncident(resolvingIncident.incidentId, {
        resolutionNotes,
        lostCardFee: Number(lostCardFee || 0)
      });
      toast.success('Xử lý hoàn tất sự cố thành công!');
      setResolvingIncident(null);
      setResolutionNotes('');
      setLostCardFee('0');
      fetchAnalyticsData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật xử lý sự cố!');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancelling incident
  const handleCancelIncident = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) return toast.warn('Vui lòng nhập lý do hủy bỏ!');

    setActionLoading(true);
    try {
      await adminApi.cancelIncident(cancellingIncident.incidentId, {
        cancellationReason
      });
      toast.success('Đã hủy báo cáo sự cố thành công!');
      setCancellingIncident(null);
      setCancellationReason('');
      fetchAnalyticsData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hủy báo cáo sự cố thất bại!');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered branch sessions for the modal
  const branchSessionsFiltered = (selectedBranchForSessions
    ? sessions.filter(s => s.parkingBranchId === selectedBranchForSessions.id)
    : []
  ).filter(s => (s.licensePlate || '').toLowerCase().includes(sessionSearchQuery.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--vin-primary)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: 'var(--vin-primary)' }}>
            Phân tích Vận hành & Quản lý Ngoại lệ
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '13px' }}>Giám sát hoạt động xe ra/vào, xử lý các phản hồi khiếu nại và sự cố phát sinh tại các chi nhánh.</p>
        </div>
        <button 
          onClick={fetchAnalyticsData}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'var(--vin-primary)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--vin-text-main)', cursor: 'pointer' }}
        >
          <RefreshCw size={15} /> Đồng bộ dữ liệu
        </button>
      </div>

      {/* Main Grid: Branch performance & Incident breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>
        
        {/* Branch Operations Table */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--vin-bg-card)' }}>Số liệu Vận hành Chi nhánh</h4>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '6px' }}>
              <Search size={14} color="#64748b" style={{ marginRight: '6px' }} />
              <input 
                type="text" 
                placeholder="Tìm bãi xe..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '150px', color: '#1e293b' }} 
              />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eef0f3', color: '#64748b', fontWeight: '600' }}>
                <th style={{ padding: '10px 8px' }}>CHI NHÁNH</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>DOANH THU</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>LƯỢT XE</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>ĐANG GỬI/SỨC CHỨA</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Đang tải...</td>
                </tr>
              ) : branchAnalytics.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 8px', fontWeight: '700', color: '#1e293b' }}>{row.name}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700', color: 'var(--vin-primary)' }}>
                    {row.revenue.toLocaleString('vi-VN')}đ
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>{row.txCount} lượt</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <strong>{row.activeParked}</strong>/{row.capacity} slots
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    <button
                      onClick={() => { setSelectedBranchForSessions(row); setSessionSearchQuery(''); }}
                      style={{ padding: '4px 10px', backgroundColor: '#eff6ff', border: 'none', borderRadius: '4px', color: 'var(--vin-primary)', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Xem lượt xe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Incidents Pie Chart */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: 'var(--vin-bg-card)', alignSelf: 'flex-start' }}>Phân loại Ngoại lệ & Sự cố</h4>
          
          <div style={{
            width: '130px', height: '130px', borderRadius: '50%',
            background: conicGradientString,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              backgroundColor: '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--vin-primary)' }}>{totalIncidents}</div>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b' }}>SỰ CỐ LOGGED</div>
            </div>
          </div>

          {/* Legend Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', width: '100%', fontSize: '11px' }}>
            {typeConfig.map(c => {
              const count = incidentCounts[c.type] || 0;
              const pct = totalIncidents > 0 ? ((count / totalIncidents) * 100).toFixed(1) : '0.0';
              return (
                <div key={c.type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.color }}></div>
                  <span style={{ color: '#475569', fontWeight: '500' }}>
                    {c.label} ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Incidents Table (Complaints & Exception Resolution) */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AlertTriangle size={18} color="#dc2626" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--vin-primary)' }}>Bảng xử lý Khiếu nại & Sự cố kỹ thuật</h4>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eef0f3', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>
              <th style={{ padding: '10px 8px' }}>CHI NHÁNH</th>
              <th style={{ padding: '10px 8px' }}>SỰ CỐ / PHẢN HỒI</th>
              <th style={{ padding: '10px 8px' }}>LOẠI SỰ CỐ</th>
              <th style={{ padding: '10px 8px' }}>ĐỘ ƯU TIÊN</th>
              <th style={{ padding: '10px 8px' }}>TRẠNG THÁI</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Không có sự cố nào cần xử lý.</td>
              </tr>
            ) : incidents.map(inc => {
              const typeLabel = typeConfig.find(tc => tc.type === inc.incidentType)?.label || inc.incidentType;
              const isPending = inc.status === 'PENDING' || inc.status === 'IN_PROGRESS';
              return (
                <tr key={inc.incidentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 8px', fontWeight: '700', color: '#1e293b' }}>{inc.parkingBranchName || 'Hệ thống'}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{inc.title}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{inc.description}</div>
                  </td>
                  <td style={{ padding: '12px 8px', color: '#475569', fontWeight: '500' }}>{typeLabel}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      backgroundColor: inc.priority === 'CRITICAL' ? '#fef2f2' : inc.priority === 'HIGH' ? '#fff7ed' : '#f0fdf4',
                      color: inc.priority === 'CRITICAL' ? '#dc2626' : inc.priority === 'HIGH' ? '#ea580c' : '#16a34a',
                      padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700'
                    }}>
                      {inc.priority}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      backgroundColor: inc.status === 'RESOLVED' ? '#dcfce7' : inc.status === 'CANCELLED' ? '#fee2e2' : '#fef9c3',
                      color: inc.status === 'RESOLVED' ? '#166534' : inc.status === 'CANCELLED' ? '#991b1b' : '#a16207',
                      padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700'
                    }}>
                      {inc.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {isPending ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => { setResolvingIncident(inc); setResolutionNotes(''); setLostCardFee('0'); }}
                          style={{ padding: '4px 8px', backgroundColor: '#10b981', color: 'var(--vin-text-main)', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Giải quyết
                        </button>
                        <button
                          onClick={() => { setCancellingIncident(inc); setCancellationReason(''); }}
                          style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'var(--vin-text-main)', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Đã đóng
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: VIEW DETAILED PARKING SESSIONS */}
      {selectedBranchForSessions && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--vin-primary)' }}>
                  Lượt xe gửi tại bãi: {selectedBranchForSessions.name}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Danh sách chi tiết các phiên đỗ xe thực tế đang diễn ra hoặc đã hoàn thành.</p>
              </div>
              <button 
                onClick={() => setSelectedBranchForSessions(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', marginBottom: '12px', width: '260px' }}>
              <Search size={14} color="#64748b" style={{ marginRight: '6px' }} />
              <input 
                type="text" 
                placeholder="Tìm biển số xe..." 
                value={sessionSearchQuery}
                onChange={e => setSessionSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '100%', color: '#1e293b' }} 
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600' }}>
                    <th style={{ padding: '10px 8px' }}>BIỂN SỐ XE</th>
                    <th style={{ padding: '10px 8px' }}>LOẠI XE</th>
                    <th style={{ padding: '10px 8px' }}>GIỜ VÀO</th>
                    <th style={{ padding: '10px 8px' }}>GIỜ RA</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>PHÍ THU</th>
                    <th style={{ padding: '10px 8px' }}>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  {branchSessionsFiltered.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Không tìm thấy lượt xe nào.</td>
                    </tr>
                  ) : branchSessionsFiltered.map(s => (
                    <tr key={s.parkingSessionId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '700', color: 'var(--vin-primary)' }}>{s.licensePlate}</td>
                      <td style={{ padding: '10px 8px', color: '#475569' }}>{s.vehicleTypeName}</td>
                      <td style={{ padding: '10px 8px', color: '#475569' }}>
                        {s.checkInTime ? new Date(s.checkInTime).toLocaleString('vi-VN') : '—'}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#475569' }}>
                        {s.checkOutTime ? new Date(s.checkOutTime).toLocaleString('vi-VN') : '—'}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '700', color: 'var(--vin-primary)' }}>
                        {Number(s.totalAmount || 0).toLocaleString('vi-VN')}đ
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          backgroundColor: s.sessionStatus === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                          color: s.sessionStatus === 'ACTIVE' ? '#166534' : '#475569',
                          padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '700'
                        }}>
                          {s.sessionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                onClick={() => setSelectedBranchForSessions(null)}
                style={{ padding: '8px 16px', backgroundColor: '#64748b', color: 'var(--vin-text-main)', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESOLVE INCIDENT */}
      {resolvingIncident && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700', color: 'var(--vin-primary)' }}>
              Giải quyết Sự cố: {resolvingIncident.title}
            </h3>
            
            <form onSubmit={handleResolveIncident} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>GHI CHÚ KHẮC PHỤC SỰ CỐ *</label>
                <textarea
                  placeholder="Nhập chi tiết biện pháp khắc phục (ví dụ: đã sửa cảm biến, đã tìm thấy thẻ...)"
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  rows="3"
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', resize: 'none' }}
                  required
                />
              </div>

              {resolvingIncident.incidentType === 'LOST_CARD' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>PHỤ PHÍ MẤT THẺ (VNĐ)</label>
                  <input
                    type="number"
                    value={lostCardFee}
                    onChange={e => setLostCardFee(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setResolvingIncident(null)}
                  style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'var(--vin-text-main)', border: 'none', borderRadius: '4px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Đang lưu...' : 'Hoàn thành giải quyết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CANCEL INCIDENT */}
      {cancellingIncident && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700', color: 'var(--vin-primary)' }}>
              Hủy bỏ báo cáo Sự cố: {cancellingIncident.title}
            </h3>
            
            <form onSubmit={handleCancelIncident} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>LÝ DO HỦY BỎ *</label>
                <textarea
                  placeholder="Nhập lý do hủy báo cáo (ví dụ: báo cáo nhầm, thông tin trùng lặp...)"
                  value={cancellationReason}
                  onChange={e => setCancellationReason(e.target.value)}
                  rows="3"
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', resize: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCancellingIncident(null)}
                  style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'var(--vin-text-main)', border: 'none', borderRadius: '4px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Đang lưu...' : 'Hủy báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
