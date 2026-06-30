import API from './config';

const parkingApi = {
  getAllSlots: async () => (await API.get('/api/parking/slots')).data,
  createSlot: async (data) => (await API.post('/api/parking/slots', data)).data,
  updateSlot: async (id, data) => (await API.put(`/api/parking/slots/${id}`, data)).data,
  deleteSlot: async (id) => (await API.delete(`/api/parking/slots/${id}`)).data,
  getAllBranches: async () => (await API.get('/api/parking-branches')).data,
  getZonesByBranch: async (branchId) => (await API.get(`/api/parking-zones/branch/${branchId}`)).data,
  getAllSessions: async () => (await API.get('/api/parking-sessions')).data,
  
  // Booking API methods
  createBooking: async (data) => (await API.post('/api/bookings', data)).data,
  getMyBookings: async () => (await API.get('/api/bookings/my-bookings')).data,
  cancelBooking: async (bookingId) => (await API.post(`/api/bookings/${bookingId}/cancel`)).data,
  getBookingByCode: async (bookingCode) => (await API.get(`/api/bookings/code/${bookingCode}`)).data,
  checkInBooking: async (bookingCode, cardCode) => (await API.post('/api/parking-sessions/booking/check-in', null, { params: { bookingCode, cardCode } })).data,
  
  // New Methods for Booking form
  getAllVehicleTypes: async () => (await API.get('/api/vehicle-types')).data,
  getAllPricePolicies: async () => (await API.get('/api/price-policies')).data,
};

export default parkingApi;
