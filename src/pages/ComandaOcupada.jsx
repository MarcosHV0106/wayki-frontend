import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import { io } from "socket.io-client";
import { toast } from "sonner";
const API = import.meta.env.VITE_API_URL;



const socket = io(import.meta.env.VITE_SOCKET_URL);

const ComandaOcupada = () => {
  const { idMesa } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const tipo = new URLSearchParams(search).get("tipo");
  const esFamiliar = tipo === "familiar";

  const [comanda, setComanda] = useState(null);
  const [mesa, setMesa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const obtenerComandaYmesa = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const url = esFamiliar
          ? `${API}/comandas/familiar/${idMesa}`
          : `${API}/comandas/mesa/${idMesa}`;

        const { data: comandaData } = await axios.get(url, { headers });
        setComanda(comandaData);

        const mesaUrl = esFamiliar
          ? `${API}/mesas-familiares/${idMesa}`
          : `${API}/mesas/${idMesa}`;

        const { data: mesaData } = await axios.get(mesaUrl, { headers });
        setMesa(mesaData);
      } catch (error) {
        console.error("Error al obtener comanda o mesa:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerComandaYmesa();
  }, [idMesa, tipo]);

const confirmarPago = async () => {
  const toastId = toast.loading("Procesando pago..."); // ✅ Guardamos el ID
  try {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // 🖨️ Imprimir boleta
    await axios.post(`${API}/boleta/${comanda.id}`, null, { headers });


    // 📢 Emitir evento para estadísticas
    socket.emit("venta-confirmada", {
      monto: total,
      fecha: new Date(),
      platos: comanda.items.map(i => ({
        nombre: i.plato?.nombre,
        categoria: i.plato?.categoria,
        cantidad: i.cantidad
      }))
    });

    // 🔁 Liberar mesas
    if (esFamiliar) {
      await Promise.all(
        mesa.mesas.map((m) =>
          axios.put(`${API}/mesas/${m.id}`, { estado: "Disponible" }, { headers })
        )
      );
      await axios.delete(`${API}/mesas-familiares/${idMesa}`, { headers });
    } else {
      await axios.put(`${API}/mesas/${idMesa}`, { estado: "Disponible" }, { headers });
    }

    // ❌ Eliminar comanda
    await axios.delete(`${API}/comandas/${comanda.id}`, { headers });

    toast.dismiss(toastId); // ✅ Cerramos el toast de carga
    toast.success("Pago confirmado. Mesa liberada.");
    // ✅ Redirigir
    navigate("/mesas");

  } catch (error) {
    console.error("Error al confirmar pago:", error);
    toast.dismiss(toastId); // ✅ Cerramos el toast de carga
    toast.error("No se pudo confirmar el pago.");
  }
};



  if (loading) {
    return <p className="text-center mt-10 text-gray-700 dark:text-white">Cargando comanda...</p>;
  }

  if (!comanda) {
    return <p className="text-center mt-10 text-red-600">No se encontró comanda.</p>;
  }

  // ✅ LÓGICA DE MENÚ CORREGIDA
// ✅ LÓGICA DE MENÚ CLÁSICO Y EJECUTIVO
const unidades = [];
comanda.items.forEach(item => {
  for (let i = 0; i < item.cantidad; i++) {
    unidades.push({ ...item, uniqueId: `${item.id}-${i}` });
  }
});

const entradas = unidades.filter(item => item.plato?.categoria === "Entrada");
const segundos = unidades.filter(item => item.plato?.categoria === "Segundo");
const ejecutivos = unidades.filter(item => item.plato?.categoria === "Ejecutivo");

let entradasUsadas = 0;
let segundosUsados = 0;
let ejecutivosUsados = 0;

const menus = [];

// Primero formar Menú Ejecutivo (Entrada + Ejecutivo) → S/18
const countMenuEjecutivo = Math.min(entradas.length, ejecutivos.length);
if (countMenuEjecutivo > 0) {
  menus.push({
    nombre: "Menú Ejecutivo",
    cantidad: countMenuEjecutivo,
    precio: 18,
    subtotal: countMenuEjecutivo * 18,
  });
  entradasUsadas += countMenuEjecutivo;
  ejecutivosUsados += countMenuEjecutivo;
}

// Luego formar Menú Clásico (Entrada + Segundo) → S/14
const entradasDisponiblesParaClasico = entradas.length - entradasUsadas;
const countMenuClasico = Math.min(entradasDisponiblesParaClasico, segundos.length);
if (countMenuClasico > 0) {
  menus.push({
    nombre: "Menú Clásico",
    cantidad: countMenuClasico,
    precio: 14,
    subtotal: countMenuClasico * 14,
  });
  entradasUsadas += countMenuClasico;
  segundosUsados += countMenuClasico;
}

// Filtrar ítems no usados
const itemsRestantes = unidades.filter(item => {
  if (item.plato?.categoria === "Entrada" && entradasUsadas > 0) {
    entradasUsadas--;
    return false;
  }
  if (item.plato?.categoria === "Segundo" && segundosUsados > 0) {
    segundosUsados--;
    return false;
  }
  if (item.plato?.categoria === "Ejecutivo" && ejecutivosUsados > 0) {
    ejecutivosUsados--;
    return false;
  }
  return true;
});

// Agrupar por platoId
const agrupados = {};
itemsRestantes.forEach(item => {
  const id = item.platoId;
  const precio = parseFloat(item.plato?.precio) || 0;
  if (!agrupados[id]) {
    agrupados[id] = {
      nombre: item.plato?.nombre,
      cantidad: 1,
      precio,
      subtotal: precio,
    };
  } else {
    agrupados[id].cantidad += 1;
    agrupados[id].subtotal += precio;
  }
});

const itemsFinal = Object.values(agrupados);

// Calcular total
const total = menus.reduce((acc, m) => acc + m.subtotal, 0) +
               itemsFinal.reduce((acc, i) => acc + i.subtotal, 0);



  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-tr from-white to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4 sm:px-8 py-6">
        <motion.h1
          className="text-3xl font-extrabold mb-6 text-center text-sky-700 dark:text-sky-300 drop-shadow"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Comanda {esFamiliar ? 'Familiar' : `de Mesa #${idMesa}`}
        </motion.h1>

        <motion.div
          className="bg-white text-black font-mono p-4 sm:p-8 rounded-lg shadow-lg w-full max-w-md mx-auto border border-gray-400 dark:border-gray-600 overflow-x-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center border-b border-gray-500 dark:border-gray-400 pb-4 mb-4">
            <h2 className="text-2xl font-bold tracking-wide uppercase">Restaurante Wayki</h2>
            <p className="text-sm mt-1">RUC: 12345678901</p>
            <p className="text-sm">Jr. Camaná 791</p>
            <p className="text-sm">Tel: (01) 123-4567</p>
          </div>

          <div className="mb-2 text-sm text-center">
            <p><strong>Comanda:</strong> #{comanda.id}</p>
            {esFamiliar && mesa?.mesas?.length > 0 ? (
              <>
                <p className="mt-1 text-blue-800 font-semibold">Mesa Familiar</p>
                <p className="text-xs text-gray-600">Mesas asociadas:</p>
                <p>{mesa.mesas.map(m => `#${m.numero}`).join(', ')}</p>
              </>
            ) : (
              <p><strong>Mesa:</strong> #{comanda.mesaId}</p>
            )}
            <p className="mt-2">
              <strong>Fecha:</strong> {new Date(comanda.createdAt).toLocaleDateString()}<br />
              <strong>Hora:</strong> {new Date(comanda.createdAt).toLocaleTimeString()}
            </p>
          </div>

          <table className="w-full text-sm border-t border-b border-black my-4">
            <thead>
              <tr className="text-left border-b border-black">
                <th className="py-1">Plato</th>
                <th className="py-1 text-center">Cant</th>
                <th className="py-1 text-right">P/U</th>
                <th className="py-1 text-right">Subt</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu, idx) => (
                <tr key={`menu-${idx}`} className="border-b border-dashed border-gray-300">
                  <td className="py-1">{menu.nombre}</td>
                  <td className="py-1 text-center">{menu.cantidad}</td>
                  <td className="py-1 text-right">S/ {menu.precio.toFixed(2)}</td>
                  <td className="py-1 text-right">S/ {menu.subtotal.toFixed(2)}</td>
                </tr>
              ))}
              {itemsFinal.map((item, idx) => (
                <tr key={`item-${idx}`} className="border-b border-dashed border-gray-300">
                  <td className="py-1">{item.nombre}</td>
                  <td className="py-1 text-center">{item.cantidad}</td>
                  <td className="py-1 text-right">S/ {item.precio.toFixed(2)}</td>
                  <td className="py-1 text-right">S/ {item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
            <span>Total a pagar:</span>
            <span className="text-black dark:text-black">S/ {total.toFixed(2)}</span>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">Gracias por su preferencia</p>
        </motion.div>

        <motion.button
          onClick={() => setMostrarModal(true)}
          className="w-full sm:w-64 mx-auto bg-green-600 hover:bg-green-700 text-white py-3 mt-6 rounded-lg text-lg font-semibold shadow block"
          whileTap={{ scale: 0.96 }}
        >
          Confirmar Pago
        </motion.button>

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
                  ¿Desea confirmar el pago?
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-center mb-6">
                  Esto liberará la {esFamiliar ? "mesa familiar" : `mesa #${idMesa}`} y eliminará su comanda.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setMostrarModal(false)}
                    className="w-full sm:w-auto px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarPago}
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

export default ComandaOcupada;