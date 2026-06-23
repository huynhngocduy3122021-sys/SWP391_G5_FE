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
      userId: localStorage.getItem('userId')
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
          userId: localStorage.getItem('userId')
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
    
    setUser({
      token: userData.token,
      email: userData.userEmail,
      role: userData.userRole?.toLowerCase() || 'user',
      fullName: userData.userFullName,
      userId: userData.userId
    });
    
    window.dispatchEvent(new Event('storage'));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userId');
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
