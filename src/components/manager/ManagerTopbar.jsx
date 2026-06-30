import { mt } from './managerTheme';

export default function ManagerTopbar({ title }) {
  const fullName = localStorage.getItem('fullName') || 'Manager';
  const role = localStorage.getItem('role') || 'manager';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'M';

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 1.5rem', background: '#fff', borderBottom: `1px solid ${mt.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: mt.text, margin: 0, whiteSpace: 'nowrap' }}>
          {title || 'Manager Dashboard'}
        </h1>
        <div style={{
          flex: 1, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 8,
          background: '#f1f5f9', borderRadius: 8, padding: '0.45rem 0.75rem',
        }}>
          <span style={{ color: mt.textMuted, fontSize: '0.85rem' }}>&#9906;</span>
          <input
            type="text"
            placeholder="Tim kiem bien so, ma the..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button type="button" style={{
          position: 'relative', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem',
        }}>
          &#128276;
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: '#dbeafe', color: '#1e3a8a',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem',
          }}>{initials}</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: mt.text }}>{fullName}</div>
            <div style={{ fontSize: '0.7rem', color: mt.textMuted }}>{role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
