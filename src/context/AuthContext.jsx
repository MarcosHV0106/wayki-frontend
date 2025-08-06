// src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    try {
      const user = localStorage.getItem('usuario');
      const parsed = user ? JSON.parse(user) : null;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      console.error('Error al parsear usuario del localStorage:', error);
      return null;
    }
  });

  const login = (datosUsuario) => {
    if (datosUsuario && typeof datosUsuario === 'object') {
      setUsuario(datosUsuario);
      localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    } else {
      console.warn('Intento de login con datos inválidos:', datosUsuario);
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

