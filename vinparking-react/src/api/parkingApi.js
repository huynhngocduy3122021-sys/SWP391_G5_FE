import API from './config';

const parkingApi = {
  getAllSlots: async () => (await API.get('/api/parking/slots')).data,
  createSlot: async (data) => (await API.post('/api/parking/slots', data)).data,
  updateSlot: async (id, data) => (await API.put(`/api/parking/slots/${id}`, data)).data,
  deleteSlot: async (id) => (await API.delete(`/api/parking/slots/${id}`)).data,
};

export default parkingApi;
