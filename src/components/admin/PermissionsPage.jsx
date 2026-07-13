
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
    { id: 'users', name: 'Quản lý Người dùng', desc: 'Tạo tài khoản, phân vai trò & tra cứu hồ sơ' },
    { id: 'parking', name: 'Hạ tầng Bãi đỗ', desc: 'Chi nhánh, khu vực, vị trí & bảng giá' },
    { id: 'bookings', name: 'Quản lý Đặt chỗ', desc: 'Đặt trước, lên lịch & phê duyệt đỗ xe' },
    { id: 'incidents', name: 'Bảo trì & Sự cố', desc: 'Báo cáo sự cố, nhật ký thiết bị & hỗ trợ' },
  ];

  const actions = [
    { id: 'view', label: 'XEM' },
    { id: 'edit', label: 'SỬA' },
    { id: 'delete', label: 'XÓA' },
    { id: 'admin', label: 'QUẢN TRỊ' },
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
      toast.error('Không thể tải danh sách quyền');
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
      toast.success('Lưu ma trận phân quyền thành công');
    } catch (err) {
      toast.error('Không thể lưu phân quyền');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDesc = (role) => {
    switch (role) {
      case 'ADMIN': return 'Toàn quyền quản trị hệ thống.';
      case 'MANAGER': return 'Quản lý chi nhánh, bảng giá và nhân sự.';
      case 'STAFF': return 'Vận hành cổng, ghi nhận xe ra/vào & báo cáo sự cố.';
      case 'USER': return 'Khách hàng tiêu chuẩn với chức năng đặt chỗ.';
      default: return 'Cấu hình quyền truy cập vai trò tùy chỉnh.';
    }
  };

  const isChecked = (modId, actionId) => {
    return matrix[selectedRole]?.[modId]?.includes(actionId) || false;
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
        <Spinner animation="border" size="sm" className="me-2" /> Đang tải ma trận phân quyền...
      </div>
    );
  }

  const systemRoles = Object.keys(matrix);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Quản lý Vai trò & Phân quyền</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Thiết lập quyền truy cập chi tiết và quản lý các vai trò quản trị trong hệ thống.</p>
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
                border: isSelected ? '2px solid var(--vin-primary)' : '1px solid #eef0f3', 
                boxShadow: isSelected ? '0 4px 12px rgba(27, 110, 255, 0.15)' : 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '11px', backgroundColor: '#e2f5ea', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>ACTIVE</span>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px', color: isSelected ? 'var(--vin-primary)' : '#1e293b' }}>{role}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', minHeight: '36px' }}>{getRoleDesc(role)}</div>
              <button style={{ border: 'none', background: 'transparent', color: isSelected ? 'var(--vin-primary)' : '#64748b', fontWeight: '600', fontSize: '13px', padding: 0 }}>
                {isSelected ? 'Đang chọn' : 'Cấu hình phân quyền'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Matrix Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
            Ma trận Phân quyền: <span style={{ color: 'var(--vin-primary)' }}>{selectedRole}</span>
          </h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={fetchPermissions}
              style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
            >
              Hủy thay đổi
            </button>
            <button 
              onClick={handleSaveChanges}
              disabled={saving}
              style={{ padding: '8px 14px', backgroundColor: 'var(--vin-bg-card)', color: 'var(--vin-text-main)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center' }}
            >
              {saving && <Spinner size="sm" className="me-2" />}
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eef0f3', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>PHÂN HỆ HỆ THỐNG</th>
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