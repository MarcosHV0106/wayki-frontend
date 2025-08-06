import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend
);

const AreaChartVentas = ({ data }) => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = hoy.getMonth(); // 0-indexed
  const diasDelMes = new Date(year, month + 1, 0).getDate();

  // Generar lista completa de fechas del mes actual HASTA HOY
  const fechasCompletas = Array.from({ length: hoy.getDate() }, (_, i) => {
    const dia = String(i + 1).padStart(2, "0");
    const mes = String(month + 1).padStart(2, "0");
    return `${year}-${mes}-${dia}`;
  });


  // Rellenar con monto 0 si no hay ventas ese día
  const dataCompleta = fechasCompletas.map((fecha) => {
    const venta = data.find((v) => v.dia === fecha);
    return {
      dia: fecha,
      monto: venta ? venta.monto : 0,
    };
  });

  const dias = dataCompleta.map((v) => {
    const [año, mes, dia] = v.dia.split("-");
    return `${dia}/${mes}/${año}`; // ✅ Sale "30/07/2025"
  });

  const montos = dataCompleta.map((v) => v.monto);

  const chartData = {
    labels: dias,
    datasets: [
      {
        label: "Ventas por Día",
        data: montos,
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "#3b82f6",
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const label = tooltipItems[0].label; // "30/07/2025"
            return `Fecha: ${label}`;
          },
          label: (context) => `Monto: S/ ${context.raw.toFixed(2)}`,
        },
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `S/ ${value}`,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default AreaChartVentas;
