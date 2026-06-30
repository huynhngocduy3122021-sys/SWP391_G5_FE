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
  bg: '#f3f4f6',
  sidebarBg: getSafeStorage('theme_MANAGER_cardBg', '#ffffff'),
  cardBg: getSafeStorage('theme_MANAGER_cardBg', '#ffffff'),
  border: getSafeStorage('theme_MANAGER_border', '#e5e7eb'),
  text: getSafeStorage('theme_MANAGER_text', '#0f172a'),
  textMuted: getSafeStorage('theme_MANAGER_textMuted', '#64748b'),
  primary: getSafeStorage('theme_MANAGER_primary', '#0f172a'),
  accent: getSafeStorage('theme_MANAGER_accent', '#0d9488'),
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#d97706',
};

export const card = {
  background: mt.cardBg,
  border: `1px solid ${mt.border}`,
  borderRadius: 12,
  padding: '1.25rem',
};
