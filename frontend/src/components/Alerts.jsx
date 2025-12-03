import React, { useEffect, useState } from 'react'

export default function Alerts({ pushToast }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({ type: 'all', deviceId: '' })

  async function loadAlerts() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('limit', '100')
      if (filter.type !== 'all') params.append('type', filter.type)
      if (filter.deviceId) params.append('deviceId', filter.deviceId)

      const res = await fetch(`/api/alerts/history?${params}`)
      const json = await res.json()
      if (json.ok) {
        setAlerts(json.alerts || [])
      }
    } catch (e) {
      if (pushToast) pushToast({ title: 'Erro', msg: e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [filter])

  const uniqueDevices = [...new Set(alerts.map(a => a.deviceId).filter(Boolean))]

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Alertas</h2>
          <div className="text-sm text-white/60">Histórico de alertas do sistema</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAlerts} className="px-3 py-2 rounded border border-white/6">
            Atualizar
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex gap-3 items-center mb-4">
          <div>
            <label className="text-xs text-white/60 block mb-1">Tipo</label>
            <select
              value={filter.type}
              onChange={e => setFilter({ ...filter, type: e.target.value })}
              className="px-2 py-1 bg-transparent border border-white/6 rounded"
            >
              <option value="all">Todos</option>
              <option value="low-supply">Consumível Baixo</option>
              <option value="error">Erro</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">Dispositivo</label>
            <select
              value={filter.deviceId}
              onChange={e => setFilter({ ...filter, deviceId: e.target.value })}
              className="px-2 py-1 bg-transparent border border-white/6 rounded"
            >
              <option value="">Todos</option>
              {uniqueDevices.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && <div className="text-sm text-white/60 p-4">Carregando...</div>}
        {!loading && alerts.length === 0 && <div className="text-sm text-white/60 p-4">Nenhum alerta encontrado</div>}

        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className="p-3 bg-white/5 rounded border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${alert.type === 'low-supply' ? 'bg-orange-500/20 text-orange-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                      {alert.type === 'low-supply' ? 'Consumível Baixo' : alert.type}
                    </span>
                    <span className="text-xs text-white/50">{new Date(alert.ts).toLocaleString()}</span>
                  </div>
                  <div className="mt-2">
                    <div className="font-semibold">{alert.deviceName || alert.deviceId}</div>
                    {alert.supply && (
                      <div className="text-sm text-white/70">
                        {alert.supply}: <span className="font-bold text-orange-300">{alert.level}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
