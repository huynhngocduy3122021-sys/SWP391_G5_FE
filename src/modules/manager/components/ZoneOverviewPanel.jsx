import { useState, useEffect } from 'react';
import { Modal, Button, Form, ProgressBar, Badge } from 'react-bootstrap';
import { Plus, Trash2, Building2, Layers, Loader2 } from 'lucide-react';
import { mt } from './managerTheme';
import managerApi from '../api/manager';
import { toast } from 'react-toastify';

/* ── helpers ─────────────────────────────────────────────── */
const gId   = (o, ...ks) => { for (const k of ks) if (o?.[k]) return o[k]; return ''; };
const gName = (o, ...ks) => { for (const k of ks) if (o?.[k]) return o[k]; return ''; };
const sid   = (a, b) => String(a || '') === String(b || '');

const floorId = (f) => {
  if (!f) return '';
  if (f.parkingFloorId) return String(f.parkingFloorId);
  if (f.id) return String(f.id);
  return '';
};

const floorName = (f) => {
  if (!f) return '';
  return f.floorName || f.name || f.floorCode || String(floorId(f));
};

const zoneId = (z) => {
  if (!z) return '';
  if (z.parkingZoneId) return String(z.parkingZoneId);
  if (z.id) return String(z.id);
  if (z.zoneId) return String(z.zoneId);
  return '';
};

const zoneName = (z) => {
  if (!z) return '';
  return z.zoneName || z.name || `Zone ${zoneId(z)}`;
};

const zoneCap = (z) => Number(z?.capacity || z?.totalSlots || z?.total || 0);

const zoneUsed = (z) => Number(z?.usedSlots || z?.occupiedSlots || z?.currentOccupancy || z?.used || 0);

const zoneFlId = (z) => {
  if (!z) return '';
  if (z.parkingFloorId) return String(z.parkingFloorId);
  if (z.floorId) return String(z.floorId);
  if (z.parkingFloor?.parkingFloorId) return String(z.parkingFloor.parkingFloorId);
  if (z.parkingFloor?.id) return String(z.parkingFloor.id);
  if (z.floor?.id) return String(z.floor.id);
  return '';
};

const vtId = (v) => {
  if (!v) return '';
  if (v.vehicleTypeId) return String(v.vehicleTypeId);
  if (v.id) return String(v.id);
  return '';
};

const vtName = (v) => {
  if (!v) return '';
  return v.typeName || v.vehicleTypeName || v.name || `Loại xe ${vtId(v)}`;
};

const apiErr = (err) => {
  const msg = err?.response?.data?.message || err?.response?.data || '';
  const map = {
    'Parking floor already has a parking zone': 'Tầng này đã có phân khu.',
    'Parking floor is inactive': 'Tầng đang ngưng hoạt động.',
    'Parking branch is inactive': 'Chi nhánh đang ngưng hoạt động.',
    'Parking floor not found': 'Không tìm thấy tầng bãi xe.',
    'Vehicle type not found': 'Không tìm thấy loại phương tiện.',
  };
  return map[msg] || msg || 'Có lỗi xảy ra. Vui lòng thử lại.';
};

/* ── sub-components ──────────────────────────────────────── */
function GradientModalHeader({ icon: Icon, title, subtitle, gradient, onClose, disabled }) {
  return (
    <div className="d-flex justify-content-between align-items-center px-4 py-3"
      style={{ background: gradient }}>
      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center justify-content-center rounded-3"
          style={{ width: 42, height: 42, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <Icon size={20} color="#fff" />
        </div>
        <div>
          <h5 className="mb-0 fw-bold text-white">{title}</h5>
          <small style={{ color: 'rgba(255,255,255,0.65)' }}>{subtitle}</small>
        </div>
      </div>
      <button className="btn btn-sm rounded-3" onClick={onClose} disabled={disabled}
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)' }}>
        <i className="bi bi-x-lg" />
      </button>
    </div>
  );
}

/* ── main component ──────────────────────────────────────── */
export default function ZoneOverviewPanel({ branchId }) {
  const [selFloor, setSelFloor] = useState('ALL');
  const [floors,   setFloors]   = useState([]);
  const [zones,    setZones]    = useState([]);
  const [vtypes,   setVtypes]   = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(false);

  // modal visibility
  const [modZone,   setModZone]  = useState(false);
  const [modFloor,  setModFloor] = useState(false);
  const [modDel,    setModDel]   = useState(null); // { id, name }
  
  // Edit & Delete states
  const [editZoneTarget, setEditZoneTarget] = useState(null);
  const [editFloorTarget, setEditFloorTarget] = useState(null);
  const [delFloorTarget, setDelFloorTarget] = useState(null);

  // form states
  const emptyZone  = { name: '', total: '', floorId: '', vtId: '' };
  const emptyFloor = { name: '', code: '', floorNumber: '', capacity: '' };
  const [zForm, setZForm] = useState(emptyZone);
  const [fForm, setFForm] = useState(emptyFloor);

  // error / saving
  const [zErr, setZErr] = useState('');
  const [fErr, setFErr] = useState('');
  const [dErr, setDErr] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── fetch ── */
  const fetchData = async () => {
    setLoading(true);
    const cleanBranchId = (branchId && branchId !== 'undefined' && branchId !== 'null') ? String(branchId) : localStorage.getItem('parkingBranchId');
    try {
      let fl, zo, vt, se;
      
      // Fetch floors with fallback
      if (cleanBranchId) {
        try {
          fl = await managerApi.getParkingFloorsByBranch(cleanBranchId);
        } catch (err) {
          console.warn("getParkingFloorsByBranch failed, falling back to getAllFloors", err);
          fl = await managerApi.getAllFloors();
        }
      } else {
        fl = await managerApi.getAllFloors();
      }

      // Fetch zones with fallback
      if (cleanBranchId) {
        try {
          zo = await managerApi.getParkingZonesByBranch(cleanBranchId);
        } catch (err) {
          console.warn("getParkingZonesByBranch failed, falling back to getAllZones", err);
          zo = await managerApi.getAllZones();
        }
      } else {
        zo = await managerApi.getAllZones();
      }

      // Fetch vehicle types & sessions
      try {
        const [vtData, seData] = await Promise.all([
          managerApi.getVehicleTypes(),
          managerApi.getAllSessions(cleanBranchId ? { parkingBranchId: Number(cleanBranchId), branchId: Number(cleanBranchId) } : {})
        ]);
        vt = vtData;
        se = seData;
      } catch (err) {
        console.error("Failed to fetch vehicle types or sessions", err);
        vt = [];
        se = [];
      }
      const parsedFloors = Array.isArray(fl) ? fl : (fl?.content || []);
      const parsedZones = Array.isArray(zo) ? zo : (zo?.content || []);
      const parsedSessions = Array.isArray(se) ? se : (se?.content || []);

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

      setFloors(cleanBranchId
        ? parsedFloors.filter(f => getBranchId(f) === cleanBranchId)
        : parsedFloors
      );
      setZones(cleanBranchId
        ? parsedZones.filter(z => getBranchId(z) === cleanBranchId)
        : parsedZones
      );
      setVtypes(Array.isArray(vt) ? vt : []);
      setSessions(cleanBranchId
        ? parsedSessions.filter(s => getBranchId(s) === cleanBranchId)
        : parsedSessions
      );
    } catch (err) { 
      console.error("fetchData error:", err);
      setFloors([]); setZones([]); setVtypes([]); setSessions([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [branchId]);

  // Sync Form Data when Edit Zone Target changes
  useEffect(() => {
    if (editZoneTarget) {
      const originalZone = zones.find(item => zoneId(item) === editZoneTarget.id);
      if (originalZone) {
        setZForm({
          name: originalZone.zoneName || '',
          total: String(originalZone.capacity || ''),
          floorId: String(originalZone.parkingFloorId || ''),
          vtId: String(originalZone.vehicleTypeId || (originalZone.vehicleType && vtId(originalZone.vehicleType)) || '')
        });
      }
    } else {
      setZForm(emptyZone);
    }
  }, [editZoneTarget, zones]);

  // Sync Form Data when Edit Floor Target changes
  useEffect(() => {
    if (editFloorTarget) {
      const originalFloor = floors.find(item => floorId(item) === editFloorTarget.id);
      if (originalFloor) {
        setFForm({
          name: originalFloor.floorName || '',
          code: originalFloor.floorCode || '',
          capacity: String(originalFloor.capacity || ''),
          floorNumber: String(originalFloor.floorNumber !== undefined && originalFloor.floorNumber !== null ? originalFloor.floorNumber : '')
        });
      }
    } else {
      setFForm(emptyFloor);
    }
  }, [editFloorTarget, floors]);

  useEffect(() => {
    if (!editZoneTarget) {
      const first = floors.find(f => !zones.some(z => sid(zoneFlId(z), floorId(f))));
      setZForm(p => ({ ...p,
        floorId: p.floorId && !zones.some(z => sid(zoneFlId(z), p.floorId)) ? p.floorId : floorId(first) || '',
        vtId: p.vtId || vtId(vtypes[0]) || '',
      }));
    }
  }, [floors, zones, vtypes, editZoneTarget]);

  /* ── derived ── */
  // Gom nhóm số lượng xe đang gửi thực tế (sessionStatus = ACTIVE) theo vehicleTypeId
  const activeCountByVt = {};
  sessions.forEach(s => {
    const isAct = (s.sessionStatus || s.status) === 'ACTIVE';
    const vtIdOfSession = s.vehicleTypeId;
    if (isAct && vtIdOfSession) {
      activeCountByVt[vtIdOfSession] = (activeCountByVt[vtIdOfSession] || 0) + 1;
    }
  });

  // Sao chép số lượng để phân bổ dần vào các phân khu của loại xe đó
  const remainingCountByVt = { ...activeCountByVt };
  const zoneOccupancyMap = {};

  // Sắp xếp phân khu theo ID để đảm bảo phân bổ nhất quán
  const sortedZones = [...zones].sort((a, b) => zoneId(a) - zoneId(b));
  sortedZones.forEach(z => {
    const zid = zoneId(z);
    const vt = z.vehicleTypeId || (z.vehicleType && vtId(z.vehicleType));
    const cap = zoneCap(z);

    if (vt && remainingCountByVt[vt] !== undefined) {
      const activeForVt = remainingCountByVt[vt];
      const used = Math.min(cap, activeForVt);
      zoneOccupancyMap[zid] = used;
      remainingCountByVt[vt] -= used;
    } else {
      zoneOccupancyMap[zid] = 0;
    }
  });

  const dFloors = floors.map(f => {
    const fid = floorId(f);
    const fz  = zones.filter(z => sid(zoneFlId(z), fid));
    const slots = Number(f.capacity || fz.reduce((s, z) => s + zoneCap(z), 0));
    // Tính tổng số xe đang đỗ thực tế trong các phân khu của tầng này từ zoneOccupancyMap
    const used  = fz.reduce((s, z) => s + (zoneOccupancyMap[zoneId(z)] || 0), 0);
    const pct   = slots > 0 ? Math.round(used / slots * 100) : 0;
    return { code: f.floorCode || String(fid), name: floorName(f), pct, slots, used, id: fid };
  });

  const dZones = zones.map(z => {
    const total = zoneCap(z);
    // Lấy số slot đã dùng được tính toán động từ database sessions
    const used = zoneOccupancyMap[zoneId(z)] || 0;
    const pct   = total > 0 ? Math.round(used / total * 100) : 0;
    const fl    = dFloors.find(f => sid(f.id, zoneFlId(z)));
    return { id: zoneId(z), name: zoneName(z), used, total, pct, floor: fl?.code || String(zoneFlId(z)),
      status: pct >= 100 ? 'Full' : 'Available', color: pct >= 100 ? 'danger' : 'success', floorId: zoneFlId(z) };
  });

  const filtered = selFloor === 'ALL' ? dZones : dZones.filter(b => b.floor === selFloor);
  
  // Tầng trống để tạo phân khu: Loại trừ các tầng đã có phân khu (ngoại trừ chính phân khu đang được sửa)
  const avFloors = dFloors.filter(f => 
    !zones.some(z => sid(zoneFlId(z), f.id)) || 
    (editZoneTarget && sid(editZoneTarget.floorId, f.id))
  );
  
  const totalSlots = dFloors.reduce((a, f) => a + f.slots, 0);
  const totalUsed  = dFloors.reduce((a, f) => a + f.used,  0);
  const totalPct   = totalSlots > 0 ? Math.round(totalUsed / totalSlots * 100) : 0;
  const canSaveZone = (avFloors.length > 0 || editZoneTarget) && vtypes.length > 0 && !saving;

  /* ── handlers ── */
  const handleAddZone = async () => {
    setZErr('');
    if (!zForm.name.trim())  return setZErr('Vui lòng nhập tên phân khu.');
    if (!zForm.floorId)      return setZErr('Vui lòng chọn tầng.');
    if (!zForm.vtId)         return setZErr('Vui lòng chọn loại phương tiện.');
    if (Number(zForm.total) <= 0) return setZErr('Tổng slots phải lớn hơn 0.');
    const managerBranchId = localStorage.getItem('parkingBranchId');
    try {
      setSaving(true);
      await managerApi.createZone({ 
        zoneName: zForm.name.trim(), 
        capacity: Number(zForm.total), 
        parkingFloorId: Number(zForm.floorId), 
        vehicleTypeId: Number(zForm.vtId),
        ...(managerBranchId && { parkingBranchId: Number(managerBranchId) })
      });
      setModZone(false); setZForm(emptyZone); fetchData();
      toast.success('Thêm phân khu mới thành công!');
    } catch (e) { setZErr(apiErr(e)); } finally { setSaving(false); }
  };

  const handleEditZone = async () => {
    setZErr('');
    if (!zForm.name.trim())  return setZErr('Vui lòng nhập tên phân khu.');
    if (!zForm.floorId)      return setZErr('Vui lòng chọn tầng.');
    if (!zForm.vtId)         return setZErr('Vui lòng chọn loại phương tiện.');
    if (Number(zForm.total) <= 0) return setZErr('Tổng slots phải lớn hơn 0.');
    const managerBranchId = localStorage.getItem('parkingBranchId');
    try {
      setSaving(true);
      await managerApi.updateZone(editZoneTarget.id, { 
        zoneName: zForm.name.trim(), 
        capacity: Number(zForm.total), 
        parkingFloorId: Number(zForm.floorId), 
        vehicleTypeId: Number(zForm.vtId),
        ...(managerBranchId && { parkingBranchId: Number(managerBranchId) })
      });
      setEditZoneTarget(null); setZForm(emptyZone); fetchData();
      toast.success('Cập nhật phân khu thành công!');
    } catch (e) { setZErr(apiErr(e)); } finally { setSaving(false); }
  };

  const handleAddFloor = async () => {
    setFErr('');
    if (!fForm.name.trim()) return setFErr('Vui lòng nhập tên tầng.');
    const managerBranchId = localStorage.getItem('parkingBranchId');
    try {
      setSaving(true);
      const payload = { 
        floorName: fForm.name.trim(), 
        ...(fForm.code && { floorCode: fForm.code }), 
        ...(fForm.floorNumber !== '' && { floorNumber: Number(fForm.floorNumber) }),
        ...(Number(fForm.capacity) > 0 && { capacity: Number(fForm.capacity) }),
        parkingBranchId: managerBranchId ? Number(managerBranchId) : 1
      };
      await managerApi.createFloor(payload);
      setModFloor(false); setFForm(emptyFloor); fetchData();
      toast.success('Thêm tầng mới thành công!');
    } catch (e) { setFErr(apiErr(e)); } finally { setSaving(false); }
  };

  const handleEditFloor = async () => {
    setFErr('');
    if (!fForm.name.trim()) return setFErr('Vui lòng nhập tên tầng.');
    const managerBranchId = localStorage.getItem('parkingBranchId');
    try {
      setSaving(true);
      const payload = { 
        floorName: fForm.name.trim(), 
        ...(fForm.code && { floorCode: fForm.code }), 
        ...(fForm.floorNumber !== '' && { floorNumber: Number(fForm.floorNumber) }),
        ...(Number(fForm.capacity) > 0 && { capacity: Number(fForm.capacity) }),
        parkingBranchId: managerBranchId ? Number(managerBranchId) : 1
      };
      await managerApi.updateFloor(editFloorTarget.id, payload);
      setEditFloorTarget(null); setFForm(emptyFloor); fetchData();
      toast.success('Cập nhật tầng thành công!');
    } catch (e) { setFErr(apiErr(e)); } finally { setSaving(false); }
  };

  const handleDeleteZone = async () => {
    setZErr('');
    try {
      setSaving(true);
      await managerApi.deleteZone(modDel.id);
      setModDel(null); fetchData();
      toast.success('Xóa phân khu thành công!');
    } catch (e) { setDErr(apiErr(e)); } finally { setSaving(false); }
  };

  const handleDeleteFloor = async () => {
    setFErr('');
    try {
      setSaving(true);
      await managerApi.deleteFloor(delFloorTarget.id);
      setDelFloorTarget(null); fetchData();
      toast.success('Xóa tầng bãi xe thành công!');
    } catch (e) {
      toast.error('Không thể xóa tầng này vì có các phân khu hoặc xe đang đỗ liên kết!');
    } finally {
      setSaving(false);
    }
  };

  /* ── render ── */
  return (
    <div className="d-flex flex-column gap-3">

      {/* Filter bar */}
      <div className="d-flex flex-wrap align-items-center gap-2 bg-white px-3 py-2 rounded-3 border">
        <span className="fw-bold small me-2">Chọn tầng / phân khu:</span>
        {[{ code: 'ALL', name: 'Tất cả' }, ...dFloors].map(f => (
          <Button key={f.code} size="sm" variant={selFloor === f.code ? 'dark' : 'outline-secondary'}
            onClick={() => setSelFloor(f.code)} className="rounded-3 fw-semibold" style={{ fontSize: '0.75rem' }}>
            {f.name}
          </Button>
        ))}
        <div className="ms-auto">
          <Button size="sm" variant="outline-secondary" className="rounded-3 fw-bold d-flex align-items-center gap-1"
            onClick={() => setModFloor(true)} style={{ fontSize: '0.75rem' }}>
            <Building2 size={13} /> Thêm tầng
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="row g-3">
        {/* Zone cards */}
        <div className="col-9">
          <div className="row row-cols-3 g-3">
            {loading ? (
              <div className="col-12 text-center text-muted py-4">Đang tải dữ liệu sơ đồ...</div>
            ) : filtered.length === 0 ? (
              <div className="col-12 text-center text-muted py-4 border rounded-3">Chưa có dữ liệu phân khu.</div>
            ) : filtered.map(b => (
              <div key={b.id} className="col">
                <div className="card border rounded-3 h-100 position-relative p-3">
                  <div className="position-absolute top-0 end-0 m-2 d-flex gap-1">
                    <button className="btn btn-sm btn-outline-secondary p-1 rounded-2"
                      style={{ lineHeight: 1, padding: '2px 4px', border: '1px solid #cbd5e1' }} title="Sửa phân khu"
                      onClick={() => setEditZoneTarget({ id: b.id, floorId: b.floorId })}>
                      <i className="bi bi-pencil" style={{ fontSize: '0.65rem' }} />
                    </button>
                    <button className="btn btn-sm btn-outline-danger p-1 rounded-2"
                      style={{ lineHeight: 1, padding: '2px 4px', border: '1px solid #fee2e2' }} title="Xóa phân khu"
                      onClick={() => setModDel({ id: b.id, name: b.name })}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="d-flex justify-content-between align-items-start mb-1 pe-5">
                    <span className="fw-bold small">{b.name}</span>
                    <Badge bg={b.color} className="ms-1" style={{ fontSize: '0.6rem' }}>{b.status}</Badge>
                  </div>
                  <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Đã dùng {b.pct}%</div>
                  <ProgressBar now={b.pct} variant="dark" style={{ height: 5 }} className="mb-1" />
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>{b.used} / {b.total} slots</div>
                </div>
              </div>
            ))}

            {/* Add zone card */}
            <div className="col">
              <button className="card border-2 border-dashed rounded-3 w-100 h-100 bg-transparent text-muted d-flex flex-column align-items-center justify-content-center gap-1 p-3"
                style={{ minHeight: 110, cursor: 'pointer', borderStyle: 'dashed' }}
                onClick={() => setModZone(true)}>
                <Plus size={20} />
                <span className="small fw-semibold">Thêm phân khu mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar stats */}
        <div className="col-3 d-flex flex-column gap-3">
          <div className="rounded-3 p-3 text-white" style={{ background: mt.primary }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.8 }} className="mb-1">TỔNG CÔNG SUẤT BÃI XE</div>
            <div className="fw-bold mb-1" style={{ fontSize: '1.8rem' }}>{totalPct}%</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{totalUsed.toLocaleString()} / {totalSlots.toLocaleString()} vị trí</div>
          </div>

          <div className="card border rounded-3 p-3">
            <div className="fw-bold mb-2 small">Chi tiết hiện trạng</div>
            {dFloors.length === 0 ? (
              <div className="text-muted small">Chưa có dữ liệu tầng.</div>
            ) : dFloors.map(r => (
              <div key={r.code}
                className={`d-flex justify-content-between align-items-center px-2 py-1 rounded-2 mb-1 ${selFloor === r.code ? 'bg-dark bg-opacity-10 fw-semibold' : ''}`}
                style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                <span onClick={() => setSelFloor(r.code)} style={{ color: selFloor === r.code ? mt.primary : mt.textMuted, flex: 1 }}>
                  {r.code}&nbsp;{r.name}
                </span>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold me-1" onClick={() => setSelFloor(r.code)} style={{ color: r.pct > 85 ? mt.danger : (selFloor === r.code ? mt.primary : mt.text) }}>{r.pct}%</span>
                  <button className="btn btn-link p-0 text-muted border-0 bg-transparent" title="Sửa tầng" 
                    onClick={(e) => { e.stopPropagation(); setEditFloorTarget({ id: r.id }); }}>
                    <i className="bi bi-pencil" style={{ fontSize: '0.7rem' }} />
                  </button>
                  <button className="btn btn-link p-0 text-danger border-0 bg-transparent" title="Xóa tầng"
                    onClick={(e) => { e.stopPropagation(); setDelFloorTarget({ id: r.id, name: r.name }); }}>
                    <i className="bi bi-trash" style={{ fontSize: '0.7rem' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════ MODAL: Thêm / Sửa phân khu ════ */}
      <Modal show={modZone || !!editZoneTarget} onHide={() => !saving && (setModZone(false), setEditZoneTarget(null), setZErr(''))} centered>
        <GradientModalHeader 
          icon={Layers} 
          title={editZoneTarget ? "Chỉnh sửa phân khu" : "Thêm phân khu mới"} 
          subtitle="Cấu hình thông tin phân khu bãi xe"
          gradient="linear-gradient(135deg, #0f172a 0%, #0d9488 100%)"
          onClose={() => { setModZone(false); setEditZoneTarget(null); setZErr(''); }} 
          disabled={saving} 
        />
        <Modal.Body className="p-4">
          {zErr && <div className="alert alert-danger py-2 small d-flex align-items-center gap-2"><i className="bi bi-exclamation-circle-fill" />{zErr}</div>}
          
          {/* Cảnh báo nếu không còn tầng trống (chỉ khi thêm mới) */}
          {!editZoneTarget && (!floors.length || avFloors.length === 0) && !loading && (
            <div className="alert alert-warning py-2 small d-flex align-items-center gap-2">
              <i className="bi bi-info-circle-fill" />
              {!floors.length ? 'Cần có ít nhất một tầng trước khi thêm phân khu.' : 'Tất cả tầng đã có phân khu. Mỗi tầng chỉ được tạo 1 phân khu.'}
            </div>
          )}

          <Form className="d-flex flex-column gap-3">
            {[
              { label: 'Tên phân khu', icon: 'bi-tag', field: 'name', placeholder: 'Nhập tên phân khu...', type: 'text' },
              { label: 'Tổng số slots', icon: 'bi-hash', field: 'total', placeholder: 'Nhập số slot...', type: 'number' },
            ].map(({ label, icon, field, placeholder, type }) => (
              <Form.Group key={field}>
                <Form.Label className="fw-bold small text-uppercase text-secondary mb-1">{label}</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className={`bi ${icon}`} /></span>
                  <Form.Control type={type} placeholder={placeholder} value={zForm[field]} min={type === 'number' ? 1 : undefined}
                    onChange={e => { setZErr(''); setZForm({ ...zForm, [field]: e.target.value }); }}
                    className="border-start-0" />
                </div>
              </Form.Group>
            ))}
            <Form.Group>
              <Form.Label className="fw-bold small text-uppercase text-secondary mb-1">Thuộc tầng / khu vực</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-layers" /></span>
                <Form.Select value={zForm.floorId} disabled={avFloors.length === 0} className="border-start-0"
                  onChange={e => { setZErr(''); setZForm({ ...zForm, floorId: e.target.value }); }}>
                  <option value="">{avFloors.length ? 'Chọn tầng...' : 'Không còn tầng trống'}</option>
                  {avFloors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Form.Select>
              </div>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fw-bold small text-uppercase text-secondary mb-1">Loại phương tiện</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-car-front" /></span>
                <Form.Select value={zForm.vtId} className="border-start-0"
                  onChange={e => { setZErr(''); setZForm({ ...zForm, vtId: e.target.value }); }}>
                  <option value="">Chọn loại xe...</option>
                  {vtypes.map(v => <option key={vtId(v)} value={vtId(v)}>{vtName(v)}</option>)}
                </Form.Select>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light border-top">
          <Button variant="outline-secondary" onClick={() => { setModZone(false); setEditZoneTarget(null); setZErr(''); }} disabled={saving}>Hủy</Button>
          <Button disabled={!canSaveZone} onClick={editZoneTarget ? handleEditZone : handleAddZone}
            style={{ background: canSaveZone ? 'linear-gradient(135deg,#0f172a,#0d9488)' : undefined, border: 'none' }}>
            {saving ? <><Loader2 size={15} className="spin me-1" />Đang lưu...</> : 'Lưu lại'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ════ MODAL: Thêm / Sửa tầng ════ */}
      <Modal show={modFloor || !!editFloorTarget} onHide={() => !saving && (setModFloor(false), setEditFloorTarget(null), setFErr(''))} centered>
        <GradientModalHeader 
          icon={Building2} 
          title={editFloorTarget ? "Chỉnh sửa tầng" : "Thêm tầng mới"} 
          subtitle="Cấu hình thông tin tầng bãi xe mới cho hệ thống"
          gradient="linear-gradient(135deg, #1e3a5f 0%, #0d9488 100%)"
          onClose={() => { setModFloor(false); setEditFloorTarget(null); setFErr(''); }} 
          disabled={saving} 
        />
        <Modal.Body className="p-4">
          {fErr && <div className="alert alert-danger py-2 small d-flex align-items-center gap-2"><i className="bi bi-exclamation-circle-fill" />{fErr}</div>}
          <Form className="d-flex flex-column gap-3">
            {[
              { label: 'Tên tầng *', icon: 'bi-building', field: 'name', placeholder: 'Ví dụ: Tầng 1, Tầng trệt...' },
              { label: 'Số tầng (floor number)', icon: 'bi-sort-numeric-down', field: 'floorNumber', placeholder: 'Ví dụ: 1, 2, -1...', type: 'number' },
              { label: 'Mã tầng (tuỳ chọn)', icon: 'bi-tag', field: 'code', placeholder: 'Ví dụ: F1, G0, B1...' },
              { label: 'Sức chứa của tầng (slots)', icon: 'bi-grid-3x3-gap', field: 'capacity', placeholder: 'Ví dụ: 50, 100...', type: 'number' },
            ].map(({ label, icon, field, placeholder, type }) => (
              <Form.Group key={field}>
                <Form.Label className="fw-bold small text-uppercase text-secondary mb-1">{label}</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className={`bi ${icon}`} /></span>
                  <Form.Control type={type || 'text'} placeholder={placeholder} value={fForm[field]}
                    onChange={e => { setFErr(''); setFForm({ ...fForm, [field]: e.target.value }); }}
                    className="border-start-0" />
                </div>
              </Form.Group>
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light border-top">
          <Button variant="outline-secondary" onClick={() => { setModFloor(false); setEditFloorTarget(null); setFErr(''); }} disabled={saving}>Hủy</Button>
          <Button disabled={saving || !fForm.name.trim()} onClick={editFloorTarget ? handleEditFloor : handleAddFloor}
            style={{ background: fForm.name.trim() ? 'linear-gradient(135deg,#1e3a5f,#0d9488)' : undefined, border: 'none' }}>
            {saving ? <><Loader2 size={15} className="spin me-1" />Đang tạo...</> : (editFloorTarget ? 'Lưu lại' : 'Tạo tầng')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ════ MODAL: Xác nhận xóa phân khu ════ */}
      <Modal show={!!modDel} onHide={() => !saving && (setModDel(null), setDErr(''))} centered>
        <GradientModalHeader icon={Trash2} title="Xóa phân khu" subtitle="Hành động này không thể hoàn tác"
          gradient="linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)"
          onClose={() => { setModDel(null); setDErr(''); }} disabled={saving} />
        <Modal.Body className="p-4">
          {dErr && <div className="alert alert-danger py-2 small">{dErr}</div>}
          <p className="mb-1">Bạn có chắc muốn xóa phân khu <strong className="text-danger">"{modDel?.name}"</strong>?</p>
          <p className="text-muted small mb-0">Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.</p>
        </Modal.Body>
        <Modal.Footer className="bg-light border-top">
          <Button variant="outline-secondary" onClick={() => { setModDel(null); setDErr(''); }} disabled={saving}>Hủy</Button>
          <Button variant="danger" onClick={handleDeleteZone} disabled={saving}
            className="d-flex align-items-center gap-2">
            {saving ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
            {saving ? 'Đang xóa...' : 'Xóa phân khu'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ════ MODAL: Xác nhận xóa tầng ════ */}
      <Modal show={!!delFloorTarget} onHide={() => !saving && setDelFloorTarget(null)} centered>
        <GradientModalHeader icon={Trash2} title="Xóa tầng bãi xe" subtitle="Xóa tầng vật lý khỏi hệ thống"
          gradient="linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)"
          onClose={() => setDelFloorTarget(null)} disabled={saving} />
        <Modal.Body className="p-4">
          <p className="mb-1">Bạn có chắc chắn muốn xóa tầng <strong className="text-danger">"{delFloorTarget?.name}"</strong>?</p>
          <p className="text-muted small mb-0">Các phân khu và dữ liệu xe cộ liên kết trực tiếp với tầng này có thể bị ảnh hưởng.</p>
        </Modal.Body>
        <Modal.Footer className="bg-light border-top">
          <Button variant="outline-secondary" onClick={() => setDelFloorTarget(null)} disabled={saving}>Hủy</Button>
          <Button variant="danger" onClick={handleDeleteFloor} disabled={saving}
            className="d-flex align-items-center gap-2">
            {saving ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
            {saving ? 'Đang xóa...' : 'Xóa tầng'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
