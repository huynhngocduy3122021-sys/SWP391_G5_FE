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
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500));
  },
  confirmExit: async (data) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500));
  },
  reportIncident: async (data) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500));
  }
};

export default staffApi;
