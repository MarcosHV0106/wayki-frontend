// src/pages/GestionPlatos.jsx
import { useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import { toast } from "sonner";
const API = import.meta.env.VITE_API_URL;



const GestionPlatos = () => {
  const [platos, setPlatos] = useState([]);
  const [modal, setModal] = useState(null);
  const [platoActual, setPlatoActual] = useState(null);
  const [form, setForm] = useState({ nombre: "", categoria: "", precio: "" });

  const token = localStorage.getItem("token");

  const categorias = [
    "Entrada",
    "Segundo",
    "Ejecutivo",
    "Caldos",
    "Platos a la Carta",
    "Platos Marinos",
    "Bebida",
  ];

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(categorias[0]);


  const platosProtegidos = [
    "Seco de Res con Frejoles",
    "Tallarín Verde con Milanesa/Pechuga",
    "Pollada con PS/PF",
    "Patita con Maní",
    "Cau-Cau Montado",
    "Olluco Montado",
    "Doncella Dorada con Frejoles",
    "Milanesa de Pollo con Papas Fritas",
  ];

  const fetchPlatos = async () => {
    try {
      const res = await fetch(`${API}/platos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPlatos(data);
    } catch (error) {
      console.error("❌ Error al cargar platos:", error);
      toast.error("No se pudieron cargar los platos.");
    }
  };

  useEffect(() => {
    fetchPlatos();
  }, []);

  const abrirModal = (tipo, plato = null) => {
      setModal(tipo);
      setPlatoActual(plato);
      setForm(
        tipo === "agregar"
          ? { nombre: "", categoria: plato?.categoria || "", precio: "14.00" } // <-- CAMBIO AQUÍ
          : {
              ...plato,
              precio: platosProtegidos.includes(plato.nombre)
                ? "14.00"
                : plato.precio,
            }
      );
    };

  const cerrarModal = () => {
    setModal(null);
    setForm({ nombre: "", categoria: "", precio: "" });
    setPlatoActual(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") cerrarModal();
    };
    if (modal) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal]);

  const handleSubmit = async () => {
    try {
      const method = modal === "editar" ? "PUT" : "POST";
      const url =
        modal === "editar"
          ? `${API}/platos/${platoActual.id}`
          : `${API}/platos`;


      const nombreProtegido = platosProtegidos.includes(form.nombre);
      const precioFinal = nombreProtegido ? 14.0 : parseFloat(form.precio);

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: form.nombre,
          categoria: form.categoria,
          precio: precioFinal,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar plato");
      await fetchPlatos();
      cerrarModal();
      toast.success(modal === "editar" ? "Plato actualizado." : "Plato agregado.");
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      toast.error("Error al guardar el plato.");
    }
  };

  const handleEliminar = async () => {
    if (platosProtegidos.includes(platoActual.nombre)) {
      toast.warning("Este plato no se puede eliminar.");
      return;
    }

    try {
      const res = await fetch(`${API}/platos/${platoActual.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Error al eliminar plato");
      await fetchPlatos();
      cerrarModal();
      toast.success("Plato eliminado correctamente.");
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
      toast.error("Error al eliminar el plato.");
    }
  };

  const platosPorCategoria = (categoria) => {
    const filtrados = platos.filter((plato) => plato.categoria === categoria);

    if (categoria === "Segundo") {
      const normales = filtrados.filter(
        (plato) => !platosProtegidos.includes(plato.nombre)
      );
      const protegidos = filtrados
        .filter((plato) => platosProtegidos.includes(plato.nombre))
        .sort((a, b) =>
          platosProtegidos.indexOf(a.nombre) -
          platosProtegidos.indexOf(b.nombre)
        );
      return [...normales, ...protegidos];
    }

    return filtrados;
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
        <h1 className="text-3xl font-bold mb-6 text-sky-800 dark:text-sky-300">
          Gestión de Platos
        </h1>

                {/* Filtro por categoría */}
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Seleccionar Categoría
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


        {[categoriaSeleccionada].map((categoria) => (
          <div
            key={categoria}
            className="mb-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {categoria}
              </h2>
              <button
                onClick={() => abrirModal("agregar", { categoria })}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                <PlusCircle size={18} />
                Agregar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-5">
              <AnimatePresence>
                {platosPorCategoria(categoria).map((plato) => (
                  <motion.div
                    key={plato.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow flex justify-between items-center"
                  >
                    <div>
                      <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                        {plato.nombre}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        S/ {Number(plato.precio).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirModal("editar", plato)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={18} />
                      </button>
                      {!platosProtegidos.includes(plato.nombre) && (
                        <button
                          onClick={() => abrirModal("eliminar", plato)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {/* 🟡 MODAL */}
        <AnimatePresence>
          {modal && (
            <motion.div
              className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl w-full max-w-sm sm:max-w-md shadow-xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {modal === "agregar"
                      ? "Agregar Plato"
                      : modal === "editar"
                      ? "Editar Plato"
                      : "Eliminar Plato"}
                  </h2>
                  <button
                    onClick={cerrarModal}
                    className="text-gray-500 hover:text-gray-800"
                  >
                    <X size={22} />
                  </button>
                </div>

                {(modal === "agregar" || modal === "editar") && (
                  <div className="space-y-4">
                    <input
                      autoFocus
                      className="w-full px-3 py-2 text-sm sm:text-base rounded border border-gray-300 dark:bg-gray-700 dark:text-white"
                      placeholder="Nombre del plato"
                      value={form.nombre}
                      onChange={(e) =>
                        setForm({ ...form, nombre: e.target.value })
                      }
                    />
                    <input
                      className="w-full px-3 py-2 text-sm sm:text-base rounded border border-gray-300 dark:bg-gray-700 dark:text-white"
                      placeholder="Precio"
                      type="number"
                      value={
                        platosProtegidos.includes(form.nombre)
                          ? "14.00"
                          : form.precio
                      }
                      onChange={(e) =>
                        setForm({ ...form, precio: e.target.value })
                      }
                        disabled={modal === "agregar" || platosProtegidos.includes(form.nombre)} // <-- CAMBIO AQUÍ
                    />
                    <select
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:bg-gray-700 dark:text-white appearance-none" // <-- CAMBIO AQUÍ
                      value={form.categoria}
                      onChange={(e) =>
                        setForm({ ...form, categoria: e.target.value })
                      }
                      disabled={modal === "agregar"}
                    >
                      {categorias.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSubmit}
                      className="w-full bg-blue-600 text-white py-2 text-sm sm:text-base rounded hover:bg-blue-700 transition"
                    >
                      {modal === "editar" ? "Guardar Cambios" : "Agregar Plato"}
                    </button>
                  </div>
                )}

                {modal === "eliminar" && (
                  <div>
                    <p className="mb-4">
                      ¿Estás seguro de eliminar el plato{" "}
                      <strong>{platoActual?.nombre}</strong>?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <button
                        onClick={handleEliminar}
                        className="flex-1 bg-red-600 text-white py-2 text-sm sm:text-base rounded hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={cerrarModal}
                        className="flex-1 bg-gray-300 dark:bg-gray-700 text-black dark:text-white py-2 rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
};

export default GestionPlatos;
