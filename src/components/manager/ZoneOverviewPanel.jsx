import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../../api/manager';

const getFloorId = (floor) => floor?.parkingFloorId || floor?.id || '';
const getFloorName = (floor) => floor?.floorName || floor?.name || floor?.floorCode || String(getFloorId(floor));
const getZoneId = (zone) => zone?.parkingZoneId || zone?.id || zone?.zoneId || '';
const getZoneName = (zone) => zone?.zoneName || zone?.name || `Zone ${getZoneId(zone)}`;
const getZoneCapacity = (zone) => Number(zone?.capacity || zone?.totalSlots || zone?.total || 0);
const getZoneUsed = (zone) => Number(zone?.usedSlots || zone?.occupiedSlots || zone?.currentOccupancy || zone?.used || 0);

export default function ZoneOverviewPanel() {
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZoneForm, setNewZoneForm] = useState({
    name: '',
    total: 0,
    floorId: '',
    vehicleTypeId: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [floorsData, zonesData, vtData] = await Promise.all([
        managerApi.getAllFloors(),
        managerApi.getAllZones(),
        managerApi.getVehicleTypes(),
      ]);
      setFloors(Array.isArray(floorsData) ? floorsData : []);
      setZones(Array.isArray(zonesData) ? zonesData : []);
      setVehicleTypes(Array.isArray(vtData) ? vtData : []);
    } catch (err) {
      console.error('Loi khi tai du lieu manager:', err);
      setFloors([]);
      setZones([]);
      setVehicleTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setNewZoneForm((prev) => ({
      ...prev,
      floorId: prev.floorId || getFloorId(floors[0]) || '',
      vehicleTypeId: prev.vehicleTypeId || vehicleTypes[0]?.vehicleTypeId || '',
    }));
  }, [floors, vehicleTypes]);

  const displayFloors = floors.map((floor) => {
    const floorId = getFloorId(floor);
    const floorZones = zones.filter((zone) => zone.parkingFloorId === floorId || zone.floorId === floorId);
    const slots = Number(floor.capacity || floor.slots || floorZones.reduce((sum, zone) => sum + getZoneCapacity(zone), 0));
    const used = Number(floor.usedSlots || floor.occupiedSlots || floorZones.reduce((sum, zone) => sum + getZoneUsed(zone), 0));
    const pct = slots > 0 ? Math.round((used / slots) * 100) : 0;

    return {
      code: floor.floorCode || floor.code || String(floorId),
      name: getFloorName(floor),
      pct,
      slots,
      used,
      id: floorId,
    };
  });

  const displayZones = zones.map((zone) => {
    const total = getZoneCapacity(zone);
    const used = getZoneUsed(zone);
    const pct = total > 0 ? Math.round((used / total) * 100) : 0;
    const floor = displayFloors.find((f) => f.id === zone.parkingFloorId || f.id === zone.floorId);
    const status = zone.status || (pct >= 100 ? 'Full' : 'Available');
    const statusColor = pct >= 100 ? mt.danger : mt.success;

    return {
      id: getZoneId(zone),
      name: getZoneName(zone),
      status,
      statusColor,
      used,
      total,
      pct,
      floor: floor?.code || String(zone.parkingFloorId || zone.floorId || ''),
    };
  });

  const filteredBlocks = selectedFloor === 'ALL'
    ? displayZones
    : displayZones.filter((b) => b.floor === selectedFloor);

  const totalSlots = displayFloors.reduce((acc, f) => acc + (f.slots || 0), 0);
  const totalUsed = displayFloors.reduce((acc, f) => acc + (f.used || 0), 0);
  const totalPct = totalSlots > 0 ? Math.round((totalUsed / totalSlots) * 100) : 0;

  const handleAddZone = async () => {
    if (!newZoneForm.name.trim()) {
      alert('Vui long nhap ten phan khu!');
      return;
    }

    const payload = {
      zoneName: newZoneForm.name.trim(),
      capacity: Number(newZoneForm.total),
      parkingFloorId: Number(newZoneForm.floorId),
      vehicleTypeId: Number(newZoneForm.vehicleTypeId),
    };

    try {
      await managerApi.createZone(payload);
      setShowAddModal(false);
      setNewZoneForm({
        name: '',
        total: 0,
        floorId: getFloorId(floors[0]) || '',
        vehicleTypeId: vehicleTypes[0]?.vehicleTypeId || '',
      });
      fetchData();
    } catch (err) {
      console.error('Loi khi luu phan khu vao backend:', err);
      alert('Khong luu duoc phan khu vao backend.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        background: '#fff',
        padding: '10px 16px',
        borderRadius: '12px',
        border: `1px solid ${mt.border}`,
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: mt.text, marginRight: '10px' }}>
          Chon tang / phan khu:
        </span>
        {[{ code: 'ALL', name: 'Tat ca' }, ...displayFloors].map((f) => (
          <button
            key={f.code}
            type="button"
            onClick={() => setSelectedFloor(f.code)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: `1px solid ${selectedFloor === f.code ? mt.primary : mt.border}`,
              background: selectedFloor === f.code ? mt.primary : 'transparent',
              color: selectedFloor === f.code ? '#fff' : mt.textMuted,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', alignContent: 'start' }}>
          {loading ? (
            <div style={{ gridColumn: 'span 3', padding: '2rem', textAlign: 'center', color: mt.textMuted }}>
              Dang tai du lieu so do...
            </div>
          ) : filteredBlocks.length === 0 ? (
            <div style={{ gridColumn: 'span 3', padding: '2rem', textAlign: 'center', color: mt.textMuted, ...card }}>
              Chua co du lieu phan khu tu backend.
            </div>
          ) : filteredBlocks.map((b) => (
            <div key={b.id || b.name} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: mt.text }}>{b.name}</span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: `${b.statusColor}1A`, color: b.statusColor,
                }}>{b.status}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: mt.textMuted, marginBottom: 10 }}>Da dung {b.pct}%</div>
              <div style={{ height: 6, borderRadius: 4, background: '#f1f5f9', marginBottom: 6 }}>
                <div style={{ width: `${b.pct}%`, height: '100%', borderRadius: 4, background: mt.primary }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: mt.textMuted }}>{b.used} / {b.total} slots</div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              ...card, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px dashed ${mt.border}`, color: mt.textMuted, cursor: 'pointer', fontWeight: 600,
              background: 'transparent', minHeight: 120,
            }}
          >
            + Them phan khu moi
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ ...card, background: mt.primary, color: '#fff' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 6 }}>TONG CONG SUAT BAI XE</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalPct}%</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 12 }}>{totalUsed.toLocaleString()} / {totalSlots.toLocaleString()} vi tri</div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Chi tiet hien trang</div>
            {displayFloors.length === 0 ? (
              <div style={{ color: mt.textMuted, fontSize: '0.8rem' }}>Chua co du lieu tang tu backend.</div>
            ) : displayFloors.map((r) => (
              <div
                key={r.code}
                onClick={() => setSelectedFloor(r.code)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  background: selectedFloor === r.code ? `${mt.primary}1A` : 'transparent',
                  fontWeight: selectedFloor === r.code ? 600 : 'normal',
                  marginBottom: '2px',
                }}
              >
                <span style={{ color: selectedFloor === r.code ? mt.primary : mt.textMuted }}>
                  {r.code} &nbsp;{r.name}
                </span>
                <span style={{ fontWeight: 700, color: r.pct > 85 ? mt.danger : (selectedFloor === r.code ? mt.primary : mt.text) }}>
                  {r.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: `1px solid ${mt.border}`,
            width: '450px',
            maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: `1px solid ${mt.border}`,
              background: '#f8fafc',
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: mt.text }}>Them phan khu moi</h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: mt.textMuted, lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: mt.textMuted }}>
                Ten phan khu
                <input
                  type="text"
                  placeholder="Nhap ten phan khu..."
                  value={newZoneForm.name}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, name: e.target.value })}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${mt.border}`, fontSize: '0.85rem', color: mt.text, outline: 'none' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: mt.textMuted }}>
                Thuoc tang / khu vuc
                <select
                  value={newZoneForm.floorId}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, floorId: Number(e.target.value) })}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${mt.border}`, fontSize: '0.85rem', color: mt.text, outline: 'none', background: '#fff', cursor: 'pointer' }}
                >
                  <option value="">Chon tang</option>
                  {displayFloors.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: mt.textMuted }}>
                Loai phuong tien
                <select
                  value={newZoneForm.vehicleTypeId}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, vehicleTypeId: Number(e.target.value) })}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${mt.border}`, fontSize: '0.85rem', color: mt.text, outline: 'none', background: '#fff', cursor: 'pointer' }}
                >
                  <option value="">Chon loai xe</option>
                  {vehicleTypes.map((vt) => (
                    <option key={vt.vehicleTypeId} value={vt.vehicleTypeId}>{vt.typeName}</option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: mt.textMuted }}>
                Tong so slots
                <input
                  type="number"
                  min="0"
                  value={newZoneForm.total}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, total: Number(e.target.value) })}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${mt.border}`, fontSize: '0.85rem', color: mt.text, outline: 'none' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: `1px solid ${mt.border}`, background: '#f8fafc' }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${mt.border}`, background: '#fff', color: mt.textMuted, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Huy</button>
              <button type="button" onClick={handleAddZone} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: mt.primary, color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Luu lai</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
