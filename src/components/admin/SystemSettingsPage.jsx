import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PricingSettingsPanel from './PricingSettingsPanel';

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');

  // Branding States
  const [systemName, setSystemName] = useState(() => localStorage.getItem('sys_name') || 'VinParking');

  // Security Settings States
  const [enableMfa, setEnableMfa] = useState(true);
  const [pwPolicy, setPwPolicy] = useState('strong');
  const [sessionTimeout, setSessionTimeout] = useState(30);

  // Notification States
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [telegramAlerts, setTelegramAlerts] = useState(false);

  // Dirty State checking for save bar
  const [isDirty, setIsDirty] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({});

  useEffect(() => {
    setOriginalSettings({ systemName, enableMfa, pwPolicy, sessionTimeout, emailAlerts, telegramAlerts });
  }, []);

  const checkDirty = (updates = {}) => {
    const current = { systemName, enableMfa, pwPolicy, sessionTimeout, emailAlerts, telegramAlerts, ...updates };
    const dirty = Object.keys(originalSettings).some(
      key => String(originalSettings[key]) !== String(current[key])
    );
    setIsDirty(dirty);
  };

  const handleNameChange = (val) => {
    setSystemName(val);
    checkDirty({ systemName: val });
  };

  const handleSave = () => {
    localStorage.setItem('sys_name', systemName);
    setOriginalSettings({ systemName, enableMfa, pwPolicy, sessionTimeout, emailAlerts, telegramAlerts });
    setIsDirty(false);
    toast.success('Đã lưu cấu hình hệ thống thành công!');
  };

  const handleCancel = () => {
    setSystemName(originalSettings.systemName);
    setEnableMfa(originalSettings.enableMfa);
    setPwPolicy(originalSettings.pwPolicy);
    setSessionTimeout(originalSettings.sessionTimeout);
    setEmailAlerts(originalSettings.emailAlerts);
    setTelegramAlerts(originalSettings.telegramAlerts);
    setIsDirty(false);
    toast.info('Đã hủy bỏ các thay đổi.');
  };

  const TABS = [
    { key: 'general',       label: 'General (Thương hiệu)' },
    { key: 'security',      label: 'Security (Bảo mật)' },
    { key: 'notifications', label: 'Notifications (Thông báo)' },
    { key: 'maintenance',   label: 'Maintenance (Bảo trì)' },
    { key: 'pricing',       label: 'Pricing (Bảng giá & Gói cước)' },
  ];

  const ADMIN_PRIMARY = '#1b6eff';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '8px', paddingBottom: '80px' }}>

      {/* Top Title & Search bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111322' }}>System Settings</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Cấu hình nhận diện thương hiệu, bảo mật, thông báo và bảo trì hệ thống.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', width: '260px' }}>
            <span style={{ color: '#64748b' }}>🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm cài đặt nhanh..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: '#111322' }}
            />
          </div>
          <button
            onClick={() => toast.success('Đã xuất dữ liệu cấu hình JSON!')}
            style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#475569' }}
          >
            Export Config
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #eef0f3', paddingBottom: '12px' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
              backgroundColor: activeTab === tab.key ? ADMIN_PRIMARY : '#fff',
              color: activeTab === tab.key ? '#fff' : '#475569',
              border: activeTab === tab.key ? `1px solid ${ADMIN_PRIMARY}` : '1px solid #cbd5e1',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'pricing' ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '24px' }}>
          <PricingSettingsPanel />
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', padding: '24px', maxWidth: '720px' }}>

          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111322' }}>Tùy biến thương hiệu (Branding)</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>TÊN HỆ THỐNG</label>
                <input
                  type="text"
                  value={systemName}
                  onChange={e => handleNameChange(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111322' }}>Bảo mật hệ thống (Security)</h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Xác thực 2 yếu tố (2FA)</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Bắt buộc quản trị viên xác thực qua OTP khi đăng nhập.</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableMfa}
                  onChange={e => { setEnableMfa(e.target.checked); checkDirty({ enableMfa: e.target.checked }); }}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>CHÍNH SÁCH MẬT KHẨU</label>
                <select
                  value={pwPolicy}
                  onChange={e => { setPwPolicy(e.target.value); checkDirty({ pwPolicy: e.target.value }); }}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                >
                  <option value="basic">Cơ bản (Ít nhất 6 ký tự)</option>
                  <option value="strong">Mạnh (Chứa hoa, thường, số & ký tự đặc biệt)</option>
                  <option value="strict">Nghiêm ngặt (Mạnh + đổi mật khẩu mỗi 90 ngày)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>THỜI GIAN HẾT HẠN PHIÊN (PHÚT)</label>
                <input
                  type="number"
                  value={sessionTimeout}
                  onChange={e => { setSessionTimeout(Number(e.target.value)); checkDirty({ sessionTimeout: Number(e.target.value) }); }}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111322' }}>Cấu hình Thông báo (Notifications)</h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Thông báo qua Email</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Gửi email báo cáo hàng ngày/hàng tuần cho Manager.</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={e => { setEmailAlerts(e.target.checked); checkDirty({ emailAlerts: e.target.checked }); }}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Cảnh báo sự cố qua Telegram Bot</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Tự động đẩy tin nhắn về Group vận hành khi phát hiện sự cố khẩn cấp.</div>
                </div>
                <input
                  type="checkbox"
                  checked={telegramAlerts}
                  onChange={e => { setTelegramAlerts(e.target.checked); checkDirty({ telegramAlerts: e.target.checked }); }}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>
            </div>
          )}

          {/* TAB: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111322' }}>Bảo trì & Sao lưu (Maintenance)</h3>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ systemName, timestamp: new Date().toISOString() }));
                    const a = document.createElement('a');
                    a.setAttribute("href", dataStr);
                    a.setAttribute("download", `vinparking_backup_${new Date().toLocaleDateString()}.json`);
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    toast.success('Đã xuất bản sao lưu cơ sở dữ liệu cấu hình!');
                  }}
                  style={{ flex: 1, padding: '12px', border: '1px solid #1b6eff', color: '#1b6eff', backgroundColor: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Sao lưu Cấu hình (.json)
                </button>

                <button
                  onClick={() => toast.success('Đã dọn dẹp bộ nhớ tạm và cache phiên đỗ xe!')}
                  style={{ flex: 1, padding: '12px', border: '1px solid #ef4444', color: '#ef4444', backgroundColor: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Dọn dẹp Bộ nhớ cache
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Fixed Save Bar */}
      {isDirty && (
        <div style={{
          position: 'fixed', bottom: 0, left: '260px', right: 0,
          backgroundColor: '#fff', borderTop: '1px solid #eef0f3',
          padding: '16px 24px', display: 'flex', justifyContent: 'flex-end',
          gap: '12px', zIndex: 100, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
        }}>
          <span style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>
            Bạn có các thay đổi chưa lưu!
          </span>
          <button
            onClick={handleCancel}
            style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
          >
            Hủy thay đổi
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '8px 16px', backgroundColor: ADMIN_PRIMARY, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
          >
            Lưu cấu hình
          </button>
        </div>
      )}

    </div>
  );
}
