import React from 'react';
import { MdFilterList, MdRefresh } from 'react-icons/md';

const SystemLogsPage = () => {
  const logs = [
    { time: '2026-06-21 17:22:01.442', level: 'ERROR', source: 'AuthModule', msg: 'Invalid JWT signature from IP 192.168.1.104. Potential unauthorized access.', color: '#ef4444', bg: '#fee2e2' },
    { time: '2026-06-21 17:15:55.109', level: 'WARNING', source: 'DatabasePool', msg: 'Connection pool exhaustion approaching 85% capacity. Autoscale triggered.', color: '#f59e0b', bg: '#fef3c7' },
    { time: '2026-06-21 17:10:44.012', level: 'INFO', source: 'SystemMonitor', msg: 'Scheduled system health check completed. All nodes reporting operational status.', color: 'var(--vin-primary)', bg: '#dbeafe' },
    { time: '2026-06-21 17:05:12.871', level: 'INFO', source: 'AIModelSvc', msg: 'Inference engine reloaded for model "smart-parking-val". Weights verified.', color: 'var(--vin-primary)', bg: '#dbeafe' },
  ];

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>System Logs</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', border: '1px solid #e2e8f0', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer' }}><MdRefresh /> Refresh</button>
        </div>
      </div>

      {/* Filter Section */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eef0f3', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>LOG LEVEL</label>
          <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none' }}>
            <option>All Levels</option>
            <option>Error</option>
            <option>Warning</option>
            <option>Info</option>
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>FULL-TEXT SEARCH</label>
          <input type="text" placeholder="Filter by message or source..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none' }} />
        </div>
        <button style={{ padding: '10px 24px', backgroundColor: 'var(--vin-bg-card)', color: 'var(--vin-text-main)', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Apply Filters</button>
      </div>

      {/* Logs Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0f3', fontWeight: '600', fontSize: '16px' }}>Log Streams</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #eef0f3' }}>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>TIMESTAMP</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>LEVEL</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>SOURCE</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>MESSAGE</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #eef0f3' }}>
                <td style={{ padding: '14px 20px', fontSize: '14px', color: '#334155' }}>{log.time}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: log.color, backgroundColor: log.bg, padding: '4px 8px', borderRadius: '4px' }}>{log.level}</span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>{log.source}</td>
                <td style={{ padding: '14px 20px', fontSize: '14px', color: '#64748b' }}>{log.msg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SystemLogsPage;