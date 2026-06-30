import API from './config';

const managerApi = {
  getSessions: async () => {
    return (await API.get('/api/parking-sessions')).data;
  },
  getZones: async () => {
    return (await API.get('/api/parking-zones')).data;
  },
  getIncidents: async (params = { page: 0, size: 50 }) => {
    return (await API.get('/api/incidents', { params })).data;
  },
  resolveIncident: async (id, data) => {
    return (await API.put(`/api/incidents/${id}/resolve`, data)).data;
  },
  cancelIncident: async (id, data) => {
    return (await API.put(`/api/incidents/${id}/cancel`, data)).data;
  },
  assignIncident: async (incidentId, staffId) => {
    const payload = {
      staffId: Number(staffId),
      assignedStaffId: Number(staffId),
      id: Number(staffId),
      userId: Number(staffId)
    };
    return (await API.put(`/api/incidents/${incidentId}/assign`, payload)).data;
  }
};

export default managerApi;
