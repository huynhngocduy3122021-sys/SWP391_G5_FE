// authApi - Các hàm gọi API liên quan tới xác thực người dùng (đăng nhập, đăng ký, profile)
import API from '../../../shared/api/config';

const authApi = {
  login: async (data) => (await API.post('/api/auth/login', data)).data,
  verifyOtp: async (data) => (await API.post('/api/auth/verify-otp', data)).data,
  register: async (data) => (await API.post('/api/auth/register', data)).data,
  adminCreateUser: async (data) => (await API.post('/api/auth/admin-create', data)).data,
  resetPassword: async (data) => (await API.post('/api/auth/reset-password', data)).data,
  getAllUsers: async () => (await API.get('/api/auth/users')).data,
  getUserById: async (id) => (await API.get(`/api/auth/users/${id}`)).data,
  updateUser: async (id, data) => (await API.put(`/api/auth/users/${id}`, data)).data,
  deleteUser: async (id) => (await API.delete(`/api/auth/users/${id}`)).data,
  changePassword: async (id, data) => (await API.put(`/api/auth/users/${id}/change-password`, data)).data,
};

export default authApi;
