import API from './config';

const staffApi = {
  suggestSlotAllocation: async (plateNumber, vehicleType) => {
    return (await API.post('/api/slot-allocation/suggest', { plateNumber, vehicleType })).data;
  },
  getVehicleTypes: async () => {
    return (await API.get('/api/vehicle-types')).data;
  },
  confirmEntry: async (payload) => {
    return (await API.post('/api/parking-sessions/guest/check-in', payload)).data;
  },
  uploadVehicleImages: async (parkingSessionId, imageType, files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('file', file);
    });
    return (await API.post(`/api/parking-session/${parkingSessionId}/images`, formData, {
      params: { imageType },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })).data;
  },
  getActiveSessionByCardCode: async (cardCode) => {
    return (await API.get('/api/parking-sessions/active-session', {
      params: { cardCode }
    })).data;
  },
  verifyVnPayReturn: async (params) => {
    return (await API.get('/api/payments/vnpay-return', { params })).data;
  },
  confirmExit: async (data) => {
    let paymentMethod = 'CASH';
    if (data.paymentMethod && data.paymentMethod.includes('VNPAY')) paymentMethod = 'VNPAY';
    
    const payload = {
      licensePlate: data.plateNumber.replace(/[^A-Za-z0-9\-.]/g, ''),
      cardCode: data.cardCode || 'UNKNOWN',
      paymentMethod: paymentMethod,
    };
    return (await API.post('/api/parking-sessions/guest/check-out', payload)).data;
  },
  reportIncident: async (data) => {
    return (await API.post('/api/incidents', data)).data;
  }
};

export default staffApi;
