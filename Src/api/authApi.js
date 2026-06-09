import API from './config.js';

const authApi = {
    register: async (registerData) => {
        const response = await API.post('/api/auth/register', registerData);
        return response.data;
    },
    login: async (loginData) => {
        const response = await API.post('/api/auth/login', loginData);
        return response.data;
    },
    resetPassword: async (resetPasswordData) => {
        const response = await API.post('/api/auth/reset-password', resetPasswordData);
        return response.data;
    },
    getAllUsers: async () => {
        const response = await API.get('/api/auth/users');
        return response.data;
    },
    getUserById: async (id) => {
        const response = await API.get(`/api/auth/users/${id}`);
        return response.data;
    },
    changePassword: async (id, changePasswordData) => {
        const response = await API.put(`/api/auth/users/${id}/change-password`, changePasswordData);
        return response.data;
    },
    updateUser: async (id, userData) => {
        const response = await API.put(`/api/auth/users/${id}`, userData);
        return response.data;
    },
    deleteUser: async (id) => {
        const response = await API.delete(`/api/auth/users/${id}`);
        return response.data;
    }
};

export default authApi;
