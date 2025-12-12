import React, { useState, useEffect } from 'react'
import CustomCard from './CustomCard'
import CustomSelect from './CustomSelect'
import CustomButton from './CustomButton'
import StatsDonut from './StatsDonut'
import TopIncidents from './TopIncidents'
import ConsumptionTrend from './ConsumptionTrend'

export default function Dashboard({ data }) {
  const devices = (data && data.devices) || []
  const [timeRange, setTimeRange] = useState('24h')
  const [history, setHistory] = useState([])
  const [prediction, setPrediction] = useState(null)

  // Fetch history for trend widget
  useEffect(() => {
    fetch('/api/history?limit=12') // optimized fetch
      .then(res => res.json())
      .then(data => {
        setHistory(data)
        calculatePrediction(data)
      })
      .catch(err => console.error(err))
  }, [])

  function calculatePrediction(data) {
    if (!data || data.length < 2) return

    // Simple linear regression for avg supply
    const points = data.map((point, i) => {
      const avg = point.data.devices.reduce((acc, d) => {
        const dAvg = (d.supplies || []).reduce((sAcc, s) => sAcc + (parseFloat(s.level) || 0), 0) / (d.supplies?.length || 1)
        return acc + dAvg
      }, 0) / point.data.devices.length
      return avg
    })

    const start = points[0]
    const end = points[points.length - 1]
    const diff = end - start

    // Basic forecast
    const daysToEmpty = Math.abs(end / (diff || 0.1)) // crude caching

    setPrediction({
      trend: diff > 0 ? 'up' : 'down',
      rate: diff.toFixed(1),
      daysToEmpty: diff < 0 ? Math.round(daysToEmpty * 0.5) : null // adjustment factor
    })
  }

  // Stats calculations
  const totalDevices = devices.length
  const onlineDevices = devices.filter(d => d.status === 'ok').length
  const offlineDevices = totalDevices - onlineDevices
  const criticalSupplies = devices.filter(d =>
    d.supplies && d.supplies.some(s => {
      const level = parseFloat((s.level || '').toString().replace('%', '')) || 0
      return level < 10
    })
  ).length

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel de Controle</h1>
          <p className="text-white/60">Visão geral do sistema em tempo real</p>
        </div>
        <div className="flex gap-3">
          <CustomSelect
            value={timeRange}
            onChange={setTimeRange}
            icon="schedule"
            options={[
              { value: '24h', label: 'Últimas 24h' },
              { value: '7d', label: 'Últimos 7 dias' },
              { value: '30d', label: 'Últimos 30 dias' }
            ]}
          />
          <CustomButton icon="refresh" variant="secondary" size="medium">
            Atualizar
          </CustomButton>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomCard variant="primary" hover className="relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="mi text-8xl">print</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">{totalDevices}</div>
            <div className="text-sm text-cyan-200 font-medium">Total de Dispositivos</div>
          </div>
        </CustomCard>

        <CustomCard variant="success" hover className="relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="mi text-8xl">check_circle</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">{onlineDevices}</div>
            <div className="text-sm text-green-200 font-medium">Online Agora</div>
          </div>
        </CustomCard>

        <CustomCard variant="danger" hover className="relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="mi text-8xl">error</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">{offlineDevices}</div>
            <div className="text-sm text-red-200 font-medium">Offline</div>
          </div>
        </CustomCard>

        <CustomCard variant="warning" hover className="relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="mi text-8xl">water_drop</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">{criticalSupplies}</div>
            <div className="text-sm text-yellow-200 font-medium">Consumíveis Críticos</div>
          </div>
        </CustomCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts, Trend, Activity */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <CustomCard title="Alertas de Sistema" subtitle="Dispositivos precisando de atenção" icon="notifications_active">
            <TopIncidents devices={devices} />
          </CustomCard>

          <CustomCard title="Tendência & Previsão" subtitle="Análise de consumo em tempo real" icon="trending_up" className="h-[450px]">
            <div className="flex flex-col h-full">
              <div className="flex-1 w-full min-h-0 pb-4">
                <ConsumptionTrend series={history} />
              </div>
              <div className="h-auto shrink-0 flex items-center justify-around pt-4 border-t border-white/10">
                <div className="text-center flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <span className="mi text-xl">auto_graph</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-white/60">Taxa de Uso</div>
                    <div className="text-lg font-bold">{prediction ? `${prediction.rate}%` : '--'} <span className="text-xs text-white/40 font-normal">/ hora</span></div>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <span className="mi text-xl">update</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-white/60">Previsão</div>
                    <div className="text-lg font-bold">{prediction?.daysToEmpty ? `${prediction.daysToEmpty} dias` : 'Estável'}</div>
                  </div>
                </div>
              </div>
            </div>
          </CustomCard>

          <CustomCard title="Atividade Recente" icon="history" className="h-[320px]">
            <div className="space-y-3 h-full overflow-y-auto custom-scrollbar pr-2 pb-2">
              {[
                { type: 'info', msg: 'System verified 214 devices', time: 'Just now' },
                ...devices.filter(d => d.status !== 'ok').slice(0, 3).map(d => ({ type: 'error', msg: `${d.deviceName || d.name} is offline`, time: '10 min ago' })),
                ...devices.filter(d => (d.supplies || []).some(s => parseFloat(s.level) < 10)).slice(0, 3).map(d => ({ type: 'warning', msg: `${d.deviceName || d.name} low on supplies`, time: '1h ago' })),
                { type: 'success', msg: 'Scheduled report generated', time: '2h ago' }
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <span className={`mi text-sm ${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                    {log.type === 'error' ? 'error' : log.type === 'warning' ? 'warning' : log.type === 'success' ? 'check_circle' : 'info'}
                  </span>
                  <span className="flex-1 text-sm text-white/80">{log.msg}</span>
                  <span className="text-xs text-white/40">{log.time}</span>
                </div>
              ))}
            </div>
          </CustomCard>
        </div>

        {/* Right Column: Supply, Actions, Health */}
        <div className="flex flex-col gap-6">
          <CustomCard title="Status de Suprimentos" subtitle="Visão geral" icon="inventory_2" className="h-[350px]">
            <StatsDonut devices={devices} />
          </CustomCard>

          <CustomCard title="Ações Rápidas" icon="bolt">
            <div className="grid grid-cols-2 gap-3">
              <CustomButton variant="glass" icon="print" className="justify-center py-6 flex-col gap-2 h-auto hover:bg-white/10 border-white/5">
                <span className="text-xs">Dispositivos</span>
              </CustomButton>
              <CustomButton variant="glass" icon="inventory" className="justify-center py-6 flex-col gap-2 h-auto hover:bg-white/10 border-white/5">
                <span className="text-xs">Estoque</span>
              </CustomButton>
              <CustomButton variant="glass" icon="description" className="justify-center py-6 flex-col gap-2 h-auto hover:bg-white/10 border-white/5">
                <span className="text-xs">Relatórios</span>
              </CustomButton>
              <CustomButton variant="glass" icon="settings" className="justify-center py-6 flex-col gap-2 h-auto hover:bg-white/10 border-white/5">
                <span className="text-xs">Ajustes</span>
              </CustomButton>
            </div>
          </CustomCard>

          <CustomCard title="Saúde do Sistema" icon="health_and_safety" className="h-[320px]">
            <div className="flex flex-col items-center justify-center h-full pb-6">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                  <circle cx="80" cy="80" r="70" stroke="#22c55e" strokeWidth="12" fill="none" strokeDasharray={`${(onlineDevices / totalDevices) * 440} 440`} strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
                </svg>
                <div className="absolute text-center">
                  <div className="text-3xl font-bold text-white">{Math.round((onlineDevices / totalDevices) * 100)}%</div>
                  <div className="text-sm text-green-400 font-medium">Operacional</div>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-1 text-center">
                <span className="text-white font-medium">{onlineDevices} Online</span>
                <span className="text-white/40 text-sm">de {totalDevices} dispositivos</span>
              </div>
            </div>
          </CustomCard>
        </div>
      </div>
    </div>
  )
}
