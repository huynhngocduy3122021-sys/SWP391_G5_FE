export default function ZoneOccupancyTable({ zones = [] }) {
  return (
    <div className="vin-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--vin-border)',
      }}>
        <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
          ZONE OCCUPANCY STATUS
        </span>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
          <span><span style={{ color: 'var(--vin-success)' }}>●</span> Normal</span>
          <span><span style={{ color: 'var(--vin-danger)' }}>●</span> Alert</span>
        </div>
      </div>

      <div className="vin-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
        <table className="vin-table">
          <thead>
            <tr>
              <th>CATEGORY</th>
              <th>CURRENT</th>
              <th>STATUS</th>
              <th>FLOW (H)</th>
            </tr>
          </thead>
          <tbody>
            {zones.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '1rem' }}>
                  Chua co du lieu khu vuc tu backend
                </td>
              </tr>
            ) : zones.map((z) => (
              <tr key={z.category}>
                <td style={{ fontWeight: 600, color: '#fff' }}>{z.category}</td>
                <td style={{ color: 'rgba(255,255,255,0.7)' }}>{z.current} / {z.max}</td>
                <td>
                  <span className={`vin-badge ${z.status === 'FULL' ? 'vin-badge--danger' : 'vin-badge--success'}`}>
                    {z.status}
                  </span>
                </td>
                <td style={{ color: 'var(--vin-success)', fontWeight: 600 }}>+{z.flowPerHour}/h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
