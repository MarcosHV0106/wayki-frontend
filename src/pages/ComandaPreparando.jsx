import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import { toast } from 'sonner';
const API = import.meta.env.VITE_API_URL;
import { imprimirComandaBluetooth } from "../utils/impresionBluetooth";



const ComandaPreparando = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const tipo = new URLSearchParams(location.search).get("tipo"); // 👉 Detectar si es familiar
  const [comanda, setComanda] = useState(null);
  const [mesa, setMesa] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mesasAsociadas, setMesasAsociadas] = useState([]);


  useEffect(() => {
    const fetchMesaYComanda = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        let mesaData;
        if (tipo === "familiar") {
          const resMesaFamiliar = await axios.get(`${API}/mesas-familiares/${id}`, { headers });
          mesaData = resMesaFamiliar.data;
          mesaData.esFamiliar = true;

          // ✅ Guardamos también las mesas asociadas
          if (mesaData.mesas) {
            setMesasAsociadas(mesaData.mesas.map(m => m.id));
          }
        } else {
          const resMesa = await axios.get(`${API}/mesas/${id}`, { headers });
          mesaData = resMesa.data;
        }

        setMesa(mesaData);

        if (mesaData.estado === "Preparando") {
          const urlComanda = tipo === "familiar"
          ? `${API}/comandas/familiar/${mesaData.id}`
          : `${API}/comandas/mesa/${mesaData.id}`;

          const resComanda = await axios.get(urlComanda, { headers });
          setComanda(resComanda.data);
        }
      } catch (error) {
        toast.error("No se pudo cargar la comanda. Intenta de nuevo.");
      }
    };

    fetchMesaYComanda();
  }, [id, tipo]);

  function generarTextoComanda(comanda) {
  let texto = "=== COMANDA ===\n";
  texto += `Mesa: ${comanda.mesa}\n`;
  texto += `Fecha: ${new Date().toLocaleString()}\n\n`;

  comanda.items.forEach(item => {
    texto += `${item.cantidad}x ${item.nombre}\n`;
  });

  texto += "\n=====================\n";
  texto += "WAYKI - Gracias por su pedido\n";
  return texto;
}


  const confirmarEntrega = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (mesa.esFamiliar) {
        // 1. Cambia estado de mesa familiar
        await axios.put(`${API}/mesas-familiares/${mesa.id}`, {
          estado: "Ocupada",
          mesasIds: mesasAsociadas // 🔁 Mantener asociación activa
        }, { headers });
      } else {
        await axios.put(`${API}/mesas/${mesa.id}`, { estado: "Ocupada" }, { headers });
      }
      toast.success("Mesa marcada como Ocupada ✅");
      navigate("/mesas");
    } catch (error) {
      console.error("Error al cambiar estado de la mesa:", error);
      toast.error("No se pudo cambiar el estado de la mesa.");
    }
  };


  return (
    <AnimatedPage>
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 dark:bg-gray-900 px-4 sm:px-6 py-6">
        <motion.h1
          className="text-3xl font-bold text-yellow-800 dark:text-yellow-300 mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          El pedido está en preparación...
        </motion.h1>

        <motion.p
          className="text-gray-700 dark:text-gray-200 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Esta comanda ya fue enviada a cocina. Esperando entrega.
        </motion.p>

        {mesa?.estado === "Preparando" && comanda ? (
          <motion.div
            className="bg-white text-black font-mono p-4 sm:p-6 rounded-lg shadow-md w-full max-w-md border border-gray-400 overflow-x-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center border-b-2 border-dashed border-black pb-3 mb-4">
              <p className="font-bold text-xl tracking-widest">COMANDA</p>
              {mesa.esFamiliar ? (
                <>
                  <p className="text-lg font-semibold text-blue-800">Mesa Familiar</p>
                  <p className="text-sm text-gray-600 mt-1">Mesas que lo conforman:</p>
                  <ul className="text-sm text-gray-800">
                    {mesa.mesas?.map((m) => (
                      <li key={m.id}>Mesa {m.numero}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold">MESA #{comanda.mesaId}</p>
                  <p className="text-xs mt-1">
                    {new Date(comanda.createdAt).toLocaleDateString()} —{" "}
                    {new Date(comanda.createdAt).toLocaleTimeString()}
                  </p>
                </>
              )}
            </div>

            {comanda.items.map((item, index) => (
              <div key={index} className="py-2 border-b border-dotted border-gray-500">
                <div className="flex justify-between items-center">
                  <span className="uppercase font-bold tracking-wide text-md">{item.plato.nombre}</span>
                  <span className="font-bold text-lg">x{item.cantidad}</span>
                </div>
                {item.notas && item.notas.trim() !== '' && (
                  <p className="mt-1 text-sm text-red-600 font-semibold italic">📝 {item.notas}</p>
                )}
              </div>
            ))}

            <div className="mt-6 text-center text-xs tracking-wide text-gray-500">
              <p>---- FIN DE COMANDA ----</p>
            </div>
          </motion.div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Cargando comanda...</p>
        )}

        <motion.button
          onClick={() => setMostrarModal(true)}
          className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition-all w-full sm:w-auto text-center"
          whileTap={{ scale: 0.96 }}
        >
          CONFIRMAR ENTREGA
        </motion.button>
        <Button onClick={() => imprimirComandaBluetooth(generarTextoComanda(comanda))}>
          Imprimir Comanda
        </Button>

        <AnimatePresence>
          {mostrarModal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl px-4 py-6 sm:p-8 w-full max-w-md mx-4 sm:mx-0"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white text-center">
                  ¿Confirmar entrega?
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-center mb-6">
                  Esto cambiará el estado de la mesa a{" "}
                  <span className="font-semibold text-sky-600 dark:text-sky-300">Ocupada</span>.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setMostrarModal(false)}
                    className="w-full sm:w-auto px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarEntrega}
                    className="w-full sm:w-auto px-5 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition"
                  >
                    Confirmar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
};

export default ComandaPreparando;
