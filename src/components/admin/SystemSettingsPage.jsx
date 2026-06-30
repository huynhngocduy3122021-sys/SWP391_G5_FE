import React, { useState } from 'react';
import { MdArrowBack, MdOutlineFileUpload, MdOutlineInfo } from 'react-icons/md';

// --- Ponytail Mini Helper Components ---
const Card = ({ title, children, maxWidth }) => (
  <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', padding: '24px', maxWidth: maxWidth || '100%', marginBottom: '24px' }}>
    {title && <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#111322' }}>{title}</h3>}
    {children}
  </div>
);

const FormGroup = ({ label, children, hint }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#5e6278', marginBottom: '8px' }}>{label}</label>
    {children}
    {hint && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>{hint}</div>}
  </div>
);

const Input = (props) => (
  <input {...props} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #eef0f3', fontSize: '14px', color: '#111322', outline: 'none', ...props.style }} />
);

const Select = ({ options, ...props }) => (
  <select {...props} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #eef0f3', fontSize: '14px', color: '#111322', outline: 'none', ...props.style }}>
    {options.map(opt => <option key={opt}>{opt}</option>)}
  </select>
);

const ToggleRow = ({ title, desc, active, showBorder = true }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showBorder ? '24px' : '0', paddingBottom: showBorder ? '24px' : '0', borderBottom: showBorder ? '1px solid #eef0f3' : 'none' }}>
    <div><div style={{ fontSize: '14px', fontWeight: '600', color: '#111322', marginBottom: '4px' }}>{title}</div>{desc && <div style={{ fontSize: '12px', color: '#787a91' }}>{desc}</div>}</div>
    <div style={{ width: '44px', height: '24px', backgroundColor: active ? '#10b981' : '#e2e8f0', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
      <div style={{ width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: active ? 'auto' : '2px', right: active ? '2px' : 'auto' }}></div>
    </div>
  </div>
);

const Button = ({ children, primary, danger, style = {} }) => (
  <button style={{ padding: '10px 20px', border: primary || danger ? 'none' : '1px solid #eef0f3', borderRadius: '6px', backgroundColor: primary ? '#1b6eff' : danger ? '#fff' : '#fff', color: primary ? '#fff' : danger ? '#ef4444' : '#111322', cursor: 'pointer', fontWeight: '600', fontSize: '13px', ...(danger && {border: '1px solid #ef4444'}), ...style }}>
    {children}
  </button>
);

// --- Main Page Component ---
const SystemSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('General');
  const tabs = ['General', 'Security', 'Notifications', 'Maintenance'];

  const renderGeneral = () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Card title="Branding">
          <FormGroup label="System Name"><Input defaultValue="Enterprise Admin Suite" /></FormGroup>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <FormGroup label="Primary Brand Color">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '40px', height: '40px', backgroundColor: '#0058be', borderRadius: '6px' }}></div><Input defaultValue="#0058be" /></div>
            </FormGroup>
            <FormGroup label="Secondary Brand Color">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '40px', height: '40px', backgroundColor: '#1E293B', borderRadius: '6px' }}></div><Input defaultValue="#1E293B" /></div>
            </FormGroup>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <FormGroup label="Timezone"><Select options={['UTC+07:00 (Asia/Ho_Chi_Minh)', 'UTC+00:00 (GMT)', 'UTC-05:00 (EST)']} /></FormGroup>
            <FormGroup label="Language"><Select options={['English (US)', 'Vietnamese']} /></FormGroup>
          </div>
        </Card>

        <Card title="System Logos">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '32px 16px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#e2e8f0', borderRadius: '8px', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#475569' }}><MdOutlineFileUpload /></div>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>Main Dashboard Logo</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px' }}>SVG, PNG (max 5MB)</div>
              <Button style={{ color: '#1b6eff', borderColor: '#1b6eff' }}>Select File</Button>
            </div>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '32px 16px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '4px', margin: '0 auto 16px auto', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔍 L O G O</div>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>Browser Favicon</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px' }}>ICO, PNG (32×32px)</div>
              <Button style={{ color: '#1b6eff', borderColor: '#1b6eff' }}>Select File</Button>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ width: '320px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', overflow: 'hidden' }}>
        <div style={{ height: '120px', background: 'linear-gradient(135deg, #0058be 0%, #1E293B 100%)', padding: '24px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', opacity: 0.8 }}>INTERFACE PREVIEW</div>
          <div style={{ fontSize: '18px', fontWeight: '700' }}>Enterprise Light Theme</div>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#5e6278', lineHeight: '1.6' }}>Your changes to the branding will be applied globally across all user dashboards. Ensure color contrast meets WCAG 2.1 accessibility standards.</p>
          <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px' }}>
            <MdOutlineInfo style={{ color: '#0ea5e9', fontSize: '20px' }} />
            <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: '500' }}>Live preview updates automatically as you select colors.</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <Card title="Security Policies" maxWidth="800px">
      <FormGroup label="Password Policy"><Select options={['Strong (Min 12 chars, upper, lower, number, special)', 'Medium (Min 8 chars, alphanumeric)']} /></FormGroup>
      <ToggleRow title="Two-Factor Authentication (2FA)" desc="Enforce 2FA globally for all admin and staff accounts." active={true} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <FormGroup label="Session Timeout (Minutes)"><Input type="number" defaultValue={30} /></FormGroup>
        <FormGroup label="Login Attempt Limit"><Input type="number" defaultValue={5} /></FormGroup>
      </div>
      <FormGroup label="IP Restrictions (Allowlist)" hint="Leave blank to allow access from any IP address.">
        <textarea rows="3" defaultValue="192.168.1.0/24, 10.0.0.0/8" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #eef0f3', fontSize: '14px', outline: 'none', resize: 'vertical' }}></textarea>
      </FormGroup>
    </Card>
  );

  const renderNotifications = () => (
    <Card title="Notification Channels" maxWidth="800px">
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #eef0f3' }}>
        {['Email Notifications', 'In-App Push Alerts', 'SMS Alerts (Critical only)'].map((label, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked={i < 2} style={{ width: '16px', height: '16px' }} /><span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>
          </label>
        ))}
      </div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' }}>SMTP Configuration</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <FormGroup label="SMTP Host"><Input defaultValue="smtp.enterprise-corp.com" /></FormGroup>
        <FormGroup label="Port"><Input type="number" defaultValue={587} /></FormGroup>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #eef0f3' }}>
        <FormGroup label="Username"><Input defaultValue="noreply@enterprise-corp.com" /></FormGroup>
        <FormGroup label="Password"><Input type="password" defaultValue="********" /></FormGroup>
      </div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' }}>Alert Rules</h3>
      <ToggleRow title="Notify Admins on New User Registration" active={false} showBorder={false} />
      <div style={{ marginTop: '16px' }}><ToggleRow title="Notify Admins on Suspicious Logins" active={true} showBorder={false} /></div>
    </Card>
  );

  const renderMaintenance = () => (
    <Card title="System Maintenance" maxWidth="800px">
      <ToggleRow title="Maintenance Mode" desc="Block all non-admin access and display maintenance page." active={false} />
      <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #eef0f3' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Data Retention Policy</div>
        <div style={{ fontSize: '12px', color: '#787a91', marginBottom: '12px' }}>How long should system logs and deleted items be retained?</div>
        <Select options={['30 Days', '90 Days', '1 Year', 'Forever']} style={{ width: '200px' }} />
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Operations</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button style={{ color: '#1b6eff', borderColor: '#1b6eff' }}>Backup Database Now</Button>
          <Button>Restore from Backup</Button>
          <Button danger style={{ marginLeft: 'auto' }}>Clear Application Cache</Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ paddingBottom: '80px', position: 'relative', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: '#5e6278', textTransform: 'uppercase', marginBottom: '16px' }}>
            <MdArrowBack style={{ fontSize: '16px', cursor: 'pointer' }} /> <span>Dashboard</span> &gt; <span style={{ color: '#111322' }}>System Settings</span>
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#111322' }}>System Settings</h2>
          <p style={{ margin: 0, color: '#5e6278', fontSize: '14px' }}>Configure core system behavior, security protocols, and visual identity.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}><Button>Export Config</Button><Button primary>Add New User</Button></div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #eef0f3', marginBottom: '24px' }}>
        {tabs.map(tab => (
          <div key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', color: activeTab === tab ? '#1b6eff' : '#787a91', borderBottom: activeTab === tab ? '2px solid #1b6eff' : '2px solid transparent', transition: 'all 0.2s' }}>
            {tab}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '80px' }}>
        {activeTab === 'General' && renderGeneral()}
        {activeTab === 'Security' && renderSecurity()}
        {activeTab === 'Notifications' && renderNotifications()}
        {activeTab === 'Maintenance' && renderMaintenance()}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: '260px', right: 0, backgroundColor: '#fff', borderTop: '1px solid #eef0f3', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px', zIndex: 100 }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#5e6278', cursor: 'pointer' }}>Cancel Changes</span>
        <Button primary style={{ padding: '12px 24px' }}>Save All Changes</Button>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
