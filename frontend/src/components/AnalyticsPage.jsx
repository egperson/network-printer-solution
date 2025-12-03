import React, { useEffect, useState } from 'react'
import StatsDonut from './StatsDonut'
import ActivityBars from './ActivityBars'

export default function AnalyticsPage({devices}){
  const [series, setSeries] = useState(null)
  const [selectedDevice, setSelectedDevice] = useState('')

  useEffect(()=>{
    async function load(){
      try{
        const res = await fetch('/api/history?limit=12')
        const j = await res.json()
        if(j.ok && j.rows) {
          // map rows to lightweight series
          const s = j.rows.map(r=>({ ts: r.ts, data: r.data, device_count: (r.data && r.data.devices) ? r.data.devices.length : 0, ok_count: (r.data && r.data.devices) ? r.data.devices.filter(d=>d.status==='ok').length : 0 }))
          setSeries(s)
        }
      }catch(e){ console.error(e) }
    }
    load()
  },[])

  return (
    <div>
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Analytics</h2>
          <div className="text-sm text-white/60">Visão geral e métricas</div>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-2 py-1 bg-transparent border border-white/6 rounded" value={selectedDevice} onChange={e=>setSelectedDevice(e.target.value)}>
            <option value="">Todos os dispositivos</option>
            {(devices||[]).map((d,i)=> <option key={i} value={(d.deviceIp||d.url||d.deviceName||d.name)}>{d.deviceName||d.name||d.deviceIp||d.url}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActivityBars devices={devices} series={series} selectedDevice={selectedDevice} />
        </div>
        <div>
          <StatsDonut devices={devices} />
        </div>
      </div>
    </div>
  )
}
