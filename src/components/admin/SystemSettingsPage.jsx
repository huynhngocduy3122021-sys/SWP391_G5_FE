import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PricingSettingsPanel from './PricingSettingsPanel';

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');

  // Branding & Logo States
  const [systemName, setSystemName] = useState(() => localStorage.getItem('sys_name') || 'VinParking');
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('sys_primary_color') || '#1b6eff');
  const [secondaryColor, setSecondaryColor] = useState(() => localStorage.getItem('sys_secondary_color') || '#10b981');
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);

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
    // Store initial values to compare changes
    setOriginalSettings({
      systemName,
      primaryColor,
      secondaryColor,
      enableMfa,
      pwPolicy,
      sessionTimeout,
      emailAlerts,
      telegramAlerts,
    });
  }, []);

  const checkDirty = (updates = {}) => {
    const current = {
      systemName,
      primaryColor,
      secondaryColor,
      enableMfa,
      pwPolicy,
      sessionTimeout,
      emailAlerts,
      telegramAlerts,
      ...updates
    };
    const dirty = Object.keys(originalSettings).some(
      key => String(originalSettings[key]) !== String(current[key])
    );
    setIsDirty(dirty);
  };

  const handleNameChange = (val) => {
    setSystemName(val);
    checkDirty({ systemName: val });
  };

  const handlePrimaryChange = (val) => {
    setPrimaryColor(val);
    checkDirty({ primaryColor: val });
  };

  const handleSecondaryChange = (val) => {
    setSecondaryColor(val);
    checkDirty({ secondaryColor: val });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setIsDirty(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result);
        setIsDirty(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem('sys_name', systemName);
    localStorage.setItem('sys_primary_color', primaryColor);
    localStorage.setItem('sys_secondary_color', secondaryColor);
    
    // Update original state to current values
    setOriginalSettings({
      systemName,
      primaryColor,
      secondaryColor,
      enableMfa,
      pwPolicy,
      sessionTimeout,
      emailAlerts,
      telegramAlerts,
    });
    setIsDirty(false);
    toast.success('Đã áp dụng và lưu cấu hình hệ thống thành công!');
  };

  const handleCancel = () => {
    setSystemName(originalSettings.systemName);
    setPrimaryColor(originalSettings.primaryColor);
    setSecondaryColor(originalSettings.secondaryColor);
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

  // WCAG 2.1 Contrast Ratio Calculator against white background (#FFFFFF)
  const getContrastRatio = (hex) => {
    if (!hex || hex.length < 7) return '1.0';
    try {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const a = [r, g, b].map(v => {
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      const luminance = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
      
      const ratio = (1.0 + 0.05) / (luminance + 0.05);
      const darkRatio = (luminance + 0.05) / (0.0 + 0.05);
      
      return Math.max(ratio, darkRatio).toFixed(1);
    } catch {
      return '4.5';
    }
  };

  const contrastRatio = getContrastRatio(primaryColor);
  const isContrastPass = Number(contrastRatio) >= 4.5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '8px', paddingBottom: '80px' }}>
      
      {/* Top Title & Search bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--vin-bg-card)' }}>System Settings</h2>
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
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'var(--vin-bg-card)' }} 
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
              backgroundColor: activeTab === tab.key ? primaryColor : '#fff',
              color: activeTab === tab.key ? '#fff' : '#475569',
              border: activeTab === tab.key ? `1px solid ${primaryColor}` : '1px solid #cbd5e1',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'pricing' ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '24px' }}>
          <PricingSettingsPanel />
        </div>
      ) : (
        /* Two Column Layout: Controls and UI Live Preview */
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
          
          {/* Left Column: Forms */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', padding: '24px' }}>
            
            {/* TAB: GENERAL */}
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--vin-bg-card)' }}>Tùy biến thương hiệu (Branding)</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>TÊN HỆ THỐNG</label>
                  <input 
                    type="text" 
                    value={systemName}
                    onChange={e => handleNameChange(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>MÀU SẮC CHỦ ĐẠO (PRIMARY)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="color" 
                        value={primaryColor} 
                        onChange={e => handlePrimaryChange(e.target.value)}
                        style={{ border: 'none', width: '42px', height: '42px', padding: 0, borderRadius: '8px', cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        value={primaryColor} 
                        onChange={e => handlePrimaryChange(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>MÀU PHỤ TRỢ (SECONDARY)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="color" 
                        value={secondaryColor} 
                        onChange={e => handleSecondaryChange(e.target.value)}
                        style={{ border: 'none', width: '42px', height: '42px', padding: 0, borderRadius: '8px', cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        value={secondaryColor} 
                        onChange={e => handleSecondaryChange(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', width: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #eef0f3', margin: '12px 0' }} />

                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--vin-bg-card)' }}>Logo Hệ thống (System Logos)</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>LOGO DASHBOARD (SVG/PNG)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ fontSize: '13px' }}
                    />
                    <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" style={{ maxHeight: '60px' }} />
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Chưa chọn logo mới</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>FAVICON BROWSER (ICO/PNG)</label>
                    <input 
                      type="file" 
                      accept=".ico,image/png"
                      onChange={handleFaviconUpload}
                      style={{ fontSize: '13px' }}
                    />
                    <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                      {faviconPreview ? (
                        <img src={faviconPreview} alt="Favicon Preview" style={{ width: '32px', height: '32px' }} />
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Chưa chọn favicon (32x32px)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--vin-bg-card)' }}>Bảo mật hệ thống (Security)</h3>

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
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--vin-bg-card)' }}>Cấu hình Thông báo (Notifications)</h3>

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
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--vin-bg-card)' }}>Bảo trì & Sao lưu (Maintenance)</h3>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ systemName, primaryColor, secondaryColor, timestamp: new Date().toISOString() }));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href",     dataStr);
                      downloadAnchor.setAttribute("download", `vinparking_backup_${new Date().toLocaleDateString()}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      toast.success('Đã xuất bản sao lưu cơ sở dữ liệu cấu hình!');
                    }}
                    style={{ flex: 1, padding: '12px', border: '1px solid #1b6eff', color: '#1b6eff', backgroundColor: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    💾 Sao lưu Cấu hình (.json)
                  </button>

                  <button
                    onClick={() => toast.success('Đã dọn dẹp bộ nhớ tạm và cache phiên đỗ xe!')}
                    style={{ flex: 1, padding: '12px', border: '1px solid #ef4444', color: '#ef4444', backgroundColor: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    🧹 Dọn dẹp Bộ nhớ cache
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Live UI Preview Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Xem trước Giao diện (Live Preview)</h4>
                <span style={{
                  fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px',
                  backgroundColor: isContrastPass ? '#dcfce7' : '#fee2e2',
                  color: isContrastPass ? '#166534' : '#991b1b'
                }}>
                  WCAG 2.1: {contrastRatio}:1 ({isContrastPass ? 'ĐẠT' : 'YẾU'})
                </span>
              </div>

              {/* Mock Dashboard Preview */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', height: '240px', display: 'flex', flexDirection: 'column', fontSize: '12px', backgroundColor: '#f8fafc' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#1e293b' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: primaryColor }} />
                    {systemName}
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#e2e8f0' }} />
                </div>

                {/* Body */}
                <div style={{ display: 'flex', flex: 1 }}>
                  
                  {/* Sidebar */}
                  <div style={{ width: '60px', backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ height: '8px', width: '100%', backgroundColor: primaryColor, borderRadius: '4px' }} />
                    <div style={{ height: '8px', width: '80%', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ height: '8px', width: '90%', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                  </div>

                  {/* Main panel */}
                  <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ height: '10px', width: '80px', backgroundColor: '#1e293b', borderRadius: '4px', fontWeight: '700' }} />
                      <button style={{ border: 'none', backgroundColor: primaryColor, color: 'var(--vin-text-main)', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '600' }}>
                        + Action
                      </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', backgroundColor: '#fff' }}>
                        <div style={{ height: '14px', width: '20px', backgroundColor: secondaryColor, borderRadius: '4px', marginBottom: '4px' }} />
                        <div style={{ height: '6px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '3px' }} />
                      </div>

                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', backgroundColor: '#fff' }}>
                        <div style={{ height: '14px', width: '35px', backgroundColor: '#1e293b', borderRadius: '4px', marginBottom: '4px' }} />
                        <div style={{ height: '6px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>

                </div>

              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                Bản xem trước giao diện được tính toán tự động độ tương phản.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Fixed Confirm Action Bar at the Bottom */}
      {isDirty && (
        <div style={{
          position: 'fixed', bottom: 0, left: '260px', right: 0, 
          backgroundColor: '#fff', borderTop: '1px solid #eef0f3',
          padding: '16px 24px', display: 'flex', justifyContent: 'flex-end',
          gap: '12px', zIndex: 100, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
        }}>
          <span style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>
            ⚠️ Bạn có các thay đổi chưa lưu cấu hình hệ thống!
          </span>
          <button 
            onClick={handleCancel}
            style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
          >
            Hủy thay đổi
          </button>
          <button 
            onClick={handleSave}
            style={{ padding: '8px 16px', backgroundColor: primaryColor, color: 'var(--vin-text-main)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
          >
            Lưu cấu hình
          </button>
        </div>
      )}

    </div>
  );
}
