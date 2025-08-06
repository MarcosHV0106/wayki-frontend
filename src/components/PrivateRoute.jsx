// src/components/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Cambiamos 'role' por 'allowedRoles' que será un arreglo
const PrivateRoute = ({ children, allowedRoles }) => {
  const { usuario } = useAuth();

  // console.log('Usuario desde PrivateRoute:', usuario); // 👈 Puedes descomentar para depurar

  // 1. Si no hay usuario, redirigir al login
  if (!usuario || Object.keys(usuario).length === 0) {
    return <Navigate to="/login" />;
  }

  // 2. Si se especifican roles permitidos, verificar que el rol del usuario esté en la lista
  if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
    // Si el rol del usuario no está en la lista de roles permitidos, redirigir al login
    return <Navigate to="/login" />;
  }

  // 3. Si todo está bien, renderizar los componentes hijos
  return children;
};

export default PrivateRoute;