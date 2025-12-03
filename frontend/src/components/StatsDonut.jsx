import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend)

export default function StatsDonut({devices}){
  const low = devices.reduce((acc,d)=> acc + ((d.supplies||[]).some(s=>{ const m=(s.level||'').match(/(\d{1,3})/); return m ? Number(m[1])<15 : false })) , 0)
  const ok = devices.length - low
  const data = {
    labels: ['OK','Baixo'],
    datasets: [{data:[ok, low], backgroundColor:['#e5e7eb','#9ca3af'], hoverOffset:8}]
  }
  return (
    <div className="card">
      <h4 className="text-sm font-semibold mb-2">Consumíveis — Estado</h4>
      <div className="flex items-center gap-4">
        <div style={{width:120}}>
          <Doughnut data={data} />
        </div>
        <div>
          <div className="text-sm text-white/90">Total: <b>{devices.length}</b></div>
          <div className="text-sm text-white/70">OK: {ok}</div>
          <div className="text-sm text-white/70">Baixo: {low}</div>
        </div>
      </div>
    </div>
  )
}
