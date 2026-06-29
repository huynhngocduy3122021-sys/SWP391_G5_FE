import API from './config';

const managerApi = {
  // Floors (parkingFloor)
  getAllFloors: async () => (await API.get('/api/parking-floors')).data,
  createFloor: async (data) => (await API.post('/api/parking-floors', data)).data,
  updateFloor: async (id, data) => (await API.put(`/api/parking-floors/${id}`, data)).data,
  deleteFloor: async (id) => (await API.delete(`/api/parking-floors/${id}`)).data,

  // Zones (parkingZone)
  getAllZones: async () => (await API.get('/api/parking-zones')).data,
  createZone: async (data) => (await API.post('/api/parking-zones', data)).data,
  updateZone: async (id, data) => (await API.put(`/api/parking-zones/${id}`, data)).data,
  deleteZone: async (id) => (await API.delete(`/api/parking-zones/${id}`)).data,

  // Vehicle Types
  getVehicleTypes: async () => (await API.get('/api/vehicle-types')).data,
};

export default managerApi;
