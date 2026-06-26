import API from './config';

const staffApi = {
  suggestSlotAllocation: async (plateNumber, vehicleType) => {
    // Simulate API call for AI suggestion
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          slotCode: 'B1-A05',
          matchPercent: 98.4,
          location: 'Level B1 - Sector A (Premium)',
          proximity: 'Near Elevator #4 (12m)'
        });
      }, 500);
    });
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
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500));
  }
};

export default staffApi;
