// src/pages/Login.jsx
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import AnimatedPage from "../components/AnimatedPage";
import { toast } from 'sonner'; // ✅ Nuevo
import { Eye, EyeOff } from 'lucide-react'; // <-- 1. IMPORTAR ÍCONOS


const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // <-- 2. AÑADIR ESTADO
  const { login } = useAuth();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // ✅ GUARDAMOS la respuesta de axios
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/usuarios/login`, {
      email,
      password,
    });

    // ✅ Ahora sí puedes acceder a response.data
    const token = response.data.token;
    localStorage.setItem('token', token);

    const usuario = response.data.usuario;
    const { id, nombre, email: emailUsuario, rol } = usuario;
    const usuarioData = { id, nombre, email: emailUsuario, rol };

    localStorage.setItem('usuario', JSON.stringify(usuarioData));
    login(usuarioData);

    toast.success(`Bienvenido, ${nombre}!`);

    setTimeout(() => {
      if (emailUsuario === 'admin@wayki.com') {
        navigate('/admin');
      } else {
        navigate('/mesas');
      }
    }, 0);

  } catch (error) {
    console.error('Error al iniciar sesión:', error.response?.data?.message || error.message);
    toast.error('Credenciales incorrectas o error de conexión.');
  }
};


  return (
    <AnimatedPage>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white dark:from-gray-900 dark:to-gray-800 px-4">
        <motion.div
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <h2 className="text-3xl font-extrabold text-center text-gray-800 dark:text-white mb-6 tracking-wide drop-shadow-sm">
            Iniciar Sesión
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Correo</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white transition"
                required
              />
            </div>

            {/* === SECCIÓN DE CONTRASEÑA MODIFICADA === */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Contraseña</label>
              {/* 3. Contenedor relativo para posicionar el ícono */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} // <-- Cambia el tipo de input dinámicamente
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // Añadimos padding a la derecha (pr-10) para que el texto no se solape con el ícono
                  className="w-full px-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white transition"
                  required
                />
                {/* 4. Botón para el ícono */}
                <button
                  type="button" // Importante para que no envíe el formulario
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-sky-500 transition"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {/* ======================================= */}
            
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow hover:shadow-md"
            >
              Ingresar
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400 italic">
            ¿Olvidaste tu contraseña?
          </p>
        </motion.div>
      </div>
    </AnimatedPage>
  );
};

export default Login;
