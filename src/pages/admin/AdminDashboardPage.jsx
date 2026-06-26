import React from 'react';

const AdminDashboardPage = () => {
  const stats = [
    { title: 'TOTAL USERS', value: '24,892', change: '+12%', color: '#10b981' },
    { title: 'ACTIVE SESSIONS', value: '1,402', change: '+8%', color: '#10b981' },
    { title: 'SYSTEM UPTIME', value: '99.98%', change: 'Stable', color: '#3b82f6' },
    { title: 'PENDING TICKETS', value: '14', change: '-2', color: '#ef4444' },
  ];

  return (
    <div>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111322' }}>Dashboard</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>Export</button>
          <button style={{ padding: '10px 16px', backgroundColor: '#1b6eff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>+ Add New User</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eef0f3', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', color: '#787a91', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
              {stat.title}
              <span style={{ color: stat.color }}>{stat.change}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '12px', color: '#111322' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid Placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eef0f3', minHeight: '340px' }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600' }}>User Growth over time</h4>
          <div style={{ height: '240px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
            [Vùng nhúng đồ thị cột cột - Bar Chart]
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eef0f3', minHeight: '340px' }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600' }}>API Usage Distribution</h4>
          <div style={{ height: '240px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
            [Vùng nhúng đồ thị tròn - Donut Chart]
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;