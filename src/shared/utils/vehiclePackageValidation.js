export const getVehicleTypeId = (vehicle) => {
  return vehicle?.vehicleType?.vehicleTypeId
    ?? vehicle?.vehicleType?.id
    ?? vehicle?.vehicleTypeId
    ?? null;
};

export const getPolicyVehicleTypeId = (policy) => {
  return policy?.vehicleType?.vehicleTypeId
    ?? policy?.vehicleType?.id
    ?? policy?.vehicleTypeId
    ?? null;
};

export const isVehicleCompatibleWithPolicy = (vehicle, policy) => {
  const vehicleTypeId = getVehicleTypeId(vehicle);
  const policyVehicleTypeId = getPolicyVehicleTypeId(policy);

  if (vehicleTypeId == null || policyVehicleTypeId == null) {
    return false;
  }

  return String(vehicleTypeId) === String(policyVehicleTypeId);
};
