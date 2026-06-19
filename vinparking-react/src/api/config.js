import axios from 'axios';

export const BASE_URL = 'http://localhost:8081';

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

export default API;
