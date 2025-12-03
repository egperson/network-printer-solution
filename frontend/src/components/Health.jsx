import React, { useState } from 'react'

export default function Health({devices}){
  const [sortBy, setSortBy] = useState('name')

  // Calcular saúde de cada dispositivo
  const deviceHealth = (devices || []).map(d => {
    let score = 100
    if(d.status !== 'ok') score -= 30
    
    const supplies = d.supplies || []
    for(const s of supplies){
      const m = (s.level||'').match(/(\d{1,3})/)
      if(m){
        const level = Number(m[1])
        if(level < 10) score -= 25
        else if(level < 20) score -= 15
        else if(level < 50) score -= 5
      }
    }
    
    return {
      ...d,
      healthScore: Math.max(0, score),
      healthStatus: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'warning' : 'critical'
    }
  }).sort((a, b) => {
    if(sortBy === 'name') return (a.deviceName||a.name||'').localeCompare(b.deviceName||b.name||'')
    if(sortBy === 'health') return b.healthScore - a.healthScore
    return 0
  })

  const getHealthColor = (status) => {
    return {
      excellent: 'text-green-400 bg-green-500/10 border-green-500/30',
      good: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      critical: 'text-red-400 bg-red-500/10 border-red-500/30'
    }[status] || 'text-white/60'
  }

  const getHealthLabel = (status) => {
    return {
      excellent: 'Excelente',
      good: 'Bom',
      warning: 'Aviso',
      critical: 'Crítico'
    }[status] || 'Desconhecido'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border-l-4 border-cyan-500">
        <div>
          <h2 className="text-xl font-semibold text-white">Saúde dos Dispositivos</h2>
          <div className="text-sm text-white/60 mt-1">Avaliação detalhada de cada impressora baseada em status e consumíveis</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-green-500">
          <div className="text-xs text-white/60 font-medium uppercase">Excelente</div>
          <div className="text-2xl font-bold text-green-400 mt-2">{deviceHealth.filter(d=>d.healthStatus==='excellent').length}</div>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <div className="text-xs text-white/60 font-medium uppercase">Bom</div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{deviceHealth.filter(d=>d.healthStatus==='good').length}</div>
        </div>
        <div className="card p-4 border-l-4 border-yellow-500">
          <div className="text-xs text-white/60 font-medium uppercase">Aviso</div>
          <div className="text-2xl font-bold text-yellow-400 mt-2">{deviceHealth.filter(d=>d.healthStatus==='warning').length}</div>
        </div>
        <div className="card p-4 border-l-4 border-red-500">
          <div className="text-xs text-white/60 font-medium uppercase">Crítico</div>
          <div className="text-2xl font-bold text-red-400 mt-2">{deviceHealth.filter(d=>d.healthStatus==='critical').length}</div>
        </div>
      </div>

      {/* Saúde geral */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Saúde geral da rede</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Saúde média</span>
            <span className="text-lg font-bold text-cyan-400">{deviceHealth.length > 0 ? Math.round(deviceHealth.reduce((a, d) => a + d.healthScore, 0) / deviceHealth.length) : 0}%</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div style={{width: `${deviceHealth.length > 0 ? Math.round(deviceHealth.reduce((a, d) => a + d.healthScore, 0) / deviceHealth.length) : 0}%`}} className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"></div>
          </div>
        </div>
      </div>

      {/* Lista detalhada */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Detalhes por dispositivo</h3>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-3 py-1 text-xs bg-white/10 border border-white/20 rounded">
            <option value="name">Nome</option>
            <option value="health">Saúde</option>
          </select>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {deviceHealth.map((d, idx) => (
            <div key={idx} className={`p-4 rounded border transition-all ${getHealthColor(d.healthStatus)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-white">{d.deviceName || d.name || 'Dispositivo'}</div>
                  <div className="text-xs text-white/60 mt-1">{d.deviceIp || d.url}</div>
                  <div className="text-xs mt-2">
                    {d.supplies && d.supplies.length > 0 && (
                      <div className="text-white/70">
                        {d.supplies.map((s, i) => (
                          <span key={i} className="mr-2">
                            {s.name}: {s.level || '?'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{d.healthScore}%</div>
                  <div className="text-xs mt-1">{getHealthLabel(d.healthStatus)}</div>
                </div>
              </div>
              <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                <div style={{width: `${d.healthScore}%`}} className={`h-full transition-all ${
                  d.healthStatus === 'excellent' ? 'bg-green-500' :
                  d.healthStatus === 'good' ? 'bg-blue-500' :
                  d.healthStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
