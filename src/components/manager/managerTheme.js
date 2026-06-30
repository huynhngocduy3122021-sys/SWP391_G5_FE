// Bảng màu/kích thước dùng chung cho khu vực Manager Dashboard.
// Tách riêng khỏi vinparking.css (theme tối của Staff) vì khu Manager dùng
// Nen sang cho giao dien manager.
export const mt = {
  bg: '#f3f4f6',
  sidebarBg: '#ffffff',
  cardBg: '#ffffff',
  border: '#e5e7eb',
  text: '#0f172a',
  textMuted: '#64748b',
  primary: localStorage.getItem('sys_color_manager') || '#0f172a',
  accent: localStorage.getItem('sys_color_manager') || '#0f172a',
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
