import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.8/+esm';

export const BASE_URL = 'http://localhost:8081';

// Tạo một instance Axios dùng chung
const API = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Tự động đính kèm Token (Bearer) vào mọi request nếu có
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;