import API from './config';

const adminApi = {
  // Get all users in the system
  getAllUsers: async () => {
    return (await API.get('/api/auth/users')).data;
  },

  // Admin creates a new user account (Staff, Manager, etc.)
  adminCreateUser: async (userData) => {
    if (userData.userRole === 'STAFF') {
      return (await API.post('/api/auth/staff', userData)).data;
    }
    if (userData.userRole === 'MANAGER') {
      return (await API.post('/api/auth/manager', userData)).data;
    }
    return (await API.post('/api/auth/admin-create', userData)).data;
  },

  // Update an existing user's details
  updateUser: async (id, userData) => {
    return (await API.put(`/api/auth/users/${id}`, userData)).data;
  },

  // Delete/Disable a user account by ID
  deleteUser: async (id) => {
    return (await API.delete(`/api/auth/users/${id}`)).data;
  },

  // Get all bookings for statistical analysis
  getAllBookings: async () => {
    return (await API.get('/api/bookings')).data;
  },

  // Get all parking sessions for live tracking
  getAllSessions: async () => {
    return (await API.get('/api/parking-sessions')).data;
  },

  // Get all incidents/tickets for support tracking
  getAllIncidents: async () => {
    return (await API.get('/api/incidents')).data;
  },

  // Get all payments for revenue report (includes paidAt for accurate timing)
  getAllPayments: async () => {
    return (await API.get('/api/payments/all')).data;
  },

  // Resolve an incident
  resolveIncident: async (id, resolveData) => {
    return (await API.put(`/api/incidents/${id}/resolve`, resolveData)).data;
  },

  // Cancel an incident
  cancelIncident: async (id, cancelData) => {
    return (await API.put(`/api/incidents/${id}/cancel`, cancelData)).data;
  },

  // Get permission matrix (persisted in localStorage to act like a real database API)
  getRolePermissions: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const stored = localStorage.getItem('vinparking_role_permissions');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default matrix
    const defaultMatrix = {
      ADMIN: {
        users: ['view', 'edit', 'delete', 'admin'],
        parking: ['view', 'edit', 'delete', 'admin'],
        bookings: ['view', 'edit', 'delete', 'admin'],
        incidents: ['view', 'edit', 'delete', 'admin']
      },
      MANAGER: {
        users: ['view', 'edit'],
        parking: ['view', 'edit', 'delete'],
        bookings: ['view', 'edit'],
        incidents: ['view', 'edit']
      },
      STAFF: {
        users: ['view'],
        parking: ['view'],
        bookings: ['view', 'edit'],
        incidents: ['view', 'edit']
      },
      USER: {
        users: ['view'],
        parking: ['view'],
        bookings: ['view', 'edit'],
        incidents: ['view']
      }
    };
    localStorage.setItem('vinparking_role_permissions', JSON.stringify(defaultMatrix));
    return defaultMatrix;
  },

  // Save permission matrix
  saveRolePermissions: async (matrix) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.setItem('vinparking_role_permissions', JSON.stringify(matrix));
    return { success: true, message: 'Permissions updated successfully' };
  }
};

export default adminApi;
