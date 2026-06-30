
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../../api/admin';
import { Spinner } from 'react-bootstrap';

const PermissionsPage = () => {
  const [matrix, setMatrix] = useState({});
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const modules = [
    { id: 'users', name: 'User Management', desc: 'Account creations, roles assignment & profile lookups' },
    { id: 'parking', name: 'Parking Infrastructure', desc: 'Branches, zones, parking slots & pricing plans' },
    { id: 'bookings', name: 'Booking Reservations', desc: 'Pre-bookings, scheduling & parking approvals' },
    { id: 'incidents', name: 'Maintenance & Incidents', desc: 'Incident reporting, hardware logs & support tickets' },
  ];

  const actions = [
    { id: 'view', label: 'VIEW' },
    { id: 'edit', label: 'EDIT' },
    { id: 'delete', label: 'DELETE' },
    { id: 'admin', label: 'ADMIN' },
  ];

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getRolePermissions();
      setMatrix(data || {});
    } catch (err) {
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (modId, actionId) => {
    const rolePermissions = { ...(matrix[selectedRole] || {}) };
    let currentActions = rolePermissions[modId] || [];

    if (currentActions.includes(actionId)) {
      currentActions = currentActions.filter(a => a !== actionId);
    } else {
      currentActions = [...currentActions, actionId];
    }

    setMatrix({
      ...matrix,
      [selectedRole]: {
        ...rolePermissions,
        [modId]: currentActions
      }
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await adminApi.saveRolePermissions(matrix);
      toast.success('Permissions matrix saved successfully');
    } catch (err) {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDesc = (role) => {
    switch (role) {
      case 'ADMIN': return 'Full administrative control of the system.';
      case 'MANAGER': return 'Manage branches, pricing, and staff roles.';
      case 'STAFF': return 'Operate gates, register check-in/outs & report issues.';
      case 'USER': return 'Standard guest customer with reserving capabilities.';
      default: return 'Custom system role access configurations.';
    }
  };

  const isChecked = (modId, actionId) => {
    return matrix[selectedRole]?.[modId]?.includes(actionId) || false;
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
        <Spinner animation="border" size="sm" className="me-2" /> Loading permission matrix...
      </div>
    );
  }

  const systemRoles = Object.keys(matrix);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Permissions & Role Management</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Define granular access control and manage administrative roles across the ecosystem.</p>
      </div>

      {/* Role Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {systemRoles.map((role) => {
          const isSelected = selectedRole === role;
          return (
            <div 
              key={role} 
              onClick={() => setSelectedRole(role)}
              style={{ 
                backgroundColor: '#fff', 
                padding: '20px', 
                borderRadius: '12px', 
                border: isSelected ? '2px solid #1b6eff' : '1px solid #eef0f3', 
                boxShadow: isSelected ? '0 4px 12px rgba(27, 110, 255, 0.15)' : 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '11px', backgroundColor: '#e2f5ea', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>ACTIVE</span>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px', color: isSelected ? '#1b6eff' : '#1e293b' }}>{role}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', minHeight: '36px' }}>{getRoleDesc(role)}</div>
              <button style={{ border: 'none', background: 'transparent', color: isSelected ? '#1b6eff' : '#64748b', fontWeight: '600', fontSize: '13px', padding: 0 }}>
                {isSelected ? 'Currently Selected' : 'Configure Permissions'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Matrix Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
            Permissions Matrix: <span style={{ color: '#1b6eff' }}>{selectedRole}</span>
          </h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={fetchPermissions}
              style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
            >
              Discard Changes
            </button>
            <button 
              onClick={handleSaveChanges}
              disabled={saving}
              style={{ padding: '8px 14px', backgroundColor: '#111322', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center' }}
            >
              {saving && <Spinner size="sm" className="me-2" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eef0f3', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>SYSTEM MODULE</th>
              {actions.map(act => (
                <th key={act.id} style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', textAlign: 'center', fontWeight: '600' }}>{act.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod.id} style={{ borderBottom: '1px solid #eef0f3' }}>
                <td style={{ padding: '16px 16px' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>{mod.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{mod.desc}</div>
                </td>
                {actions.map(act => (
                  <td key={act.id} style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked(mod.id, act.id)} 
                      onChange={() => handleCheckboxChange(mod.id, act.id)}
                      style={{ transform: 'scale(1.2)', cursor: 'pointer' }} 
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionsPage;