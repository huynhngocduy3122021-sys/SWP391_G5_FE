import React, { useState } from 'react';

const PermissionsPage = () => {
  const modules = [
    { id: 'users', name: 'Users', desc: 'Account management & profiles' },
    { id: 'settings', name: 'Settings', desc: 'Global configuration & API keys' },
    { id: 'ai', name: 'AI Engines', desc: 'Model tuning & prompt management' },
    { id: 'payments', name: 'Payments', desc: 'Financial auditing & transactions' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Permissions & Role Management</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Define granular access control and manage administrative roles across the ecosystem.</p>
      </div>

      {/* Role Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {['Super Admin', 'Moderator', 'Billing Manager'].map((role, i) => (
          <div key={i} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eef0f3', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '11px', backgroundColor: '#e2f5ea', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>ACTIVE</span>
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '6px' }}>{role}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Access control configuration role.</div>
            <button style={{ border: 'none', background: 'transparent', color: '#1b6eff', fontWeight: '600', cursor: 'pointer', fontSize: '13px', padding: 0 }}>Edit Role</button>
          </div>
        ))}
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>+</span>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>Create New Role</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Permissions Matrix (Moderator)</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px' }}>Discard</button>
            <button style={{ padding: '8px 14px', backgroundColor: '#111322', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Save Changes</button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eef0f3', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>SYSTEM MODULE</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>VIEW</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>EDIT</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>DELETE</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>ADMIN</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod.id} style={{ borderBottom: '1px solid #eef0f3' }}>
                <td style={{ padding: '16px 16px' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>{mod.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{mod.desc}</div>
                </td>
                <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked style={{ transform: 'scale(1.2)' }} /></td>
                <td style={{ textAlign: 'center' }}><input type="checkbox" style={{ transform: 'scale(1.2)' }} /></td>
                <td style={{ textAlign: 'center' }}><input type="checkbox" style={{ transform: 'scale(1.2)' }} /></td>
                <td style={{ textAlign: 'center' }}><input type="checkbox" style={{ transform: 'scale(1.2)' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionsPage;