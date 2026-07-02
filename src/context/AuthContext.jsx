import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    return token ? {
      token,
      email: localStorage.getItem('email'),
      role: localStorage.getItem('role')?.toLowerCase() || 'user',
      fullName: localStorage.getItem('fullName'),
      userId: localStorage.getItem('userId'),
      phone: localStorage.getItem('phone') || localStorage.getItem('userPhone'),
      address: localStorage.getItem('address') || localStorage.getItem('userAddress'),
      parkingBranchId: localStorage.getItem('parkingBranchId'),
      parkingBranchName: localStorage.getItem('parkingBranchName')
    } : null;
  });

  const navigate = useNavigate();

  // Listen to storage events to sync auth state across tabs
  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setUser({
          token,
          email: localStorage.getItem('email'),
          role: localStorage.getItem('role')?.toLowerCase() || 'user',
          fullName: localStorage.getItem('fullName'),
          userId: localStorage.getItem('userId'),
          phone: localStorage.getItem('phone') || localStorage.getItem('userPhone'),
          address: localStorage.getItem('address') || localStorage.getItem('userAddress'),
          parkingBranchId: localStorage.getItem('parkingBranchId'),
          parkingBranchName: localStorage.getItem('parkingBranchName')
        });
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('email', userData.userEmail);
    localStorage.setItem('role', userData.userRole);
    localStorage.setItem('fullName', userData.userFullName);
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('phone', userData.userPhone || '');
    localStorage.setItem('userPhone', userData.userPhone || '');
    localStorage.setItem('address', userData.userAddress || '');
    localStorage.setItem('userAddress', userData.userAddress || '');
    if (userData.parkingBranchId) {
      localStorage.setItem('parkingBranchId', String(userData.parkingBranchId));
    }
    if (userData.parkingBranchName) {
      localStorage.setItem('parkingBranchName', userData.parkingBranchName);
    }
    
    setUser({
      token: userData.token,
      email: userData.userEmail,
      role: userData.userRole?.toLowerCase() || 'user',
      fullName: userData.userFullName,
      userId: userData.userId,
      phone: userData.userPhone || '',
      address: userData.userAddress || '',
      parkingBranchId: userData.parkingBranchId,
      parkingBranchName: userData.parkingBranchName
    });
    
    window.dispatchEvent(new Event('storage'));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userId');
    localStorage.removeItem('phone');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('address');
    localStorage.removeItem('userAddress');
    localStorage.removeItem('parkingBranchId');
    localStorage.removeItem('parkingBranchName');
    setUser(null);
    window.dispatchEvent(new Event('storage'));
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
