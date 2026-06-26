export const ROLES = {
  USER: 'user',
  MANAGER: 'manager',
  STAFF: 'staff',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export const hasRole = (userRole, allowedRoles = []) => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole.trim().toLowerCase());
};
