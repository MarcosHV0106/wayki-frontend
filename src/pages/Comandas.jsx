import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import { toast } from 'sonner';
import { imprimirComandaBluetooth, pruebaImpresionSimple } from '../utils/impresionBluetooth'; // ⬅️ importar el módulo
const API = import.meta.env.VITE_API_URL;
const categorias = [
  "Entrada",
  "Segundo",
  "Ejecutivo",
  "Caldos",
  "Platos a la Carta",
  "Platos Marinos",
  "Bebida"
];


const Comandas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const mesaId = searchParams.get('mesaId');
  const numeroMesa = searchParams.get('numero');
  const tipoMesa = searchParams.get('tipo'); // 'familiar' o null

  const [platos, setPlatos] = useState([]);
  const [comanda, setComanda] = useState([]);
  const [, setEstadoMesa] = useState(null);
  const [mostrarModalExito, setMostrarModalExito] = useState(false); // ✅ Modal estado
  const [mesasAsociadas, setMesasAsociadas] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(categorias[0]);


  useEffect(() => {
    const obtenerPlatos = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/platos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlatos(response.data);
      } catch (error) {
        console.error('Error al obtener platos:', error);
      }
    };
    obtenerPlatos();
  }, []);

  useEffect(() => {
    const obtenerEstadoMesa = async () => {
      try {
        const token = localStorage.getItem('token');
        const endpoint = tipoMesa === 'familiar'
        ? `${API}/mesas-familiares/${mesaId}`
        : `${API}/mesas/${mesaId}`;

        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setEstadoMesa(response.data.estado);

        // ✅ Guardar mesas asociadas si es familiar
        if (tipoMesa === 'familiar' && response.data.mesas) {
          setMesasAsociadas(response.data.mesas.map(m => m.id));
        }
      } catch (error) {
        console.error("Error al obtener estado de la mesa:", error);
      }
    };
    obtenerEstadoMesa();
  }, [mesaId]);

  const agregarPlato = (plato) => {
    setComanda(currentComanda => {
      const yaExiste = currentComanda.find(item => item.id === plato.id);
      if (yaExiste) {
        return currentComanda.map(item =>
          item.id === plato.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        return [...currentComanda, { ...plato, cantidad: 1, notas: "" }];
      }
    });
  };

  const actualizarCantidad = (id, delta) => {
    setComanda(currentComanda => currentComanda.map(item =>
      item.id === id
        ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
        : item
    ));
  };

  const eliminarPlato = (id) => {
    setComanda(currentComanda => currentComanda.filter(item => item.id !== id));
  };

  const cancelar = () => navigate('/mesas');

  const confirmar = async () => {
    const total = parseFloat(calcularTotalConMenu().toFixed(2));
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Token no encontrado. Inicia sesión nuevamente.');
      return;
    }

    let usuarioId = null;
    try {
      const decoded = jwtDecode(token);
      usuarioId = decoded.id;
    } catch (error) {
      toast.error('Token inválido. Por favor vuelve a iniciar sesión.');
      return;
    }

    const payload = {
      usuarioId,
      total,
      tipo: tipoMesa,
      items: comanda.map(plato => ({
        platoId: plato.id,
        cantidad: plato.cantidad || 1,
        precioUnitario: parseFloat(plato.precio),
        notas: plato.notas || '',
      })),
      ...(tipoMesa === 'familiar'
        ? { mesaFamiliarId: parseInt(mesaId) }
        : { mesaId: parseInt(mesaId) }),
    };

    try {
      // 1. Crear comanda
      console.log('📦 Payload enviado:', payload);
      const res = await axios.post(`${API}/comandas`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const nuevaComanda = res.data.comanda;

      // 1.5 Imprimir comanda en la BT-581 (directo desde Android con Capacitor)
      try {
        await imprimirComandaBluetooth({
          mesa: { nombre: `Mesa #${numeroMesa}` },
          mesero: { nombre: "Mesero asignado" },
          platos: comanda.map(p => ({
            nombre: p.nombre,
            cantidad: p.cantidad
          }))
        });
        toast.success(`✅ Comanda impresa para mesa #${numeroMesa}`);
      } catch (printError) {
        console.error('❌ Error al imprimir comanda:', printError);
        toast.error('Comanda registrada, pero hubo un error al imprimir: ' + printError);
      }

      // 2. Actualizar estado de la mesa según tipo
      const url = tipoMesa === 'familiar'
        ? `${API}/mesas-familiares/${mesaId}`
        : `${API}/mesas/${mesaId}`;

      const data = tipoMesa === 'familiar'
        ? {
            estado: 'Preparando',
            nombre: `Mesa Familiar #${numeroMesa}`,
            mesasIds: mesasAsociadas,
          }
        : { estado: 'Preparando' };

      await axios.put(url, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success(`✅ Comanda enviada para mesa #${numeroMesa}`);
      setMostrarModalExito(true);

    } catch (error) {
      console.error('❌ Error al confirmar comanda:', error);
      toast.error('Error al registrar la comanda. Intenta nuevamente.');
    }
  };

  const calcularTotalConMenu = () => {
    let total = 0;
    const items = [];
    comanda.forEach(item => {
      for (let i = 0; i < item.cantidad; i++) {
        items.push({ ...item, cantidad: 1 });
      }
    });
    const entradas = items.filter(p => p.categoria === 'Entrada');
    const segundos = items.filter(p => p.categoria === 'Segundo');
    const ejecutivos = items.filter(p => p.categoria === 'Ejecutivo');
    let entradasUsadas = 0;
    let segundosUsados = 0;
    let ejecutivosUsados = 0;
    const cantidadMenusEjecutivo = Math.min(entradas.length, ejecutivos.length);
    total += cantidadMenusEjecutivo * 18;
    entradasUsadas += cantidadMenusEjecutivo;
    ejecutivosUsados += cantidadMenusEjecutivo;
    const entradasDisponiblesParaSegundo = entradas.length - entradasUsadas;
    const cantidadMenusSegundo = Math.min(entradasDisponiblesParaSegundo, segundos.length);
    total += cantidadMenusSegundo * 14;
    entradasUsadas += cantidadMenusSegundo;
    segundosUsados += cantidadMenusSegundo;
    const restantes = items.filter(p => {
      if (p.categoria === 'Entrada' && entradasUsadas > 0) {
        entradasUsadas--;
        return false;
      }
      if (p.categoria === 'Segundo' && segundosUsados > 0) {
        segundosUsados--;
        return false;
      }
      if (p.categoria === 'Ejecutivo' && ejecutivosUsados > 0) {
        ejecutivosUsados--;
        return false;
      }
      return true;
    });
    restantes.forEach(p => {
      total += Number(p.precio);
    });
    return total;
  };

  
  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-tr from-white to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4 sm:px-6 md:px-8 py-6">
        <motion.h1
          className="text-3xl font-extrabold mb-6 text-center text-sky-700 dark:text-sky-300 drop-shadow"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
         Crear Comanda - {tipoMesa === 'familiar' ? 'Mesa Familiar' : 'Mesa'} #{numeroMesa}
        </motion.h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 mt-8">Platos Disponibles</h2>
        <div className="mb-6 flex items-center gap-4">
          <label className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
            Seleccionar Categoría:
          </label>
          <select
            className="w-full sm:w-64 p-2 rounded border dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          >
            {categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>


{/* Lista de platos filtrados */}
<div className="mb-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden p-4">
  <motion.div
    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
    initial="hidden"
    animate="visible"
    variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
  >
    {platos.filter(p => p.categoria === categoriaSeleccionada).map(plato => (
      <motion.div
        key={plato.id}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow flex flex-col justify-between"
        whileHover={{ scale: 1.03 }}
      >
        <div>
          <h4 className="font-semibold text-lg text-gray-800 dark:text-white">{plato.nombre}</h4>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">S/ {plato.precio}</p>
        </div>
        <button
          onClick={() => agregarPlato(plato)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md mt-auto font-medium transition"
        >
          Agregar +
        </button>
      </motion.div>
    ))}
  </motion.div>
</div>


        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3 mt-10">Comanda Actual</h2>
        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md transition-all duration-300 overflow-x-auto max-w-full">
          {comanda.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">Aún no se ha agregado ningún plato.</p>
          ) : (
            comanda.map(item => (
              <div key={item.id} className="mb-4 border-b pb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-800 dark:text-white font-medium">
                    {item.nombre} × {item.cantidad}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => actualizarCantidad(item.id, -1)} className="bg-gray-300 dark:bg-gray-600 px-2 rounded text-black dark:text-white">-</button>
                    <button onClick={() => actualizarCantidad(item.id, 1)} className="bg-gray-300 dark:bg-gray-600 px-2 rounded text-black dark:text-white">+</button>
                    <button onClick={() => eliminarPlato(item.id)} className="text-red-600 hover:text-red-800 font-bold">×</button>
                  </div>
                </div>
                <textarea
                  placeholder="Notas especiales (opcional)"
                  value={item.notas || ''}
                  onChange={(e) => {
                    const nuevaNota = e.target.value;
                    setComanda(prev => prev.map(p => p.id === item.id ? { ...p, notas: nuevaNota } : p));
                  }}
                  className="w-full p-2 rounded-md text-sm border dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-white"
                />
              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-between items-center gap-4 sm:gap-6">
          <button
            onClick={cancelar}
            className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg font-semibold shadow"
          >
            Cancelar
          </button>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            Total: S/ {calcularTotalConMenu().toFixed(2)}
          </h3>
          <button
            onClick={confirmar}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition"
          >
            Confirmar Comanda
          </button>
          <button
          onClick={pruebaImpresionSimple}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition"
          type="button"
        >
          Probar Impresión Bluetooth
        </button>
        </div>

        {/* ✅ MODAL DE ÉXITO */}
        {mostrarModalExito && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl w-full mx-4 sm:mx-0 max-w-md"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-center text-green-700 dark:text-green-400 mb-4">
                ✅ Comanda registrada
              </h2>
              <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
                El pedido ha sido enviado a cocina. Mesa #{numeroMesa} está ahora en preparación.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/mesas')}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold transition"
                >
                  Volver al Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default Comandas;
