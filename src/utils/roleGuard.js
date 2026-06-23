export const ROLES = {
  USER: 'user',
  MANAGER: 'manager',
  STAFF: 'staff'
};

export const hasRole = (userRole, allowedRoles = []) => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole.toLowerCase());
};
