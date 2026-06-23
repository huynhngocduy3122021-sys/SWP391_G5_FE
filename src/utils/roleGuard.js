export const ROLES = {
  USER: 'user',
  MANAGER: 'manager',
  STAFF: 'staff',
  CUSTOMER: 'customer'
};

export const hasRole = (userRole, allowedRoles = []) => {
  if (!userRole) return false;
  const role = userRole.toLowerCase();
  const normalizedRole = role === 'customer' ? 'user' : role;
  return allowedRoles.includes(role) || allowedRoles.includes(normalizedRole);
};
