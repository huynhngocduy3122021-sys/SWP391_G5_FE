// Bảng màu/kích thước dùng chung cho khu vực Manager Dashboard.
// Tách riêng khỏi vinparking.css (theme tối của Staff) vì khu Manager dùng
// Nen sang cho giao dien manager.
const getSafeStorage = (key, fallback) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key) || fallback;
    }
  } catch (e) {
    console.warn("Storage access failed:", e);
  }
  return fallback;
};

export const mt = {
  bg: 'var(--vin-bg-light, #f8fafc)',
  sidebarBg: 'var(--vin-bg-card, #ffffff)',
  cardBg: 'var(--vin-bg-card, #ffffff)',
  border: 'var(--vin-border, #e2e8f0)',
  text: 'var(--vin-text-main, #1e293b)',
  textMuted: 'var(--vin-text-muted, #64748b)',
  primary: 'var(--vin-primary, #164e63)',
  accent: 'var(--vin-primary, #164e63)',
  success: 'var(--vin-success, #10b981)',
  danger: 'var(--vin-danger, #ef4444)',
  warning: '#d97706',
};

export const card = {
  background: 'var(--vin-bg-card, #ffffff)',
  border: `1px solid var(--vin-border, #e5e7eb)`,
  borderRadius: 12,
  padding: '1.25rem',
};
