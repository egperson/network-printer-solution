import React from 'react'

export default function Dashboard({data}){
  const devices = data ? (data.devices||[]) : []
  const onlineCount = devices.filter(d=>d.status==='ok').length
  const errorCount = devices.length - onlineCount
  const colorCount = devices.filter(d=>d.type==='color').length
  const monoCount = devices.filter(d=>d.type==='mono').length
  
  // Consumíveis com baixa carga
  const lowSupplies = []
  for(const d of devices){
    if(!d.supplies) continue
    for(const s of d.supplies){
      const m = (s.level||'').match(/(\d{1,3})/)
      if(m && Number(m[1]) <= 20){
        lowSupplies.push({device: d.deviceName||d.name||d.url, supply: s.name, level: Number(m[1])})
      }
    }
  }
  
  // Status distribution
  const okDevices = devices.filter(d=>d.status==='ok').length
  const errorDevices = devices.length - okDevices
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-cyan-500">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-white/60 font-medium uppercase">Dispositivos</div>
              <div className="text-3xl font-bold text-white mt-2">{devices.length}</div>
            </div>
            <div className="text-4xl opacity-20">🖨️</div>
          </div>
          <div className="text-xs text-white/50 mt-3">Total na rede</div>
        </div>

        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-white/60 font-medium uppercase">Online</div>
              <div className="text-3xl font-bold text-green-400 mt-2">{onlineCount}</div>
            </div>
            <div className="text-4xl opacity-20">✓</div>
          </div>
          <div className="text-xs text-white/50 mt-3">Status OK</div>
        </div>

        <div className="card p-5 border-l-4 border-red-500">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-white/60 font-medium uppercase">Offline/Erro</div>
              <div className="text-3xl font-bold text-red-400 mt-2">{errorCount}</div>
            </div>
            <div className="text-4xl opacity-20">!</div>
          </div>
          <div className="text-xs text-white/50 mt-3">Com problema</div>
        </div>

        <div className="card p-5 border-l-4 border-orange-500">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-white/60 font-medium uppercase">Alertas</div>
              <div className="text-3xl font-bold text-orange-400 mt-2">{lowSupplies.length}</div>
            </div>
            <div className="text-4xl opacity-20">⚠️</div>
          </div>
          <div className="text-xs text-white/50 mt-3">Consumíveis baixos</div>
        </div>
      </div>

      {/* Status Overview & Consumables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Status geral</h3>
          <div className="space-y-3">
            {/* OK Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/70">Online (OK)</span>
                <span className="text-xs font-bold text-green-400">{okDevices}</span>
              </div>
              <div className="h-3 bg-white/10 rounded overflow-hidden">
                <div style={{width: `${devices.length > 0 ? (okDevices/devices.length)*100 : 0}%`}} className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"></div>
              </div>
            </div>

            {/* Error Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/70">Offline/Erro</span>
                <span className="text-xs font-bold text-red-400">{errorDevices}</span>
              </div>
              <div className="h-3 bg-white/10 rounded overflow-hidden">
                <div style={{width: `${devices.length > 0 ? (errorDevices/devices.length)*100 : 0}%`}} className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"></div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-4 pt-4">
            <h4 className="text-xs font-semibold text-white/80 mb-2">Por tipo</h4>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Coloridas</span>
              <span className="font-bold text-cyan-400">{colorCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-white/60">Monocromáticas</span>
              <span className="font-bold text-slate-400">{monoCount}</span>
            </div>
          </div>
        </div>

        {/* Consumables Low */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Consumíveis com baixa carga</h3>
          {lowSupplies.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✓</div>
              <div className="text-sm text-white/60">Todos os consumíveis estão bem</div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {lowSupplies.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{item.device}</div>
                    <div className="text-xs text-white/60">{item.supply}</div>
                  </div>
                  <div className={`text-sm font-bold ${item.level <= 10 ? 'text-red-400' : item.level <= 15 ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {item.level}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Devices Grid */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Mapa de dispositivos</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
          {devices.map((d, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded flex items-center justify-center text-xs font-bold cursor-default transition-all ${
                d.status === 'ok'
                  ? 'bg-green-600/40 text-green-300 border border-green-500/50 hover:bg-green-600/60'
                  : 'bg-red-600/40 text-red-300 border border-red-500/50 hover:bg-red-600/60'
              }`}
              title={`${d.deviceName || d.name || d.url} - ${d.status}`}
            >
              {idx + 1}
            </div>
          ))}
          {devices.length === 0 && (
            <div className="col-span-full text-center py-8 text-white/50">
              Nenhum dispositivo detectado
            </div>
          )}
        </div>
      </div>

      {/* Device Types Distribution */}
      {devices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type distribution */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Distribuição por tipo</h3>
            <div className="space-y-4">
              {colorCount > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                      <span className="text-sm text-white/80">Coloridas</span>
                    </div>
                    <span className="text-sm font-bold text-cyan-400">{colorCount}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded overflow-hidden">
                    <div style={{width: `${(colorCount/(colorCount+monoCount))*100}%`}} className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"></div>
                  </div>
                </div>
              )}
              {monoCount > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                      <span className="text-sm text-white/80">Monocromáticas</span>
                    </div>
                    <span className="text-sm font-bold text-slate-400">{monoCount}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded overflow-hidden">
                    <div style={{width: `${(monoCount/(colorCount+monoCount))*100}%`}} className="h-full bg-gradient-to-r from-slate-600 to-slate-400"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Resumo rápido</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm text-white/70">Taxa de disponibilidade</span>
                <span className="text-sm font-bold text-green-400">{devices.length > 0 ? Math.round((okDevices/devices.length)*100) : 0}%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm text-white/70">Dispositivos com aviso</span>
                <span className="text-sm font-bold text-orange-400">{lowSupplies.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm text-white/70">Última atualização</span>
                <span className="text-sm text-white/50">Agora</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm text-white/70">Tempo médio de resposta</span>
                <span className="text-sm text-white/50">~500ms</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
