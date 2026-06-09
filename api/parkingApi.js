import API from './config.js';

const parkingApi = {
    getAllSlots: async () => {
        const response = await API.get('/api/parking/slots');
        return response.data; // Trả về mảng danh sách slot
    },
    getSlotById: async (id) => {
        const response = await API.get(`/api/parking/slots/${id}`);
        return response.data;
    },
    createSlot: async (slotData) => {
        const response = await API.post('/api/parking/slots', slotData);
        return response.data;
    },
    updateSlot: async (id, slotData) => {
        const response = await API.put(`/api/parking/slots/${id}`, slotData);
        return response.data;
    },
    deleteSlot: async (id) => {
        const response = await API.delete(`/api/parking/slots/${id}`);
        return response.data;
    }
};

export default parkingApi;