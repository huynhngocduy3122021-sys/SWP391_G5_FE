import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../api/admin';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    users: [],
    sessions: [],
    bookings: [],
    incidents: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, sessionsRes, bookingsRes, incidentsRes] = await Promise.all([
          adminApi.getAllUsers().catch(() => []),
          adminApi.getAllSessions().catch(() => []),
          adminApi.getAllBookings().catch(() => []),
          adminApi.getAllIncidents().catch(() => []),
        ]);
        
        // Extract arrays safely to handle pagination content, data wrappers, or direct arrays
        const users = Array.isArray(usersRes) ? usersRes : (usersRes?.content || usersRes?.data || []);
        const sessions = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes?.content || sessionsRes?.data || []);
        const bookings = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.content || bookingsRes?.data || []);
        const incidents = Array.isArray(incidentsRes) ? incidentsRes : (incidentsRes?.content || incidentsRes?.data || []);

        setData({ users, sessions, bookings, incidents });
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totalUsers = data.users.length;
  const activeSessions = data.sessions.filter(s => s?.sessionStatus === 'ACTIVE').length;
  const totalBookings = data.bookings.length;
  const pendingIncidents = data.incidents.filter(i => i?.status === 'PENDING' || i?.status === 'IN_PROGRESS').length;

  const stats = [
    { title: 'TOTAL USERS', value: loading ? '...' : totalUsers.toLocaleString(), change: 'Live Accounts', color: '#10b981' },
    { title: 'ACTIVE SESSIONS', value: loading ? '...' : activeSessions.toLocaleString(), change: 'Currently Parked', color: '#3b82f6' },
    { title: 'TOTAL BOOKINGS', value: loading ? '...' : totalBookings.toLocaleString(), change: 'Reservation Records', color: '#8b5cf6' },
    { title: 'PENDING INCIDENTS', value: loading ? '...' : pendingIncidents.toLocaleString(), change: 'Requires Review', color: pendingIncidents > 0 ? '#ef4444' : '#10b981' },
  ];

  // User roles grouping
  const roleCounts = data.users.reduce((acc, u) => {
    const r = u.userRole || 'USER';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, { USER: 0, STAFF: 0, MANAGER: 0, ADMIN: 0 });

  const roleStats = [
    { name: 'Customers (USER)', count: roleCounts.USER, color: '#1b6eff' },
    { name: 'Staff (STAFF)', count: roleCounts.STAFF, color: '#10b981' },
    { name: 'Managers (MANAGER)', count: roleCounts.MANAGER, color: '#f59e0b' },
    { name: 'Administrators (ADMIN)', count: roleCounts.ADMIN, color: '#ef4444' },
  ];

  // Sessions status grouping
  const sessionCounts = data.sessions.reduce((acc, s) => {
    const st = s.sessionStatus || 'ACTIVE';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, { ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 });

  const totalSessions = data.sessions.length;

  const sessionStats = [
    { name: 'Active Sessions', count: sessionCounts.ACTIVE, color: '#10b981' },
    { name: 'Completed Sessions', count: sessionCounts.COMPLETED, color: '#3b82f6' },
    { name: 'Cancelled Sessions', count: sessionCounts.CANCELLED, color: '#ef4444' },
  ];

  return (
    <div>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111322' }}>Dashboard Overview</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Real-time telemetry and management controls for the VinParking ecosystem.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => window.print()}
            style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
          >
            Print Report
          </button>
          <button 
            onClick={() => navigate('/admin/users?addNew=true')}
            style={{ padding: '10px 16px', backgroundColor: '#1b6eff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
          >
            + Add New User
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eef0f3', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', color: '#787a91', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
              {stat.title}
              <span style={{ color: stat.color, fontWeight: '700' }}>{stat.change}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '12px', color: '#111322' }}>
              {loading ? (
                <span style={{ fontSize: '18px', color: '#94a3b8' }}>Loading...</span>
              ) : (
                stat.value
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* User Distribution by Role */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eef0f3', minHeight: '340px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>User Accounts Distribution</h4>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>Breakdown of registration categories across the platform.</p>
          
          {loading ? (
            <div style={{ display: 'flex', height: '200px', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Calculating distribution...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {roleStats.map(r => {
                const pct = totalUsers > 0 ? Math.round((r.count / totalUsers) * 100) : 0;
                return (
                  <div key={r.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>
                      <span style={{ color: '#475569' }}>{r.name}</span>
                      <span style={{ color: '#1e293b', fontWeight: '600' }}>{r.count} ({pct}%)</span>
                    </div>
                    <div style={{ height: '12px', borderRadius: '6px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: r.color, borderRadius: '6px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sessions Distribution */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eef0f3', minHeight: '340px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Parking Session Statuses</h4>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>Current activity and historical sessions state.</p>
          
          {loading ? (
            <div style={{ display: 'flex', height: '200px', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Analyzing sessions...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sessionStats.map(s => {
                const pct = totalSessions > 0 ? Math.round((s.count / totalSessions) * 100) : 0;
                return (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: s.color }} />
                      <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>{s.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{s.count}</span>
                      <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>({pct}%)</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: '1px solid #eef0f3', paddingTop: '16px', marginTop: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Total sessions logged: <strong>{totalSessions}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;