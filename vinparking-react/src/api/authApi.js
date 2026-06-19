import API from './config';

const authApi = {
  login: async (data) => (await API.post('/api/auth/login', data)).data,
  register: async (data) => (await API.post('/api/auth/register', data)).data,
  resetPassword: async (data) => (await API.post('/api/auth/reset-password', data)).data,
  getAllUsers: async () => (await API.get('/api/auth/users')).data,
  updateUser: async (id, data) => (await API.put(`/api/auth/users/${id}`, data)).data,
  deleteUser: async (id) => (await API.delete(`/api/auth/users/${id}`)).data,
};

export default authApi;
