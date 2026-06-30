import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

const API = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Tự động đính kèm token vào mọi request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Xử lý token hết hạn (401)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      // Không tự động redirect nếu đang thực hiện login, reset password hoặc register
      if (!url.includes('/api/auth/login') && !url.includes('/api/auth/reset-password') && !url.includes('/api/auth/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('fullName');
        localStorage.removeItem('userId');
        window.dispatchEvent(new Event('storage'));
        window.location.href = '/auth'; // Redirect to login
      }
    }
    return Promise.reject(error);
  }
);

export default API;
