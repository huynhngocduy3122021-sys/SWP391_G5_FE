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
  checkInBooking: async (bookingCode, cardCode, time) => (await API.post('/api/parking-sessions/booking/check-in', null, { params: { bookingCode, cardCode, time } })).data,
  
  // New Methods for Booking form
  getAllVehicleTypes: async () => (await API.get('/api/vehicle-types')).data,
  getAllPricePolicies: async () => (await API.get('/api/price-policies')).data,
  // Vehicle management
  getAllVehicles: async () => (await API.get('/api/vehicles')).data,
  createVehicle: async (data) => (await API.post('/api/vehicles', data)).data,
  updateVehicle: async (id, data) => (await API.put(`/api/vehicles/${id}`, data)).data,
  deleteVehicle: async (id) => (await API.delete(`/api/vehicles/${id}`)).data,
  getMyMonthlyTickets: async () => (await API.get('/api/monthly-tickets/my-tickets')).data,
  
  // Monthly Ticket Requests
  submitMonthlyTicketRequest: async (data) => (await API.post('/api/monthly-ticket-requests', data)).data,
  getAllMonthlyTicketRequests: async () => (await API.get('/api/monthly-ticket-requests')).data,
  getMyMonthlyTicketRequests: async () => (await API.get('/api/monthly-ticket-requests/my-requests')).data,
  updateMonthlyTicketRequestStatus: async (id, status) => (await API.put(`/api/monthly-ticket-requests/${id}/status`, null, { params: { status } })).data,
  // Payment for monthly ticket
  createMonthlyTicketPayment: async (requestId) => (await API.post(`/api/payments/monthly-ticket/${requestId}/vnpay`)).data,
  getVnpayReturnInfo: async (params) => (await API.get('/api/payments/vnpay-return', { params })).data,
};

export default parkingApi;
