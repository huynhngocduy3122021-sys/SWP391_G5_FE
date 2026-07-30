import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PricingSettingsPanel from './PricingSettingsPanel';

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('pricing');
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
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Cài đặt hệ thống</h2>
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

      {activeTab === 'pricing' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '24px' }}>
          <PricingSettingsPanel />
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
