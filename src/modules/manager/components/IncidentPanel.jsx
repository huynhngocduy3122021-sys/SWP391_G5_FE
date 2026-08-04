import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../api/manager';

/* ── constants ─────────────────────────────── */
const TYPE_LABELS = {
  LOST_CARD:         'Mất thẻ',
  TECHNICAL_ERROR:   'Lỗi kỹ thuật',
  PAYMENT_ERROR:     'Lỗi thanh toán',
  VEHICLE_DAMAGE:    'Xe bị hư hại',
  SECURITY_INCIDENT: 'An ninh',
  POWER_OUTAGE:      'Mất điện',
  BARRIER_ERROR:     'Barie kẹt',
  OTHER:             'Khác',
};

const STATUS_CFG = {
  PENDING:     { label: 'Chờ xử lý',   bg: '#fef3c7', color: '#92400e' },
  IN_PROGRESS: { label: 'Đang xử lý',  bg: '#dbeafe', color: 'var(--vin-primary)' },
  RESOLVED:    { label: 'Đã xử lý',    bg: '#dcfce7', color: '#166534' },
  CANCELLED:   { label: 'Đã hủy',      bg: '#f1f5f9', color: '#64748b' },
};

const PRIORITY_CFG = {
  LOW:      { label: 'Thấp',     color: '#64748b' },
  MEDIUM:   { label: 'Trung bình', color: '#0d9488' },
  HIGH:     { label: 'Cao',      color: '#f59e0b' },
  CRITICAL: { label: 'Khẩn cấp', color: '#dc2626' },
};

const fmtDt = (dt) => {
  if (!dt) return '—';
  const d = new Date(dt);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')} ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
};

/* ── main component ──────────────────────── */
export default function IncidentPanel({ branchId }) {
  const [incidents, setIncidents] = useState([]);
  const [loading,   setLoading]   = useState(false);

  // Bộ lọc
  const [statusFilter,   setStatusFilter]   = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [search,         setSearch]         = useState('');

  // Modal giải quyết
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolveNote,   setResolveNote]   = useState('');
  const [resolving,     setResolving]     = useState(false);
  const [resolveErr,    setResolveErr]    = useState('');

  // Modal hủy
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelErr,    setCancelErr]    = useState('');

  // Modal chi tiết
  const [detailTarget, setDetailTarget] = useState(null);
  const [incidentImages, setIncidentImages] = useState(null);
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    if (detailTarget) {
      setIncidentImages(null);
      setLoadingImages(true);
      managerApi.getIncidentImages(detailTarget.incidentId)
        .then(res => setIncidentImages(res))
        .catch(err => {
          console.error("Failed to fetch incident images", err);
          setIncidentImages([]);
        })
        .finally(() => setLoadingImages(false));
    }
  }, [detailTarget]);

  /* ── fetch ── */
  const fetchIncidents = async () => {
    setLoading(true);
    const cleanBranchId = (branchId && branchId !== 'undefined' && branchId !== 'null') ? String(branchId) : localStorage.getItem('parkingBranchId');
    try {
      const data = await managerApi.getIncidentReports({ page: 0, size: 100 });
      const arr  = data?.content || data || [];
      const parsed = Array.isArray(arr) ? arr : [];
      
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

      setIncidents(cleanBranchId 
        ? parsed.filter(i => getBranchId(i) === cleanBranchId)
        : parsed
      );
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, [branchId]);

  /* ── derived ── */
  const filtered = incidents
    .filter(i => {
      const matchStatus   = statusFilter   === 'ALL' || i.status   === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || i.priority === priorityFilter;
      const q = search.toLowerCase();
      const matchSearch   = !q
        || i.title?.toLowerCase().includes(q)
        || i.reporterName?.toLowerCase().includes(q)
        || i.description?.toLowerCase().includes(q);
      return matchStatus && matchPriority && matchSearch;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (!Number.isFinite(aTime)) return 1;
      if (!Number.isFinite(bTime)) return -1;
      return bTime - aTime;
    });

  const countByStatus = (s) => incidents.filter(i => i.status === s).length;

  /* ── resolve ── */
  const handleResolve = async () => {
    if (!resolveNote.trim()) return setResolveErr('Vui lòng nhập ghi chú giải quyết.');
    setResolving(true);
    try {
      await managerApi.resolveIncident(resolveTarget.incidentId, { resolutionNotes: resolveNote.trim() });
      setResolveTarget(null); setResolveNote(''); fetchIncidents();
    } catch (err) {
      setResolveErr(String(err?.response?.data?.message || err?.response?.data || 'Thao tác thất bại!'));
    } finally {
      setResolving(false);
    }
  };

  /* ── cancel ── */
  const handleCancel = async () => {
    if (!cancelReason.trim()) return setCancelErr('Vui lòng nhập lý do hủy.');
    setCancelling(true);
    try {
      await managerApi.cancelIncident(cancelTarget.incidentId, { cancellationReason: cancelReason.trim() });
      setCancelTarget(null); setCancelReason(''); fetchIncidents();
    } catch (err) {
      setCancelErr(String(err?.response?.data?.message || err?.response?.data || 'Thao tác thất bại!'));
    } finally {
      setCancelling(false);
    }
  };

  /* ── render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'TỔNG SỰ CỐ',    value: incidents.length, color: mt.text },
          { label: 'CHỜ XỬ LÝ',     value: countByStatus('PENDING'),     color: '#92400e' },
          { label: 'ĐANG XỬ LÝ',    value: countByStatus('IN_PROGRESS'), color: 'var(--vin-primary)' },
          { label: 'ĐÃ GIẢI QUYẾT', value: countByStatus('RESOLVED'),    color: mt.success },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{loading ? '...' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Bộ lọc */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="text" placeholder="🔍 Tìm theo tiêu đề, người báo cáo..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
        />

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'].map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                style={{
                  border: `1px solid ${statusFilter === s ? (cfg?.color || mt.primary) : mt.border}`,
                  background: statusFilter === s ? (cfg?.bg || mt.primary) : '#fff',
                  color: statusFilter === s ? (cfg?.color || '#fff') : mt.text,
                  borderRadius: 20, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                }}>
                {s === 'ALL' ? 'Tất cả' : cfg?.label || s}
              </button>
            );
          })}
        </div>

        {/* Priority filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => {
            const cfg = PRIORITY_CFG[p];
            return (
              <button key={p} type="button" onClick={() => setPriorityFilter(p)}
                style={{
                  border: `1px solid ${priorityFilter === p ? (cfg?.color || mt.primary) : mt.border}`,
                  background: priorityFilter === p ? (cfg?.color || mt.primary) : '#fff',
                  color: priorityFilter === p ? '#fff' : mt.text,
                  borderRadius: 20, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                }}>
                {p === 'ALL' ? 'Mọi mức' : cfg?.label || p}
              </button>
            );
          })}
        </div>

        <button type="button" onClick={fetchIncidents}
          style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 8, padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>
          🔄
        </button>
      </div>

      {/* Bảng sự cố */}
      <div style={card}>
        <div style={{ fontWeight: 700, color: mt.text, marginBottom: 12 }}>
          Danh sách sự cố
          <span style={{ fontSize: '0.75rem', color: mt.textMuted, fontWeight: 400, marginLeft: 8 }}>
            ({filtered.length} / {incidents.length})
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: mt.textMuted, padding: '2rem' }}>Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: mt.textMuted, padding: '2rem' }}>Không có sự cố nào phù hợp.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: mt.textMuted, textAlign: 'left', borderBottom: `2px solid ${mt.border}` }}>
                <th style={{ padding: '8px' }}>ID</th>
                <th style={{ padding: '8px' }}>TIÊU ĐỀ</th>
                <th style={{ padding: '8px' }}>LOẠI</th>
                <th style={{ padding: '8px' }}>MỨC ĐỘ</th>
                <th style={{ padding: '8px' }}>TRẠNG THÁI</th>
                <th style={{ padding: '8px' }}>NGƯỜI BÁO</th>
                <th style={{ padding: '8px' }}>THỜI GIAN</th>
                <th style={{ padding: '8px' }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const sc = STATUS_CFG[i.status]   || { label: i.status,   bg: '#f1f5f9', color: '#64748b' };
                const pc = PRIORITY_CFG[i.priority] || { label: i.priority, color: mt.textMuted };
                const canAct = i.status === 'PENDING' || i.status === 'IN_PROGRESS';
                return (
                  <tr key={i.incidentId} style={{ borderBottom: `1px solid ${mt.border}` }}>
                    <td style={{ padding: '8px', color: mt.textMuted }}>#{i.incidentId}</td>
                    <td style={{ padding: '8px', fontWeight: 600, maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title}</div>
                    </td>
                    <td style={{ padding: '8px' }}>{TYPE_LABELS[i.incidentType] || i.incidentType}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ color: pc.color, fontWeight: 700, fontSize: '0.72rem' }}>● {pc.label}</span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700 }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: mt.textMuted }}>{i.reporterName || '—'}</td>
                    <td style={{ padding: '8px', color: mt.textMuted, fontSize: '0.72rem' }}>{fmtDt(i.createdAt)}</td>
                    <td style={{ padding: '8px' }}>
                      <button type="button" onClick={() => setDetailTarget(i)}
                        style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', marginRight: 4, fontSize: '0.72rem' }}>
                        👁 Chi tiết
                      </button>
                      {canAct && (
                        <>
                          <button type="button" onClick={() => { setResolveTarget(i); setResolveNote(''); setResolveErr(''); }}
                            style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', color: mt.success, borderRadius: 6, padding: '3px 7px', cursor: 'pointer', marginRight: 4, fontSize: '0.72rem', fontWeight: 600 }}>
                            ✓ Giải quyết
                          </button>
                          <button type="button" onClick={() => { setCancelTarget(i); setCancelReason(''); setCancelErr(''); }}
                            style={{ border: '1px solid #fca5a5', background: '#fff5f5', color: mt.danger, borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                            ✕ Hủy
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ════ MODAL: Chi tiết ════ */}
      {detailTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e40af)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
              <div style={{ color: 'var(--vin-text-main)', fontWeight: 700 }}>👁 Chi tiết sự cố #{detailTarget.incidentId}</div>
              <button onClick={() => setDetailTarget(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'var(--vin-text-main)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              {[
                ['Tiêu đề',       detailTarget.title],
                ['Loại sự cố',    TYPE_LABELS[detailTarget.incidentType] || detailTarget.incidentType],
                ['Mức độ',        PRIORITY_CFG[detailTarget.priority]?.label || detailTarget.priority],
                ['Trạng thái',    STATUS_CFG[detailTarget.status]?.label     || detailTarget.status],
                ['Người báo cáo', detailTarget.reporterName || '—'],
                ['SĐT báo cáo',   detailTarget.reporterPhone || '—'],
                ['Nhân viên xử lý', detailTarget.assignedStaffName || 'Chưa phân công'],
                ['Chi nhánh',     detailTarget.parkingBranchName || '—'],
                ['Tạo lúc',       fmtDt(detailTarget.createdAt)],
                ['Giải quyết lúc', fmtDt(detailTarget.resolvedAt)],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ display: 'flex', gap: '1rem', borderBottom: `1px solid ${mt.border}`, paddingBottom: '0.5rem' }}>
                  <div style={{ width: 140, color: mt.textMuted, fontWeight: 600, flexShrink: 0 }}>{lbl}</div>
                  <div style={{ color: mt.text }}>{val}</div>
                </div>
              ))}
              <div style={{ borderBottom: `1px solid ${mt.border}`, paddingBottom: '0.5rem' }}>
                <div style={{ color: mt.textMuted, fontWeight: 600, marginBottom: 4 }}>Mô tả</div>
                <div style={{ color: mt.text, lineHeight: 1.6 }}>{detailTarget.description || '—'}</div>
              </div>
              {detailTarget.resolutionNotes && (
                <div>
                  <div style={{ color: mt.textMuted, fontWeight: 600, marginBottom: 4 }}>Ghi chú giải quyết</div>
                  <div style={{ color: mt.success, lineHeight: 1.6 }}>{detailTarget.resolutionNotes}</div>
                </div>
              )}
              {detailTarget.cancellationReason && (
                <div>
                  <div style={{ color: mt.textMuted, fontWeight: 600, marginBottom: 4 }}>Lý do hủy</div>
                  <div style={{ color: mt.danger, lineHeight: 1.6 }}>{detailTarget.cancellationReason}</div>
                </div>
              )}
              
              <div style={{ borderBottom: `1px solid ${mt.border}`, paddingBottom: '0.5rem' }}>
                <div style={{ color: mt.textMuted, fontWeight: 600, marginBottom: 8 }}>Ảnh bằng chứng</div>
                {loadingImages ? (
                  <div style={{ fontSize: '0.85rem', color: mt.textMuted }}>Đang tải ảnh...</div>
                ) : incidentImages && incidentImages.length > 0 ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {incidentImages.map(img => (
                      <div key={img.incidentImageId || img.id} style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${mt.border}`, position: 'relative' }}>
                        <a href={img.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                          <img src={img.imageUrl} alt="evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: mt.textMuted }}>Không có ảnh đính kèm</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: Giải quyết ════ */}
      {resolveTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'linear-gradient(135deg,#166534,#16a34a)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--vin-text-main)', fontWeight: 700 }}>✓ Giải quyết sự cố #{resolveTarget.incidentId}</div>
              <button onClick={() => setResolveTarget(null)} disabled={resolving}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'var(--vin-text-main)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {resolveErr && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.5rem 0.75rem', color: mt.danger, fontSize: '0.8rem', marginBottom: '1rem' }}>⚠ {resolveErr}</div>}
              <p style={{ fontSize: '0.85rem', color: mt.textMuted, marginBottom: '0.75rem' }}>
                Sự cố: <strong style={{ color: mt.text }}>{resolveTarget.title}</strong>
              </p>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                Ghi chú giải quyết *
              </label>
              <textarea rows={4} placeholder="Mô tả cách đã giải quyết sự cố..." value={resolveNote}
                onChange={e => { setResolveErr(''); setResolveNote(e.target.value); }}
                style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${mt.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setResolveTarget(null)} disabled={resolving}
                style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleResolve} disabled={resolving}
                style={{ border: 'none', background: 'linear-gradient(135deg,#166534,#16a34a)', color: 'var(--vin-text-main)', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 700 }}>
                {resolving ? 'Đang xử lý...' : '✓ Xác nhận giải quyết'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: Hủy sự cố ════ */}
      {cancelTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'linear-gradient(135deg,#7f1d1d,#dc2626)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--vin-text-main)', fontWeight: 700 }}>✕ Hủy sự cố #{cancelTarget.incidentId}</div>
              <button onClick={() => setCancelTarget(null)} disabled={cancelling}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'var(--vin-text-main)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {cancelErr && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.5rem 0.75rem', color: mt.danger, fontSize: '0.8rem', marginBottom: '1rem' }}>⚠ {cancelErr}</div>}
              <p style={{ fontSize: '0.85rem', color: mt.textMuted, marginBottom: '0.75rem' }}>
                Sự cố: <strong style={{ color: mt.text }}>{cancelTarget.title}</strong>
              </p>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: mt.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                Lý do hủy *
              </label>
              <textarea rows={3} placeholder="Nhập lý do hủy sự cố này..." value={cancelReason}
                onChange={e => { setCancelErr(''); setCancelReason(e.target.value); }}
                style={{ width: '100%', border: `1px solid ${mt.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${mt.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setCancelTarget(null)} disabled={cancelling}
                style={{ border: `1px solid ${mt.border}`, background: '#fff', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer' }}>Đóng</button>
              <button onClick={handleCancel} disabled={cancelling}
                style={{ border: 'none', background: '#dc2626', color: 'var(--vin-text-main)', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 700 }}>
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
