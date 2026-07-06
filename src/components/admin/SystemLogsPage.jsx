import React, { useState, useMemo } from 'react';
import { MdFilterList, MdRefresh, MdMoreVert, MdFileDownload, MdCalendarToday, MdShowChart, MdErrorOutline, MdStorage, MdInfoOutline } from 'react-icons/md';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

// Generate dummy logs
const generateDummyLogs = () => {
  const sources = ['AuthModule', 'DatabasePool', 'SystemMonitor', 'AIModelSvc', 'PaymentsGateway', 'BookingEngine', 'IoTController'];
  const messages = {
    ERROR: ['Invalid JWT signature from IP 192.168.1.104. Potential unauthorized access.', 'Stripe API timeout on transaction TX_992182. Retrying in 500ms...', 'NullPointerException in BookingService.java:142', 'Failed to connect to Redis cache cluster.'],
    WARNING: ['Connection pool exhaustion approaching 85% capacity. Autoscaling triggered.', 'High latency detected on Payment API (1200ms)', 'Camera #04 feed degraded. Signal strength 42%.'],
    INFO: ['Scheduled system health check completed. All nodes reporting operational status.', 'Inference engine reloaded for model "customer-churn-v4". Weights verified.', 'User admin@system.local logged in successfully.', 'Daily database backup completed (Size: 4.2GB).']
  };

  const logs = [];
  let currentDate = new Date();
  
  for (let i = 0; i < 250; i++) {
    const level = Math.random() > 0.8 ? 'ERROR' : Math.random() > 0.5 ? 'WARNING' : 'INFO';
    const source = sources[Math.floor(Math.random() * sources.length)];
    const msgList = messages[level];
    const msg = msgList[Math.floor(Math.random() * msgList.length)];
    
    currentDate = new Date(currentDate.getTime() - Math.floor(Math.random() * 3600000)); // subtract random minutes
    
    logs.push({
      id: `LOG-${10000 + i}`,
      timestamp: currentDate.toISOString().replace('T', ' ').substring(0, 23),
      level,
      source,
      msg
    });
  }
  return logs;
};

const ALL_LOGS = generateDummyLogs();

const SystemLogsPage = () => {
  const [logs] = useState(ALL_LOGS);
  const [logLevel, setLogLevel] = useState('All Levels');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [liveFeed, setLiveFeed] = useState(false);
  const itemsPerPage = 10;

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchLevel = logLevel === 'All Levels' || log.level === logLevel.toUpperCase();
      const matchSearch = log.msg.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.source.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLevel && matchSearch;
    });
  }, [logs, logLevel, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const getLevelStyle = (level) => {
    switch (level) {
      case 'ERROR': return { color: '#ef4444', bg: '#fee2e2' };
      case 'WARNING': return { color: '#059669', bg: '#d1fae5' }; // Greenish as in the screenshot
      case 'INFO': return { color: '#3b82f6', bg: '#dbeafe' };
      default: return { color: '#64748b', bg: '#f1f5f9' };
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
          <span style={{ cursor: 'pointer', hover: { color: '#0f172a' } }}>Dashboard</span>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: '#0f172a', fontWeight: '700' }}>System Logs</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#0f172a', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
            <MdFileDownload size={16} /> Export
          </button>
        </div>
      </div>

      {/* Filters Box */}
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 2.5fr', gap: '20px', alignItems: 'end' }}>
          {/* Date Range */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Range</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#334155', fontSize: '13px' }}>
              <MdCalendarToday size={16} color="#64748b" />
              <span>Oct 24, 2026 - Oct 31, 2026</span>
            </div>
          </div>
          
          {/* Log Level */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Log Level</label>
            <select 
              value={logLevel}
              onChange={(e) => { setLogLevel(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none', color: '#334155', fontSize: '13px' }}
            >
              <option>All Levels</option>
              <option>Error</option>
              <option>Warning</option>
              <option>Info</option>
            </select>
          </div>

          {/* Full Text Search */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full-Text Search</label>
              <input 
                type="text" 
                placeholder="Filter by message or source..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none', color: '#334155', fontSize: '13px', boxSizing: 'border-box' }} 
              />
            </div>
            
            {/* Live Feed Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>Live Feed</span>
              <div 
                onClick={() => setLiveFeed(!liveFeed)}
                style={{ 
                  width: '36px', height: '20px', backgroundColor: liveFeed ? '#0f172a' : '#cbd5e1', 
                  borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s'
                }}
              >
                <div style={{
                  width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '50%',
                  position: 'absolute', top: '2px', left: liveFeed ? '18px' : '2px', transition: 'left 0.2s'
                }} />
              </div>
            </div>

            <button style={{ padding: '10px 24px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
              Apply Filters
            </button>
          </div>
        </div>

      </div>

      {/* Logs Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Log Streams</h3>
          <div style={{ display: 'flex', gap: '12px', color: '#475569' }}>
            <MdRefresh size={20} style={{ cursor: 'pointer' }} />
            <MdMoreVert size={20} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 24px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', width: '220px' }}>TIMESTAMP</th>
              <th style={{ padding: '14px 24px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>LEVEL</th>
              <th style={{ padding: '14px 24px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', width: '180px' }}>SOURCE</th>
              <th style={{ padding: '14px 24px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MESSAGE</th>
            </tr>
          </thead>
          <tbody>
            {currentLogs.length > 0 ? currentLogs.map((log) => {
              const style = getLevelStyle(log.level);
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>{log.timestamp}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      fontSize: '10px', fontWeight: '800', color: style.color, backgroundColor: style.bg, 
                      padding: '4px 8px', borderRadius: '4px' 
                    }}>
                      {log.level}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{log.source}</td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>{log.msg}</td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  No logs found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Showing {filteredLogs.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length.toLocaleString()} logs
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#0f172a', fontWeight: '600', fontSize: '13px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
                style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : '#64748b', fontSize: '16px', padding: '4px' }}
              >
                |&lt;
              </button>
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
                style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : '#64748b', fontSize: '16px', padding: '4px' }}
              >
                &lt;
              </button>
            </div>
            <span style={{ color: '#2563eb' }}>Page {currentPage} of {totalPages || 1}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                disabled={currentPage === totalPages || totalPages === 0} 
                onClick={() => setCurrentPage(p => p + 1)}
                style={{ background: 'none', border: 'none', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', color: (currentPage === totalPages || totalPages === 0) ? '#cbd5e1' : '#64748b', fontSize: '16px', padding: '4px' }}
              >
                &gt;
              </button>
              <button 
                disabled={currentPage === totalPages || totalPages === 0} 
                onClick={() => setCurrentPage(totalPages)}
                style={{ background: 'none', border: 'none', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', color: (currentPage === totalPages || totalPages === 0) ? '#cbd5e1' : '#64748b', fontSize: '16px', padding: '4px' }}
              >
                &gt;|
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        
        {/* LOG DENSITY */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LOG DENSITY</div>
            <MdShowChart size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            4.2k <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>/hr</span>
          </div>
          <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginBottom: '16px' }}>
            <div style={{ width: '65%', height: '100%', backgroundColor: '#2563eb', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
            <FiTrendingUp color="#16a34a" /> 
            <span><strong style={{ color: '#16a34a' }}>12% increase</strong> from last hour</span>
          </div>
        </div>

        {/* ERROR RATE */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ERROR RATE</div>
            <MdErrorOutline size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626', marginBottom: '16px' }}>
            0.82%
          </div>
          <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginBottom: '16px' }}>
            <div style={{ width: '15%', height: '100%', backgroundColor: '#ef4444', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
            <FiTrendingDown color="#ef4444" /> 
            <span>Stable within normal parameters</span>
          </div>
        </div>

        {/* STORAGE USAGE */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STORAGE USAGE</div>
            <MdStorage size={20} color="#64748b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            856 GB <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>/ 2 TB</span>
          </div>
          <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginBottom: '16px' }}>
            <div style={{ width: '42%', height: '100%', backgroundColor: '#0f172a', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
            <MdInfoOutline color="#64748b" size={16} /> 
            <span>Retention policy: 90 days</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SystemLogsPage;