import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend)

export default function StatsDonut({ devices }) {
  const low = devices.reduce((acc, d) => acc + ((d.supplies || []).some(s => { const m = (s.level || '').match(/(\d{1,3})/); return m ? Number(m[1]) < 15 : false })), 0)
  const ok = devices.length - low
  const data = {
    labels: ['OK', 'Baixo'],
    datasets: [{
      data: [ok, low],
      backgroundColor: ['#22c55e', '#ef4444'], // green-500, red-500
      borderColor: ['rgba(34, 197, 94, 0.2)', 'rgba(239, 68, 68, 0.2)'],
      borderWidth: 2,
      hoverOffset: 8
    }]
  }
  return (
    <div className="h-full flex items-center justify-around min-h-[200px]">
      <div className="relative w-40 h-40 shrink-0">
        <Doughnut data={data} options={{ cutout: '70%', plugins: { legend: { display: false } } }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-xs text-white/40">Total</div>
            <div className="text-2xl font-bold">{devices.length}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <div>
            <div className="text-sm text-white/60">Normais</div>
            <div className="text-xl font-bold">{ok}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
          <div>
            <div className="text-sm text-white/60">Críticos</div>
            <div className="text-xl font-bold">{low}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
