import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal, Button, Form, Spinner, Badge, Table, Card, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import adminApi from '../../api/admin';
import { MdAdd, MdSearch, MdRefresh, MdEdit, MdDelete } from 'react-icons/md';

const UserAccountsPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();

  // Create form state
  const [formData, setFormData] = useState({
    userFullName: '',
    userEmail: '',
    userPhone: '',
    userPassword: '',
    userRole: 'STAFF',
    userAddress: 'System'
  });

  // Edit modal state
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    userFullName: '',
    userEmail: '',
    userPhone: '',
    userAddress: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    fetchUsers();
    
    // Check if redirecting from dashboard to auto-open modal
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('addNew') === 'true') {
      setShowModal(true);
    }
  }, [location.search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.adminCreateUser(formData);
      toast.success('Account created successfully');
      setShowModal(false);
      setFormData({
        userFullName: '',
        userEmail: '',
        userPhone: '',
        userPassword: '',
        userRole: 'STAFF',
        userAddress: 'System'
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to create user';
      toast.error(typeof msg === 'string' ? msg : 'Error creating account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditForm({
      userFullName: user.userFullName || '',
      userEmail: user.userEmail || '',
      userPhone: user.userPhone || '',
      userAddress: user.userAddress || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await adminApi.updateUser(editUser.userId, editForm);
      toast.success('Account updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to update user';
      toast.error(typeof msg === 'string' ? msg : 'Error updating account');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      try {
        await adminApi.deleteUser(id);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (err) {
        toast.error('Failed to delete user');
      }
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

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === 'ALL' || u.userRole === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (u.userFullName || '').toLowerCase().includes(q)
      || (u.userEmail || '').toLowerCase().includes(q)
      || (u.userPhone || '').includes(q);
    return matchRole && matchSearch;
  });

  const totalUsers = users.length;
  const staffCount = users.filter(u => u.userRole === 'STAFF').length;
  const managerCount = users.filter(u => u.userRole === 'MANAGER').length;
  const adminCount = users.filter(u => u.userRole === 'ADMIN').length;

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>User Accounts</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Manage all user roles and permissions in the system.</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          style={{ backgroundColor: '#1b6eff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
        >
          <MdAdd size={20} /> Create Account
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>TOTAL USERS</div>
            <h3 className="mt-2 mb-0" style={{ fontWeight: '800', color: '#1e293b' }}>{totalUsers}</h3>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>STAFF ACCOUNTS</div>
            <h3 className="mt-2 mb-0" style={{ fontWeight: '800', color: '#1e293b' }}>{staffCount}</h3>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>MANAGERS</div>
            <h3 className="mt-2 mb-0" style={{ fontWeight: '800', color: '#1e293b' }}>{managerCount}</h3>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>ADMINISTRATORS</div>
            <h3 className="mt-2 mb-0" style={{ fontWeight: '800', color: '#1e293b' }}>{adminCount}</h3>
          </Card>
        </Col>
      </Row>

      {/* Filter and Search Bar */}
      <Card className="border-0 shadow-sm p-3 mb-4" style={{ borderRadius: '12px' }}>
        <Row className="align-items-center">
          <Col md={4}>
            <Form.Group className="mb-0 position-relative">
              <Form.Control 
                type="text" 
                placeholder="Search by name, email, phone..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ borderRadius: '8px', paddingLeft: '36px' }}
              />
              <MdSearch size={20} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            </Form.Group>
          </Col>
          <Col md={8} className="d-flex justify-content-md-end gap-2 mt-2 mt-md-0">
            {['ALL', 'ADMIN', 'MANAGER', 'STAFF', 'USER'].map((r) => (
              <Button 
                key={r}
                onClick={() => setRoleFilter(r)}
                variant={roleFilter === r ? 'dark' : 'light'}
                style={{ borderRadius: '20px', fontSize: '13px', fontWeight: '600', padding: '6px 16px' }}
              >
                {r === 'ALL' ? 'All Roles' : r}
              </Button>
            ))}
            <Button variant="light" onClick={fetchUsers} style={{ borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <MdRefresh size={18} />
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
        <Table responsive hover className="mb-0" style={{ fontSize: '14px' }}>
          <thead className="bg-light">
            <tr>
              <th className="py-3 px-4">FULL NAME</th>
              <th className="py-3 px-4">EMAIL</th>
              <th className="py-3 px-4">PHONE NUMBER</th>
              <th className="py-3 px-4">ROLE</th>
              <th className="py-3 px-4">ADDRESS</th>
              <th className="py-3 px-4 text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <Spinner animation="border" className="me-2" size="sm" /> Loading accounts...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">No accounts found.</td>
              </tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.userId}>
                <td className="py-3 px-4" style={{ fontWeight: '600', color: '#1e293b' }}>{user.userFullName || '—'}</td>
                <td className="py-3 px-4 text-muted">{user.userEmail || '—'}</td>
                <td className="py-3 px-4">{user.userPhone || '—'}</td>
                <td className="py-3 px-4">{getRoleBadge(user.userRole)}</td>
                <td className="py-3 px-4 text-muted">{user.userAddress || '—'}</td>
                <td className="py-3 px-4 text-end">
                  <Button variant="light" size="sm" className="me-1" onClick={() => handleOpenEdit(user)}>
                    <MdEdit size={16} color="#3b82f6" />
                  </Button>
                  <Button variant="light" size="sm" onClick={() => handleDeleteUser(user.userId, user.userFullName)}>
                    <MdDelete size={16} color="#ef4444" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* CREATE MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #eef0f3' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
            Create Account
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
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
                type="password" required minLength="6" placeholder="Minimum 6 characters"
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

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Address</Form.Label>
              <Form.Control 
                type="text" required placeholder="City/Region"
                value={formData.userAddress} onChange={e => setFormData({...formData, userAddress: e.target.value})}
                style={{ fontSize: '14px', padding: '10px 12px' }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: '1px solid #eef0f3' }}>
            <Button variant="light" onClick={() => setShowModal(false)} style={{ fontSize: '14px', fontWeight: '500' }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting} style={{ backgroundColor: '#1b6eff', border: 'none', fontSize: '14px', fontWeight: '500', padding: '8px 16px' }}>
              {submitting ? <Spinner size="sm" animation="border" className="me-2"/> : null}
              {submitting ? 'Creating...' : 'Create Account'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #eef0f3' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
            Edit User Info
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateUser}>
          <Modal.Body style={{ padding: '24px' }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Full Name</Form.Label>
              <Form.Control 
                type="text" required
                value={editForm.userFullName} onChange={e => setEditForm({...editForm, userFullName: e.target.value})}
                style={{ fontSize: '14px', padding: '10px 12px' }}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Email</Form.Label>
              <Form.Control 
                type="email" required
                value={editForm.userEmail} onChange={e => setEditForm({...editForm, userEmail: e.target.value})}
                style={{ fontSize: '14px', padding: '10px 12px' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Phone Number</Form.Label>
              <Form.Control 
                type="text" required
                value={editForm.userPhone} onChange={e => setEditForm({...editForm, userPhone: e.target.value})}
                style={{ fontSize: '14px', padding: '10px 12px' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Address</Form.Label>
              <Form.Control 
                type="text" required
                value={editForm.userAddress} onChange={e => setEditForm({...editForm, userAddress: e.target.value})}
                style={{ fontSize: '14px', padding: '10px 12px' }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: '1px solid #eef0f3' }}>
            <Button variant="light" onClick={() => setShowEditModal(false)} style={{ fontSize: '14px', fontWeight: '500' }}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={updating} style={{ border: 'none', fontSize: '14px', fontWeight: '500', padding: '8px 16px' }}>
              {updating ? <Spinner size="sm" animation="border" className="me-2"/> : null}
              {updating ? 'Updating...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default UserAccountsPage;
