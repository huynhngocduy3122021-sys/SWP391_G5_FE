import API from './config';

const staffApi = {
  suggestSlotAllocation: async (plateNumber, vehicleType) => {
    return (await API.post('/api/slot-allocation/suggest', { plateNumber, vehicleType })).data;
  },
  getVehicleTypes: async () => {
    return (await API.get('/api/vehicle-types')).data;
  },
  verifyLicensePlate: async (plateNumber, imageFile) => {
    const formData = new FormData();
    formData.append('licensePlate', plateNumber);
    formData.append('image', imageFile);
    formData.append('regions', 'vn');
    return (await API.post('/api/license-plate/verify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })).data;
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
  getActiveSessionByLicensePlate: async (licensePlate) => {
    return (await API.get('/api/parking-sessions/active-session/license-plate', {
      params: { licensePlate }
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
    let incidentType = 'OTHER';
    switch (data.type) {
      case 'Mất thẻ': incidentType = 'LOST_CARD'; break;
      case 'Barie kẹt': incidentType = 'BARRIER_ERROR'; break;
      case 'Khách không thanh toán': incidentType = 'PAYMENT_ERROR'; break;
      case 'Sai biển số': incidentType = 'OTHER'; break;
      default: incidentType = 'OTHER'; break;
    }

    const title = `Yêu cầu hỗ trợ: ${data.type} - Xe ${data.plateNumber || 'Không rõ'}`;
    const description = data.note ? data.note : title;

    const payload = {
      title,
      description,
      incidentType,
      locationDetails: `Cổng: ${data.gateId || 'Không rõ'}`,
      parkingBranchId: Number(localStorage.getItem('branchId')) || 1 // Fallback to branch 1
    };

    return (await API.post('/api/incidents', payload)).data;
  },
  reportLostCard: async (payload) => {
    return (await API.post('/api/incidents/lost-card', payload)).data;
  }
};

export default staffApi;
