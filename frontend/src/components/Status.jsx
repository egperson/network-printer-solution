import React from 'react'

export default function Status({data}){
  const devices = (data && data.devices) || []
  const total = devices.length
  const ok = devices.filter(d=>d.status==='ok').length
  const err = total - ok
  const last = data && data.timestamp

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Status do Sistema</h2>
          <div className="text-sm text-white/60 mt-1">Resumo rápido da última varredura</div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-white/60">Dispositivos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-300">{ok}</div>
            <div className="text-xs text-white/60">OK</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-300">{err}</div>
            <div className="text-xs text-white/60">Erros</div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm text-white/60 mb-3">Última varredura: {last || '—'}</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white/2 rounded">
            <div className="font-semibold">Conectividade</div>
            <div className="text-xs text-white/60">Verifique a disponibilidade de rede e latência</div>
          </div>
          <div className="p-3 bg-white/2 rounded">
            <div className="font-semibold">Alertas recentes</div>
            <div className="text-xs text-white/60">Abra a aba Alertas para histórico e ações</div>
          </div>
          <div className="p-3 bg-white/2 rounded">
            <div className="font-semibold">Inventário</div>
            <div className="text-xs text-white/60">Gerencie consumíveis na aba Inventário</div>
          </div>
        </div>
      </div>
    </div>
  )
}
