export const ROLES = {
  USER: 'user',
  MANAGER: 'manager',
  STAFF: 'staff',
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export const hasRole = (userRole, allowedRoles = []) => {
  if (!userRole) return false;
  const role = userRole.trim().toLowerCase();
  const normalizedRole = role === 'customer' ? 'user' : role;
  return allowedRoles.includes(role) || allowedRoles.includes(normalizedRole);
};
