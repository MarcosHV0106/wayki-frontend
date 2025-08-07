import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import { Users, Eye, DollarSign, Plus } from 'lucide-react'; // Cambié CheckCircle por Users para el botón familiar
import { toast } from 'sonner';


const MesaPanel = () => {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const navigate = useNavigate();
  

  useEffect(() => {
    fetchMesas();
  }, [navigate]);

  const fetchMesas = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resMesas, resFamiliares] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/mesas`, { headers }),
      axios.get(`${import.meta.env.VITE_API_URL}/mesas-familiares`, { headers }),

      ]);

      const userData = parseJwt(token);
      const rolesPermitidos = ['Mesero', 'Administradora'];
      if (!rolesPermitidos.includes(userData.rol)) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }

      const mesas = resMesas.data;
      const familiares = resFamiliares.data;

      const mesasFamiliares = familiares.map((f) => ({
        ...f,
        esFamiliar: true,
        mesasAsociadas: f.mesas,
        colSpan: Math.min(f.mesas.length, 5),
      }));

      const idsMesasAgrupadas = familiares.flatMap((f) =>
        f.mesas.map((m) => m.id)
      );
      const mesasNoAgrupadas = mesas.filter(
        (m) => !idsMesasAgrupadas.includes(m.id)
      );

      const todasMesas = [...mesasNoAgrupadas, ...mesasFamiliares];

      const ordenadas = todasMesas.sort((a, b) => {
        const aNum = a.numero ?? a.mesasAsociadas?.[0]?.numero ?? 0;
        const bNum = b.numero ?? b.mesasAsociadas?.[0]?.numero ?? 0;
        return aNum - bNum;
      });

      setMesas(ordenadas);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar mesas:', error);
    }
  };

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return {};
    }
  };

  const getColor = (estado, nombre, mesaId) => {
    const base =
      estado === 'Disponible' && nombre?.includes('Familiar')
        ? 'bg-blue-400 hover:bg-blue-500'
        : estado === 'Disponible'
        ? 'bg-green-400 hover:bg-green-500'
        : estado === 'Ocupada'
        ? 'bg-red-400 hover:bg-red-500'
        : estado === 'Preparando'
        ? 'bg-yellow-300 hover:bg-yellow-400'
        : 'bg-gray-300';

    const seleccionada = seleccionadas.includes(mesaId)
      ? 'ring-4 ring-blue-600'
      : '';

    return `${base} ${seleccionada}`;
  };

  const toggleSeleccion = (mesaId) => {
    setSeleccionadas((prev) =>
      prev.includes(mesaId)
        ? prev.filter((id) => id !== mesaId)
        : [...prev, mesaId]
    );
  };

  const handleClickMesa = (mesa) => {
    if (mesa.estado === 'Disponible') {
      toggleSeleccion(mesa.id);
    } else if (mesa.estado === 'Preparando') {
      navigate(`/mesas/${mesa.id}`);
    } else if (mesa.estado === 'Ocupada') {
      navigate(`/comanda-ocupada/${mesa.id}`);
    }
  };

  const handleCrearComanda = (mesaId, numeroMesa, esFamiliar = false) => {
    const tipo = esFamiliar ? 'familiar' : 'normal';
    navigate(`/comandas?mesaId=${mesaId}&numero=${numeroMesa}&tipo=${tipo}`);
  };

  const crearMesaFamiliar = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Sesión expirada. Inicia sesión de nuevo.');
      navigate('/');
      return;
    }
    try {
      const toastId = toast.loading('Creando mesa familiar...');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/mesas-familiares`,
        {
          nombre: `Mesa Familiar ${Date.now()}`,
          estado: 'Disponible',
          mesasIds: seleccionadas,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.dismiss(toastId); // ✅ Cerramos el toast de carga
      toast.success('Mesa familiar creada correctamente');
      console.log('Mesa familiar creada:', response.data);
      setSeleccionadas([]);
      fetchMesas();
    } catch (error) {
      console.error(
        'Error al crear mesa familiar:',
        error.response?.data || error.message
      );
      toast.error('Error al crear la mesa familiar.');
    }
  };

const renderMesaCard = (mesa) => {
  const esSeleccionable = mesa.estado === 'Disponible';

  if (mesa.esFamiliar) {
    const colSpan = `col-span-${mesa.colSpan}`;

    return (
      <motion.div
        key={`familiar-${mesa.id}`}
        onClick={() => esSeleccionable && handleClickMesa(mesa)}
        className={`rounded-2xl shadow-xl p-4 sm:p-6 text-center transition-transform transform bg-blue-400 hover:bg-blue-500 border border-white/20 backdrop-blur-sm bg-opacity-90 ${colSpan} ${
          seleccionadas.includes(mesa.id) ? 'ring-4 ring-blue-600' : ''
        } ${esSeleccionable ? 'cursor-pointer' : 'cursor-default'} w-full`}
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        whileHover={esSeleccionable ? { scale: 1.04 } : {}}
      >
        <h2 className="text-lg sm:text-2xl font-bold mb-2 text-white drop-shadow-md">
          Mesa Familiar
        </h2>
        <p className="text-xs sm:text-sm text-white/90 font-medium mb-2">
          Mesas que lo conforman: {mesa.mesasAsociadas?.map((m) => m.numero).join(', ')}
        </p>
        <p className="mb-4 capitalize text-white font-medium drop-shadow text-sm sm:text-base">
          {mesa.estado}
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {mesa.estado === 'Disponible' && !seleccionadas.includes(mesa.id) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCrearComanda(
                  mesa.id,
                  mesa.mesasAsociadas?.[0]?.numero ?? mesa.numero ?? 0,
                  true
                );
              }}
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm sm:text-base font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2"
            >
              <Plus size={16} />
              Agregar Comanda
            </button>
          )}

          {mesa.estado === 'Preparando' && (
            <button
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm sm:text-base font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/comandas/preparando/${mesa.id}?tipo=familiar`);
              }}
            >
              <Eye size={16} />
              Ver Comanda
            </button>
          )}

          {mesa.estado === 'Ocupada' && (
            <button
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm sm:text-base font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/comanda-ocupada/${mesa.id}?tipo=familiar`);
              }}
            >
              <DollarSign size={16} />
              Confirmar Pago
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={mesa.id}
      onClick={() => handleClickMesa(mesa)}
      className={`rounded-2xl shadow-xl p-4 sm:p-6 text-center transition-transform transform ${getColor(
        mesa.estado,
        mesa.nombre,
        mesa.id
      )} border border-white/20 backdrop-blur-sm bg-opacity-90 cursor-pointer w-full`}
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.04 }}
    >
      <h2 className="text-lg sm:text-2xl font-bold mb-2 text-white drop-shadow-md">
        {mesa.nombre || `Mesa ${mesa.numero.toString().padStart(2, '0')}`}
      </h2>
      <p className="mb-4 capitalize text-white font-medium drop-shadow text-sm sm:text-base">
        {mesa.estado}
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {mesa.estado === 'Disponible' && !seleccionadas.includes(mesa.id) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCrearComanda(mesa.id, mesa.numero);
            }}
            className="bg-green-700 hover:bg-green-800 text-white text-sm sm:text-base font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Comanda
          </button>
        )}
        {mesa.estado === 'Preparando' && (
          <button
            className="bg-yellow-700 hover:bg-yellow-800 text-white text-sm sm:text-base font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2"
            onClick={() => navigate(`/comandas/preparando/${mesa.id}`)}
          >
            <Eye size={16} />
            Ver Comanda
          </button>
        )}
        {mesa.estado === 'Ocupada' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/comanda-ocupada/${mesa.id}`);
            }}
            className="bg-red-700 hover:bg-red-800 text-white text-sm sm:text-base font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2"
          >
            <DollarSign size={16} />
            Confirmar Pago
          </button>
        )}
      </div>
    </motion.div>
  );
};

if (loading) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-100 dark:bg-blue-900 p-4">
      <div className="w-10 h-10 sm:w-14 sm:h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-base sm:text-lg text-sky-700 dark:text-sky-200 font-medium">
        Cargando mesas...
      </p>
    </div>
  );
}


  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-300 dark:from-gray-900 dark:to-gray-800 px-2 sm:px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-10">
          <motion.h1
            className="text-4xl font-extrabold text-sky-800 dark:text-sky-300 drop-shadow-md"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Panel de Mesas
          </motion.h1>

          <motion.button
        onClick={() => {
              if (window.confirm("¿Estás seguro de que querés cerrar sesión?")) {
                localStorage.removeItem('token');
                navigate('/');
              }
            }}
            className="text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Cerrar Sesión
          </motion.button>
        </div>


        {/* --- BOTÓN FLOTANTE --- */}
        <AnimatePresence>
          {seleccionadas.length >= 2 && (
            <motion.div
              className="fixed bottom-8 inset-x-0 flex justify-center z-50"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-sm sm:text-base"
                onClick={crearMesaFamiliar}
              >
                <Users size={20} />
                Crear Mesa Familiar ({seleccionadas.length})
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          <AnimatePresence>{mesas.map(renderMesaCard)}</AnimatePresence>
        </motion.div>
      </div>
    </AnimatedPage>
  );
};

export default MesaPanel;