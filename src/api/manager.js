import API from './config';

const managerApi = {
  // ── Parking Branch ────────────────────────────────────────
  getParkingBranches:       async ()           => (await API.get('/api/parking-branches')).data,
  getParkingBranchById:     async (id)         => (await API.get(`/api/parking-branches/${id}`)).data,
  createParkingBranch:      async (data)       => (await API.post('/api/parking-branches', data)).data,
  updateParkingBranch:      async (id, data)   => (await API.put(`/api/parking-branches/${id}`, data)).data,
  updateParkingBranchStatus: async (id, active) => (await API.patch(`/api/parking-branches/${id}/status`, null, { params: { active } })).data,

  // ── Parking Floor ─────────────────────────────────────────
  getAllFloors:              async ()           => (await API.get('/api/parking-floors')).data,
  getParkingFloorById:      async (id)         => (await API.get(`/api/parking-floors/${id}`)).data,
  getParkingFloorsByBranch: async (branchId)   => (await API.get(`/api/parking-floors/branch/${branchId}`)).data,
  createFloor:              async (data)       => (await API.post('/api/parking-floors', data)).data,
  updateFloor:              async (id, data)   => (await API.put(`/api/parking-floors/${id}`, data)).data,
  updateFloorStatus:        async (id, active) => (await API.patch(`/api/parking-floors/${id}/status`, null, { params: { active } })).data,
  deleteFloor:              async (id)         => (await API.delete(`/api/parking-floors/${id}`)).data,

  // ── Parking Zone ──────────────────────────────────────────
  getAllZones:               async ()           => (await API.get('/api/parking-zones')).data,
  getParkingZoneById:       async (id)         => (await API.get(`/api/parking-zones/${id}`)).data,
  getParkingZonesByBranch:  async (branchId)   => (await API.get(`/api/parking-zones/branch/${branchId}`)).data,
  createZone:               async (data)       => (await API.post('/api/parking-zones', data)).data,
  updateZone:               async (id, data)   => (await API.put(`/api/parking-zones/${id}`, data)).data,
  updateZoneStatus:         async (id, active) => (await API.patch(`/api/parking-zones/${id}/status`, null, { params: { active } })).data,
  deleteZone:               async (id)         => (await API.delete(`/api/parking-zones/${id}`)).data,

  // ── Vehicle Types ─────────────────────────────────────────
  getVehicleTypes:          async ()           => (await API.get('/api/vehicle-types')).data,

  // ── Vehicles ──────────────────────────────────────────────
  getAllVehicles:            async ()           => (await API.get('/api/vehicles')).data,
  getVehicleById:           async (id)         => (await API.get(`/api/vehicles/${id}`)).data,
  createVehicle:            async (data)       => (await API.post('/api/vehicles', data)).data,
  updateVehicle:            async (id, data)   => (await API.put(`/api/vehicles/${id}`, data)).data,
  deleteVehicle:            async (id)         => (await API.delete(`/api/vehicles/${id}`)).data,

  // ── Price Policy ──────────────────────────────────────────
  getPricePolicies:         async ()           => (await API.get('/api/price-policies')).data,
  createPricePolicy:        async (data)       => (await API.post('/api/price-policies', data)).data,
  updatePricePolicy:        async (id, data)   => (await API.put(`/api/price-policies/${id}`, data)).data,
  deletePricePolicy:        async (id)         => (await API.delete(`/api/price-policies/${id}`)).data,

  // ── Parking Card ──────────────────────────────────────────
  getParkingCards:          async ()           => (await API.get('/api/parking-cards')).data,
  createParkingCard:        async (data)       => (await API.post('/api/parking-cards', data)).data,
  updateParkingCard:        async (id, data)   => (await API.put(`/api/parking-cards/${id}`, data)).data,
  deleteParkingCard:        async (id)         => (await API.delete(`/api/parking-cards/${id}`)).data,

  // ── Monthly Ticket (Vé Tháng) ─────────────────────────────
  // POST body: { vehicleId, parkingCardId, guestName?, guestPhone?, startDate, endDate, status? }
  getAllMonthlyTickets:      async ()           => (await API.get('/api/monthly-tickets')).data,
  getMonthlyTicketById:     async (id)         => (await API.get(`/api/monthly-tickets/${id}`)).data,
  createMonthlyTicket:      async (data)       => (await API.post('/api/monthly-tickets', data)).data,
  updateMonthlyTicket:      async (id, data)   => (await API.put(`/api/monthly-tickets/${id}`, data)).data,
  deleteMonthlyTicket:      async (id)         => (await API.delete(`/api/monthly-tickets/${id}`)).data,

  // ── Monthly Ticket Requests ───────────────────────────────
  getAllMonthlyTicketRequests: async ()         => (await API.get('/api/monthly-ticket-requests')).data,
  updateMonthlyTicketRequestStatus: async (id, status) => (await API.put(`/api/monthly-ticket-requests/${id}/status`, null, { params: { status } })).data,

  // ── Incident Report ───────────────────────────────────────
  getIncidentReports:       async (params = {}) => (await API.get('/api/incidents', { params })).data,
  createIncidentReport:     async (data)        => (await API.post('/api/incidents', data)).data,
  resolveIncident:          async (id, data)    => (await API.put(`/api/incidents/${id}/resolve`, data)).data,
  cancelIncident:           async (id, data)    => (await API.put(`/api/incidents/${id}/cancel`, data)).data,
  assignIncident:           async (id, staffId) => (await API.put(`/api/incidents/${id}/assign`, { staffId: Number(staffId), assignedStaffId: Number(staffId), id: Number(staffId), userId: Number(staffId) })).data,

  // ── Parking Sessions (dùng cho Overview) ──────────────────
  getAllSessions:            async (params = {}) => (await API.get('/api/parking-sessions', { params })).data,
  getSessionImages:          async (id)          => (await API.get(`/api/parking-session/${id}/images`)).data,
};

export default managerApi;
