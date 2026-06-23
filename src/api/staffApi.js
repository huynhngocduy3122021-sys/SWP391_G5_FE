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
  confirmEntry: async (data) => {
    const payload = {
      licensePlate: data.plateNumber.replace(/[^A-Za-z0-9\-.]/g, ''),
      vehicleTypeId: data.vehicleType === 'Xe máy' ? 2 : 1,
      cardCode: data.cardCode || `CARD-${Math.floor(Math.random() * 10000)}`,
      vehicleBrand: data.vehicleType,
    };
    return (await API.post('/api/parking-sessions/guest/check-in', payload)).data;
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
