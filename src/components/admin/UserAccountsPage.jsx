import React, { useState } from 'react';
import { 
  MdOutlineFileDownload, MdOutlineEdit, MdOutlineSecurity, MdOutlineVpnKey, 
  MdOutlineSmartphone, MdOutlineLaptopMac, MdOutlineDesktopWindows, MdOutlineClose, 
  MdOutlineWarningAmber, MdArrowBack, MdOutlineRefresh, MdRefresh, MdBusiness, 
  MdKeyboardArrowDown, MdExpandMore
} from 'react-icons/md';
import { BsArrowDownUp } from 'react-icons/bs';

// --- Ponytail Mini Helper Components ---
const Card = ({ title, icon: Icon, children, action, borderStyle }) => (
  <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: borderStyle || '1px solid #eef0f3', padding: '24px', marginBottom: '24px' }}>
    {title && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: title === 'Danger zone' ? '#ef4444' : '#5e6278', letterSpacing: '0.5px' }}>
          {Icon && <Icon style={{ fontSize: '16px' }} />} {title}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

const Badge = ({ children, color = '#10b981', bg = '#dcfce7', radius = '4px' }) => (
  <span style={{ backgroundColor: bg, color, padding: '2px 8px', borderRadius: radius, fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
    {children}
  </span>
);

const Button = ({ children, primary, icon: Icon, onClick, style = {} }) => (
  <button 
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px 16px', border: primary ? 'none' : '1px solid #eef0f3', borderRadius: '6px', backgroundColor: primary ? '#1b6eff' : '#fff', color: primary ? '#fff' : '#111322', cursor: 'pointer', fontWeight: '600', fontSize: '13px', ...style }}
  >
    {Icon && <Icon style={{ fontSize: '16px' }} />} {children}
  </button>
);

const InfoRow = ({ label, value, valColor = '#111322' }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ fontSize: '11px', fontWeight: '700', color: '#787a91', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '14px', fontWeight: '600', color: valColor }}>{value}</div>
  </div>
);

// --- Main Page Component ---
const UserAccountsPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [activePeriod, setActivePeriod] = useState('This month');
  const [showGrants, setShowGrants] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);

  // Reduced mock data (DRY & YAGNI)
  const branches = ['Branch North', 'Branch South', 'Branch East', 'Branch West'].map(name => ({
    name, desc: 'Regional HQ • ' + name,
    employees: Array(3).fill(0).map((_, i) => ({
      initial: 'JM', name: i === 0 ? 'Jonathan Miller' : 'Elena Janson', score: 98 - i, 
      rating: i === 0 ? 'Exceptional' : 'High', bg: '#dcfce7', color: '#10b981'
    }))
  }));

  const logs = [
    { time: 'Today, 10:42 AM', action: 'Config Update', target: 'Global Firewall Policies', ip: '192.168.1.42', status: 'SUCCESS' },
    { time: 'Today, 09:15 AM', action: 'Login', target: 'Admin Web Portal', ip: '192.168.1.42', status: 'SUCCESS' },
    { time: 'Mar 8, 9:04 AM', action: 'Login', target: 'Admin web portal', ip: '78.143.22.5 (NY)', status: 'FLAGGED' },
  ];

  const sessions = [
    { icon: MdOutlineLaptopMac, name: 'MacBook Pro - Chrome 124', loc: 'Austin, TX · 192.168.1.42', badge: 'Current' },
    { icon: MdOutlineSmartphone, name: 'iPhone 15 - Safari', loc: 'Austin, TX · 192.168.1.55 · 2 hours ago' }
  ];

  if (!selectedUser) {
    // --- SCREEN 1: Branch Performance ---
    return (
      <div style={{ paddingBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#111322' }}>Branch Performance Overview</h2>
            <p style={{ margin: 0, color: '#5e6278', fontSize: '14px' }}>Comprehensive real-time analytics for regional performance metrics.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button icon={MdOutlineFileDownload} style={{ backgroundColor: '#e0f2fe', color: '#0ea5e9', border: 'none' }}>Export Report</Button>
            <Button primary icon={MdRefresh}>Update Data</Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eef0f3', padding: '4px' }}>
            {['Today', 'This month', 'This quarter', 'This year'].map(p => (
              <button key={p} onClick={() => setActivePeriod(p)} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', background: activePeriod === p ? '#111322' : 'transparent', color: activePeriod === p ? '#fff' : '#5e6278', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
          {['Branch', 'Rating'].map(filter => (
             <div key={filter} onClick={() => setShowDropdown(showDropdown === filter ? null : filter)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', border: '1px solid #eef0f3', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#5e6278' }}>
               {filter} <MdKeyboardArrowDown />
             </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {branches.map((b, idx) => (
            <Card key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><MdBusiness /></div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#111322' }}>{b.name}</h4>
                  <div style={{ fontSize: '12px', color: '#787a91', fontWeight: '500' }}>{b.desc}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', paddingBottom: '12px', borderBottom: '1px solid #eef0f3', fontSize: '11px', fontWeight: '700', color: '#787a91' }}>
                <div>EMPLOYEE</div><div>SCORE <BsArrowDownUp/></div><div style={{textAlign:'right'}}>RATING</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0 24px 0' }}>
                {b.employees.map((emp, i) => (
                  <div key={i} onClick={() => setSelectedUser(emp.name)} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f3f5f9', color: '#5e6278', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>{emp.initial}</div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#111322' }}>{emp.name}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{emp.score}</div>
                    <div style={{ textAlign: 'right' }}><Badge bg={emp.bg} color={emp.color} radius="12px">{emp.rating}</Badge></div>
                  </div>
                ))}
              </div>
              <Button style={{ width: '100%', color: '#1b6eff', borderColor: '#1b6eff' }}>View Full Rankings</Button>
            </Card>
          ))}
        </div>
        
        {/* Footer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', backgroundColor: '#eef6ff', borderRadius: '12px', padding: '24px', alignItems: 'center' }}>
          {['GLOBAL AVERAGE SCORE', 'TOTAL ACTIVE STAFF'].map((l, i) => <div key={i}><div style={{ fontSize: '12px', fontWeight: '700', color: '#5e6278', marginBottom: '8px' }}>{l}</div><div style={{ fontSize: '28px', fontWeight: '700' }}>{i===0 ? '95.4%' : '1,248'}</div></div>)}
          <div><div style={{ fontSize: '12px', fontWeight: '700', color: '#5e6278', marginBottom: '8px' }}>KPI STATUS</div><div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '700', color: '#10b981' }}><MdBusiness /> On Track</div></div>
        </div>
      </div>
    );
  }

  // --- SCREEN 2: User Account Details ---
  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: '#5e6278', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          <MdArrowBack style={{ fontSize: '16px', cursor: 'pointer' }} onClick={() => setSelectedUser(null)} /> 
          <span style={{ cursor: 'pointer' }} onClick={() => setSelectedUser(null)}>User Management</span> &gt; <span style={{ color: '#111322' }}>{selectedUser.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button icon={MdOutlineFileDownload}>Export</Button>
          <Button primary icon={MdOutlineEdit}>Edit Account</Button>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <img src={`https://ui-avatars.com/api/?name=${selectedUser.replace(' ', '+')}&background=111322&color=fff&size=80`} alt="Avatar" style={{ borderRadius: '12px' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111322' }}>{selectedUser}</h2>
                <Badge color="#4338ca" bg="#e0e7ff">ADMIN</Badge><Badge>ACTIVE</Badge>
              </div>
              <p style={{ margin: '0 0 16px 0', color: '#5e6278', fontSize: '14px' }}>Senior Infrastructure Architect responsible for Central Region cloud deployments.</p>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        <Card title="PROFILE INFO" icon={MdOutlineEdit} action={<MdOutlineEdit style={{ color: '#787a91', cursor: 'pointer' }} />}>
          <InfoRow label="EMAIL" value={`${selectedUser.toLowerCase().replace(' ', '.')}@enterprise-corp.com`} />
          <InfoRow label="PHONE" value="+1 (512) 555-0198" />
        </Card>

        <Card title="SECURITY" icon={MdOutlineSecurity}>
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <div><div style={{ fontWeight: '700' }}>2FA Active</div><div style={{ fontSize: '12px', color: '#5e6278' }}>Authenticator app</div></div>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#10b981', color: '#fff', textAlign: 'center', fontSize: '12px' }}>✓</div>
          </div>
          <Button style={{ width: '100%', backgroundColor: '#e0f2fe', color: '#1b6eff' }}>RESET PASSWORD</Button>
        </Card>

        <Card title="PERMISSIONS" icon={MdOutlineVpnKey}>
          <InfoRow label="Enterprise Admin" value="Full read/write access." />
          <Button onClick={() => setShowGrants(!showGrants)} style={{ width: '100%', color: '#1b6eff' }}>
            {showGrants ? 'Collapse' : '+12 More Grants'} <MdExpandMore />
          </Button>
        </Card>
      </div>

      <Card title="ACTIVE SESSIONS" action={<Button>Terminate all others</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sessions.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #eef0f3' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.icon /></div>
                <div><div style={{ fontWeight: '600' }}>{s.name} {s.badge && <Badge>{s.badge}</Badge>}</div><div style={{ fontSize: '12px', color: '#787a91' }}>{s.loc}</div></div>
              </div>
              <MdOutlineClose style={{ color: '#9093a3', cursor: 'pointer' }} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="RECENT ACTIVITY" icon={MdOutlineRefresh} action={<Button>Filter</Button>}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eef0f3', color: '#787a91', fontSize: '11px' }}><th style={{ padding: '12px 0' }}>TIMESTAMP</th><th>ACTION</th><th>TARGET</th><th>IP</th><th style={{ textAlign: 'right' }}>STATUS</th></tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eef0f3' }}>
                <td style={{ padding: '16px 0' }}>{log.time}</td><td style={{ fontWeight: '600' }}>{log.action}</td>
                <td style={{ color: '#1b6eff' }}>{log.target}</td><td style={{ color: log.status === 'FLAGGED' ? '#ef4444' : '#5e6278', fontWeight: log.status === 'FLAGGED' ? '600' : 'normal' }}>{log.ip}</td>
                <td style={{ textAlign: 'right' }}>{log.status === 'SUCCESS' ? <span style={{ color: '#10b981', fontWeight: '700', fontSize: '11px' }}>SUCCESS</span> : <Badge color="#ef4444" bg="#fee2e2" radius="12px">FLAGGED</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Danger zone" icon={MdOutlineWarningAmber} borderStyle="1px solid #fee2e2">
        <p style={{ margin: '-10px 0 0 0', color: '#5e6278', fontSize: '14px', paddingBottom: '20px' }}>These actions are irreversible. Proceed with caution.</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button>Deactivate account</Button>
          <Button style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}>Delete account</Button>
        </div>
      </Card>
    </div>
  );
};

export default UserAccountsPage;
