import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import adminApi from '../api/admin';
import parkingApi from '../../search/api/parkingApi';
import { MdAdd, MdPeople, MdPerson, MdEdit, MdDelete } from 'react-icons/md';

const UserAccountsPage = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const location = useLocation();

  const [formData, setFormData] = useState({
    userFullName: '',
    userEmail: '',
    userPhone: '',
    userPassword: '',
    userRole: 'STAFF',
    userAddress: 'System',
    parkingBranchId: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchBranches();
    
    // Check if redirecting from dashboard to auto-open modal
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('addNew') === 'true') {
      setShowModal(true);
    }
  }, [location.search]);

  const fetchUsers = async () => {
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await parkingApi.getAllBranches();
      setBranches(data);
    } catch (err) {
      console.error('Failed to load branches', err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUserId(null);
    setFormData({
      userFullName: '',
      userEmail: '',
      userPhone: '',
      userPassword: '',
      userRole: 'STAFF',
      userAddress: 'System',
      parkingBranchId: ''
    });
  };

  const handleCreateClick = () => {
    setEditingUserId(null);
    setFormData({
      userFullName: '',
      userEmail: '',
      userPhone: '',
      userPassword: '',
      userRole: 'STAFF',
      userAddress: 'System',
      parkingBranchId: ''
    });
    setShowModal(true);
  };

  const handleEditClick = (u) => {
    setEditingUserId(u.userId);
    setFormData({
      userFullName: u.userFullName || '',
      userEmail: u.userEmail || '',
      userPhone: u.userPhone || '',
      userPassword: '', // empty means no change
      userRole: u.userRole || 'STAFF',
      userAddress: u.userAddress || 'System',
      parkingBranchId: u.parkingBranchId ? String(u.parkingBranchId) : ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (u) => {
    const confirmMsg = u.deleted 
      ? `Bạn có chắc chắn muốn kích hoạt lại tài khoản ${u.userFullName}?`
      : `Bạn có chắc chắn muốn vô hiệu hóa tài khoản ${u.userFullName}?`;
    
    if (window.confirm(confirmMsg)) {
      try {
        await adminApi.deleteUser(u.userId);
        toast.success(u.deleted ? 'Đã kích hoạt lại tài khoản thành công' : 'Đã vô hiệu hóa tài khoản thành công');
        fetchUsers();
      } catch (err) {
        toast.error('Không thể thực hiện thao tác xóa/vô hiệu hóa');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((formData.userRole === 'STAFF' || formData.userRole === 'MANAGER') && !formData.parkingBranchId) {
      toast.error('Please select a branch for this role');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };
      
      // Remove password if editing and left blank
      if (editingUserId && !payload.userPassword) {
        delete payload.userPassword;
      }
      
      if (payload.userRole !== 'STAFF' && payload.userRole !== 'MANAGER') {
        delete payload.parkingBranchId;
      } else {
        payload.parkingBranchId = parseInt(payload.parkingBranchId, 10);
      }
      
      if (editingUserId) {
        await adminApi.updateUser(editingUserId, payload);
        toast.success('Account updated successfully');
      } else {
        await adminApi.adminCreateUser(payload);
        toast.success('Account created successfully');
      }
      
      handleCloseModal();
      fetchUsers(); // Refresh list
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Operation failed';
      toast.error(typeof msg === 'string' ? msg : 'Error updating account');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'ADMIN': return <Badge bg="danger">ADMIN</Badge>;
      case 'MANAGER': return <Badge bg="warning" text="dark">MANAGER</Badge>;
      case 'STAFF': return <Badge bg="info">STAFF</Badge>;
      default: return <Badge bg="secondary">USER</Badge>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Tài khoản người dùng</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Quản lý tất cả vai trò và quyền hạn người dùng trong hệ thống.</p>
        </div>
        <button 
          onClick={handleCreateClick}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'var(--vin-primary)', color: 'var(--vin-text-main)', border: 'none', 
            padding: '10px 16px', borderRadius: '8px', fontWeight: '600',
            cursor: 'pointer', transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--vin-teal-hover)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--vin-primary)'}
        >
          <MdAdd size={20} /> Tạo tài khoản
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <Spinner animation="border" size="sm" className="me-2" /> Loading users...
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #eef0f3' }}>
                  <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Người dùng</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Thông tin liên hệ</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Vai trò</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Trạng thái</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.userId} style={{ borderBottom: '1px solid #eef0f3', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor='#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vin-primary)' }}>
                          <MdPerson size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{u.userFullName}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {u.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#334155', marginBottom: '4px' }}>{u.userEmail}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{u.userPhone}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getRoleBadge(u.userRole)}
                      {u.parkingBranchName && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                          <span style={{color: '#94a3b8'}}>Branch:</span> {u.parkingBranchName}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {u.deleted ? (
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#ef4444', backgroundColor: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>ĐÃ VÔ HIỆU</span>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#10b981', backgroundColor: '#d1fae5', padding: '4px 8px', borderRadius: '4px' }}>HOẠT ĐỘNG</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditClick(u)}
                          title="Chỉnh sửa"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '32px', height: '32px', borderRadius: '6px',
                            backgroundColor: '#eff6ff', color: '#2563eb', border: 'none',
                            cursor: 'pointer', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor='#dbeafe'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor='#eff6ff'}
                        >
                          <MdEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(u)}
                          title={u.deleted ? "Kích hoạt lại" : "Vô hiệu hóa"}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '32px', height: '32px', borderRadius: '6px',
                            backgroundColor: u.deleted ? '#d1fae5' : '#fef2f2',
                            color: u.deleted ? '#10b981' : '#dc2626', border: 'none',
                            cursor: 'pointer', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = u.deleted ? '#a7f3d0' : '#fee2e2'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = u.deleted ? '#d1fae5' : '#fef2f2'}
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Không tìm thấy người dùng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #eef0f3' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
            {editingUserId ? 'Chỉnh sửa tài khoản người dùng' : 'Tạo tài khoản Nhân viên/Quản lý'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: '24px' }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Full Name</Form.Label>
              <Form.Control 
                type="text" required placeholder="John Doe"
                value={formData.userFullName} onChange={e => setFormData({...formData, userFullName: e.target.value})}
                style={{ fontSize: '14px', padding: '10px 12px' }}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Email</Form.Label>
              <Form.Control 
                type="email" required placeholder="name@company.com"
                value={formData.userEmail} onChange={e => setFormData({...formData, userEmail: e.target.value})}
                style={{ fontSize: '14px', padding: '10px 12px' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Phone Number</Form.Label>
              <Form.Control 
                type="text" required placeholder="09xxxxxxxx"
                value={formData.userPhone} onChange={e => setFormData({...formData, userPhone: e.target.value})}
                style={{ fontSize: '14px', padding: '10px 12px' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Password</Form.Label>
              <Form.Control 
                type="password" required={!editingUserId} minLength="6" 
                placeholder={editingUserId ? "Bỏ trống nếu không muốn đổi" : "Tối thiểu 6 ký tự"}
                value={formData.userPassword} onChange={e => setFormData({...formData, userPassword: e.target.value})}
                style={{ fontSize: '14px', padding: '10px 12px' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Account Role</Form.Label>
              <Form.Select 
                value={formData.userRole} onChange={e => setFormData({...formData, userRole: e.target.value})}
                style={{ fontSize: '14px', padding: '10px 12px' }}
              >
                <option value="STAFF">Staff (Operations)</option>
                <option value="MANAGER">Manager (Administration)</option>
                <option value="ADMIN">Admin (Superuser)</option>
                <option value="USER">User (Customer)</option>
              </Form.Select>
            </Form.Group>

            {(formData.userRole === 'STAFF' || formData.userRole === 'MANAGER') && (
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Assign Branch</Form.Label>
                <Form.Select 
                  value={formData.parkingBranchId} onChange={e => setFormData({...formData, parkingBranchId: e.target.value})}
                  style={{ fontSize: '14px', padding: '10px 12px' }}
                  required
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map(branch => (
                    <option key={branch.parkingBranchId} value={branch.parkingBranchId}>
                      {branch.branchName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer style={{ borderTop: '1px solid #eef0f3' }}>
            <Button variant="light" onClick={handleCloseModal} style={{ fontSize: '14px', fontWeight: '500' }}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={submitting} style={{ backgroundColor: 'var(--vin-primary)', border: 'none', fontSize: '14px', fontWeight: '500', padding: '8px 16px' }}>
              {submitting ? <Spinner size="sm" animation="border" className="me-2"/> : null}
              {submitting ? (editingUserId ? 'Đang lưu...' : 'Đang tạo...') : (editingUserId ? 'Lưu thay đổi' : 'Tạo tài khoản')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default UserAccountsPage;
