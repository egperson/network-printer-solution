import React, { useEffect, useState } from 'react'
import StatsDonut from './StatsDonut'
import ActivityBars from './ActivityBars'
import ConsumptionTrend from './ConsumptionTrend'
import ReliabilityTable from './ReliabilityTable'
import TopIncidents from './TopIncidents'
import CustomCard from './CustomCard'
import CustomSelect from './CustomSelect'

export default function AnalyticsPage({ devices }) {
  const [series, setSeries] = useState(null)
  const [selectedDevice, setSelectedDevice] = useState('all')

  // Calculate high-level metrics
  const totalDevs = devices.length
  const onlineDevs = devices.filter(d => d.status === 'ok').length
  const uptimeRate = totalDevs > 0 ? ((onlineDevs / totalDevs) * 100).toFixed(1) : '0.0'
  const incidents = devices.filter(d => d.status !== 'ok').length

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/history?limit=24')
        const j = await res.json()
        if (j.ok && j.rows) {
          // map rows to lightweight series
          const s = j.rows.map(r => ({ ts: r.ts, data: r.data, device_count: (r.data && r.data.devices) ? r.data.devices.length : 0, ok_count: (r.data && r.data.devices) ? r.data.devices.filter(d => d.status === 'ok').length : 0 }))
          setSeries(s)
        }
      } catch (e) { console.error(e) }
    }
    load()
  }, [])

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <div className="text-sm text-white/60">Visão geral e métricas de desempenho</div>
        </div>
        <div className="w-64">
          <CustomSelect
            value={selectedDevice}
            onChange={setSelectedDevice}
            icon="search"
            options={[
              { value: 'all', label: 'Todos os Dispositivos' },
              ...(devices || []).map(d => ({
                value: d.deviceIp || d.url || d.deviceName || d.name,
                label: d.deviceName || d.name || d.deviceIp || d.url
              }))
            ]}
          />
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CustomCard hover className="flex items-center gap-4 p-5" variant="glass">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xl font-bold">
            <span className="mi">trending_up</span>
          </div>
          <div>
            <div className="text-2xl font-bold">{uptimeRate}%</div>
            <div className="text-sm text-white/60">Taxa de Uptime</div>
          </div>
        </CustomCard>
        <CustomCard hover className="flex items-center gap-4 p-5" variant="glass">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xl font-bold">
            <span className="mi">warning</span>
          </div>
          <div>
            <div className="text-2xl font-bold">{incidents}</div>
            <div className="text-sm text-white/60">Incidentes Ativos</div>
          </div>
        </CustomCard>
        <CustomCard hover className="flex items-center gap-4 p-5" variant="glass">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl font-bold">
            <span className="mi">history</span>
          </div>
          <div>
            <div className="text-2xl font-bold">{series ? series.length : 0}</div>
            <div className="text-sm text-white/60">Snapshots Históricos</div>
          </div>
        </CustomCard>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CustomCard title="Atividade de Rede" subtitle="Status nas últimas 24h" icon="bar_chart" className="h-[400px]">
            <ActivityBars devices={devices} series={series} selectedDevice={selectedDevice === 'all' ? '' : selectedDevice} />
          </CustomCard>
        </div>
        <div>
          <CustomCard title="Consumíveis" subtitle="Estado atual de toner" icon="pie_chart" className="h-[400px]">
            <StatsDonut devices={devices} />
          </CustomCard>
        </div>
      </div>

      {/* Consumption Trend & Top Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CustomCard title="Tendência de Consumo" subtitle="Média de nível de suprimentos da rede" icon="ssid_chart" className="h-[350px]">
            <ConsumptionTrend series={series} />
          </CustomCard>
        </div>
        <div>
          <CustomCard title="Top Incidentes" subtitle="Dispositivos requerendo atenção" icon="priority_high" className="h-[350px] overflow-auto">
            <TopIncidents devices={devices} />
          </CustomCard>
        </div>
      </div>

      {/* Reliability Table */}
      <CustomCard title="Confiabilidade por Dispositivo" subtitle="Ranking baseado no histórico recente" icon="verified">
        <ReliabilityTable devices={devices} series={series} />
      </CustomCard>
    </div>
  )
}
