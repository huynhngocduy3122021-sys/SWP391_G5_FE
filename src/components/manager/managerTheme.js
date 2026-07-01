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
  bg: 'var(--vin-bg-deep, #f3f4f6)',
  sidebarBg: 'var(--vin-bg-card, #ffffff)',
  cardBg: 'var(--vin-bg-card, #ffffff)',
  border: 'var(--vin-border, #e5e7eb)',
  text: 'var(--vin-text-main, #0f172a)',
  textMuted: 'var(--vin-text-muted, #64748b)',
  primary: 'var(--vin-primary, #0f172a)',
  accent: 'var(--vin-accent, #0d9488)',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#d97706',
};

export const card = {
  background: 'var(--vin-bg-card, #ffffff)',
  border: `1px solid var(--vin-border, #e5e7eb)`,
  borderRadius: 12,
  padding: '1.25rem',
};
