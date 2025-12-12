import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ActivityBars({ devices, series, selectedDevice }) {
  // if series provided, use it: series = [{ts, device_count, ok_count, error_count}, ...]
  let labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let valid = [0, 0, 0, 0, 0, 0, 0];
  let invalid = [0, 0, 0, 0, 0, 0, 0];
  if (series && series.length) {
    // map series (latest first) to labels — use dates as labels
    const rev = series.slice().reverse();
    labels = rev.map((r) => new Date(r.ts).toLocaleString());
    if (selectedDevice) {
      // show per-device status over time (1 = ok, 0 = error/missing)
      const dataSeries = rev.map((r) => {
        try {
          const devs = (r.data && r.data.devices) || [];
          const match = devs.find(
            (d) =>
              (d.deviceIp || d.url || d.deviceName || d.name) === selectedDevice
          );
          if (!match) return 0;
          return match.status === "ok" ? 1 : 0;
        } catch (e) {
          return 0;
        }
      });
      valid = dataSeries;
      invalid = new Array(dataSeries.length).fill(0);
    } else {
      valid = rev.map((r) =>
        r.ok_count !== undefined
          ? r.ok_count
          : r.data && r.data.devices
            ? r.data.devices.filter((d) => d.status === "ok").length
            : 0
      );
      invalid = rev.map((r) =>
        r.error_count !== undefined
          ? r.error_count
          : r.data && r.data.devices
            ? r.data.devices.length -
            r.data.devices.filter((d) => d.status === "ok").length
            : 0
      );
    }
  } else {
    // fake weekly distribution by status for demo
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    valid = labels.map((l, i) =>
      Math.max(
        0,
        Math.round((devices || []).length * (0.6 + 0.06 * Math.sin(i + 1)))
      )
    );
    invalid = labels.map((l, i) =>
      Math.max(
        0,
        Math.round((devices || []).length * (0.2 + 0.04 * Math.cos(i + 2)))
      )
    );
  }

  const data = {
    labels,
    datasets: selectedDevice
      ? [{
        label: "Status (1=OK)",
        data: valid,
        backgroundColor: "#22d3ee", // cyan-400
        borderRadius: 4,
        hoverBackgroundColor: "#67e8f9"
      }]
      : [
        {
          label: "Válidos",
          data: valid,
          backgroundColor: "#22d3ee", // cyan-400
          borderRadius: 4,
          hoverBackgroundColor: "#67e8f9"
        },
        {
          label: "Inválidos",
          data: invalid,
          backgroundColor: "#f472b6", // pink-400
          borderRadius: 4,
          hoverBackgroundColor: "#f472b6"
        },
      ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.5)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.5)' }
      }
    }
  };
  return (
    <div className="w-full h-[300px]">
      <Bar data={data} options={options} />
    </div>
  );
}
