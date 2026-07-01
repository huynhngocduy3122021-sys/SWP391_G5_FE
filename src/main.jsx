import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.jsx'

// ── Khởi tạo CSS variables từ localStorage khi app load ──────────────────────
// Fix: khi admin lưu màu, theme chỉ thay đổi trong cùng tab (applyThemeToDom).
// Sau khi reload trang, CSS variables bị reset về mặc định vì không ai set lại.
// Hàm này chạy ngay trước khi React render để đảm bảo màu được áp dụng đúng.
(function initThemeFromStorage() {
  try {
    const role = (localStorage.getItem('role') || 'USER').toUpperCase();
    const currentRole = role === 'SUPER_ADMIN' ? 'ADMIN' : role;

    const defaults = {
      USER:    { primary: '#125b71', accent: '#10b981', text: '#1e293b', textMuted: '#64748b', cardBg: '#ffffff', border: '#e2e8f0' },
      MANAGER: { primary: '#0f172a', accent: '#0d9488', text: '#0f172a', textMuted: '#64748b', cardBg: '#ffffff', border: '#cbd5e1' },
      STAFF:   { primary: '#125b71', accent: '#0c4355', text: '#1e293b', textMuted: '#64748b', cardBg: '#ffffff', border: '#e2e8f0' },
      ADMIN:   { primary: '#1b6eff', accent: '#10b981', text: '#1e293b', textMuted: '#64748b', cardBg: '#ffffff', border: '#cbd5e1' },
    };

    const def = defaults[currentRole] || defaults.ADMIN;
    const get = (key, fallback) => localStorage.getItem(`theme_${currentRole}_${key}`) || fallback;

    const t = {
      primary:   get('primary',   def.primary),
      accent:    get('accent',    def.accent),
      text:      get('text',      def.text),
      textMuted: get('textMuted', def.textMuted),
      cardBg:    get('cardBg',    def.cardBg),
      border:    get('border',    def.border),
    };

    const root = document.documentElement;
    root.style.setProperty('--vin-primary',   t.primary);
    root.style.setProperty('--vin-teal',      t.primary);
    root.style.setProperty('--vin-indigo',    t.primary);
    root.style.setProperty('--vin-accent',    t.accent);
    root.style.setProperty('--vin-teal-hover',t.accent);
    root.style.setProperty('--vin-text-main', t.text);
    root.style.setProperty('--vin-text-muted',t.textMuted);
    root.style.setProperty('--vin-bg-card',   t.cardBg);
    root.style.setProperty('--vin-bg-glass',  t.cardBg);
    root.style.setProperty('--vin-border',    t.border);
  } catch (e) {
    console.warn('Theme init failed:', e);
  }
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
