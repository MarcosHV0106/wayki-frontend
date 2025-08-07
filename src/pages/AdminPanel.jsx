// src/pages/AdminPanel.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AreaChartVentas from "../components/AreaChartVentas";
import AnimatedPage from "../components/AnimatedPage";
import { motion } from "framer-motion";
import { BarChart4, LayoutDashboard, Pencil } from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "sonner";
const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;



const AdminPanel = () => {
  const navigate = useNavigate();
  const [ventasTotales, setVentasTotales] = useState(0);
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [ventasHoy, setVentasHoy] = useState(0);



  // ✅ 1. Verificar si es admin
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("usuario"));
    if (!storedUser || storedUser.email !== "admin@wayki.com") {
      navigate("/mesas");
    }
  }, [navigate]);

// ✅ 2. Leer datos reales desde el backend al cargar
  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const token = localStorage.getItem("token"); // si usas JWT
        const res = await fetch(`${API_URL}/ventas`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const ventas = await res.json();

        if (!Array.isArray(ventas)) {
          throw new Error("Respuesta inválida del backend");
        }

        let total = 0;
        const agrupado = {};

        ventas.forEach((venta) => {
          const fecha = new Date(venta.fecha);
          const dia = fecha
            .toLocaleDateString("es-PE", {
              timeZone: "America/Lima",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            .split("/")
            .reverse()
            .join("-");

          agrupado[dia] = (agrupado[dia] || 0) + venta.monto;
          total += venta.monto;
        });

        const porDia = Object.entries(agrupado)
          .map(([dia, monto]) => ({ dia, monto }))
          .sort((a, b) => new Date(a.dia) - new Date(b.dia));

        setVentasTotales(total);
        setVentasPorDia(porDia);
      } catch (error) {
        console.error("❌ Error al cargar ventas:", error);
        toast.error("Error al cargar datos de ventas.");
      }
    };

    fetchVentas();
  }, []);


  // ✅ 3. Escuchar WebSocket
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("admin-nueva-venta", (venta) => {
      console.log("📦 Venta recibida:", venta);
      toast.success(`Nueva venta: S/${venta.monto.toFixed(2)}`);
      handleNuevaVenta(venta);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
  const fetchVentasDelDia = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/ventas/hoy`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (typeof data.total === "number") {
        setVentasHoy(data.total);
      }
    } catch (error) {
      console.error("❌ Error al cargar ventas del día:", error);
      toast.error("No se pudieron obtener las ventas de hoy.");
    }
  };

  fetchVentasDelDia();
}, []);


// ✅ 4. Lógica para nueva venta
const handleNuevaVenta = (venta) => {
  const fecha = new Date(venta.fecha);

  // Asegurar formato de fecha en hora local (Perú)
  const offsetMs = fecha.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(fecha.getTime() - offsetMs);

    // ✅ Obtener fecha en formato local de Perú: YYYY-MM-DD
  const dia = fecha.toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  .split("/")
  .reverse()
  .join("-");

    // ✅ Obtener la fecha de HOY en el mismo formato para comparar
  const hoy = new Date().toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  .split("/")
  .reverse()
  .join("-");

  // ✅ Si la venta es de hoy, actualizar el contador de ventas de hoy
  if (dia === hoy) {
    setVentasHoy((prev) => prev + venta.monto);
  }

    // ✅ Total acumulado
    setVentasTotales((prev) => {
      const nuevo = prev + venta.monto;
      return nuevo;
    });

    // ✅ Agrupar por día ÚNICO sin duplicar
    setVentasPorDia((prev) => {
      const agrupado = {};

    // Agrega los previos
    prev.forEach(({ dia, monto }) => {
      agrupado[dia] = (agrupado[dia] || 0) + monto;
    });

    // Agrega la nueva venta
    agrupado[dia] = (agrupado[dia] || 0) + venta.monto;

    // Convertir a arreglo ordenado por fecha
    const resultado = Object.entries(agrupado)
      .map(([dia, monto]) => ({ dia, monto }))
      .sort((a, b) => new Date(a.dia) - new Date(b.dia));

    return resultado;
  });
};



  return (
  <AnimatedPage>
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-sky-100 to-white dark:from-gray-900 dark:to-black transition-all duration-500">
      {/* BARRA LATERAL */}
      <div className="w-full lg:w-64 bg-gradient-to-b from-blue-900 to-blue-700 text-white p-6 flex flex-col justify-between shadow-xl">
        <div>
          <h2 className="text-3xl font-bold mb-8 tracking-wide drop-shadow-md">Wayki Admin</h2>
          <nav className="space-y-4">
            <button
              onClick={() => navigate('/mesas')} // <-- CAMBIO AQUÍ
              className="flex items-center gap-3 px-4 py-3 w-full bg-white/10 hover:bg-white/20 rounded-md transition text-sm sm:text-base"
            >
              <LayoutDashboard size={20} />
              Ir a Mesas
            </button>
            <div className="border-t border-white/30 my-4" />
            <button
              onClick={() => navigate("/admin/gestion-platos")}
              className="flex items-center gap-3 px-4 py-3 w-full bg-white/10 hover:bg-white/20 rounded-md transition text-sm sm:text-base"
            >
              <Pencil size={20} />
              Gestionar Platos
            </button>
          </nav>
        </div>
        <p className="text-xs text-white/60 mt-6 italic">Versión 1.0 • WAYKI</p>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 p-4 sm:p-6 lg:p-10 overflow-auto">
        <motion.h1
          className="text-3xl sm:text-5xl font-bold text-sky-800 dark:text-sky-300 mb-6 sm:mb-10 tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Panel de Administración
        </motion.h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900 dark:to-green-800 p-6 rounded-2xl shadow-lg border dark:border-green-700">
            <h2 className="text-gray-600 dark:text-gray-300 text-sm uppercase mb-2">Total Ventas</h2>
            <p className="text-4xl font-bold text-green-700 dark:text-green-300 drop-shadow">
              S/{ventasTotales.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 p-6 rounded-2xl shadow-lg border dark:border-blue-700">
            <h2 className="text-gray-600 dark:text-gray-300 text-sm uppercase mb-2">Ventas de Hoy</h2>
            <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 drop-shadow">
              S/{ventasHoy.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-sky-700 dark:text-sky-300 mb-6 flex items-center gap-2">
            <BarChart4 size={22} />
            Evolución de las ventas
          </h2>
          <AreaChartVentas data={ventasPorDia} />
        </div>
      </div>
    </div>
  </AnimatedPage>
  );
};

export default AdminPanel;
