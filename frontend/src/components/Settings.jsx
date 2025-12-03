import React, { useEffect, useState } from 'react'

export default function Settings({autoRefresh, setAutoRefresh, threshold, setThreshold, pushToast}){
  const [localAuto, setLocalAuto] = useState(autoRefresh)
  const [localThreshold, setLocalThreshold] = useState(threshold)
  const [limit, setLimit] = useState(20)

  useEffect(()=>{ setLocalAuto(autoRefresh); setLocalThreshold(threshold) },[autoRefresh,threshold])

  function save(){
    setAutoRefresh(Number(localAuto))
    setThreshold(Number(localThreshold))
    localStorage.setItem('monitor.autoRefresh', String(localAuto))
    localStorage.setItem('monitor.threshold', String(localThreshold))
    pushToast({title:'Config salva', msg:'Configurações atualizadas'})
  }

  async function triggerLimited(){
    try{
      const res = await fetch(`/api/collect?limit=${Number(limit)}`, { method: 'POST' })
      const j = await res.json()
      if(j.ok) pushToast({title:'Varredura', msg:`Varredura limitada a ${limit} iniciada`})
      else pushToast({title:'Erro', msg: j.error, type:'error'})
    }catch(e){ pushToast({title:'Erro', msg: e.message, type:'error'}) }
  }

  async function exportPrinters(){
    try{
      const res = await fetch('/api/printers')
      const j = await res.json()
      if(!j.ok) return pushToast({title:'Erro', msg: j.error, type:'error'})
      const blob = new Blob([JSON.stringify(j.printers, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'printers.json'; a.click(); a.remove(); URL.revokeObjectURL(url)
      pushToast({title:'Exportado', msg:'printers.json baixado'})
    }catch(e){ pushToast({title:'Erro', msg: e.message, type:'error'}) }
  }

  async function importPrintersFile(file){
    if(!file) return pushToast({title:'Aviso', msg:'Nenhum arquivo selecionado'})
    try{
      const txt = await file.text()
      const obj = JSON.parse(txt)
      const res = await fetch('/api/printers', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(obj) })
      const j = await res.json()
      if(j.ok) pushToast({title:'Importado', msg:'printers.json atualizado'})
      else pushToast({title:'Erro', msg: j.error, type:'error'})
    }catch(e){ pushToast({title:'Erro', msg: e.message, type:'error'}) }
  }

  return (
    <div>
      <div className="card mb-4">
        <h2 className="text-lg font-semibold">Settings</h2>
        <div className="mt-2 text-sm text-white/60">Configurações do monitor</div>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Auto-refresh (segundos)</label>
          <input type="number" value={localAuto} onChange={e=>setLocalAuto(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Limiar (consumíveis %)</label>
          <input type="number" value={localThreshold} onChange={e=>setLocalThreshold(e.target.value)} />
        </div>
        <div>
          <button onClick={save} className="px-3 py-2 rounded border border-white/6">Salvar</button>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold">Scan rápido</h4>
          <div className="flex items-center gap-2 mt-2">
            <input type="number" value={limit} onChange={e=>setLimit(Number(e.target.value))} className="w-28" />
            <button onClick={triggerLimited} className="px-3 py-2 rounded border border-white/6">Iniciar</button>
          </div>
        </div>
        <div className="mt-4">
          <h4 className="font-semibold">Importar / Exportar</h4>
          <div className="mt-2 flex items-center gap-2">
            <button onClick={exportPrinters} className="px-3 py-2 rounded border border-white/6">Exportar printers.json</button>
            <input aria-label="Importar printers.json" type="file" accept="application/json" onChange={e=>importPrintersFile(e.target.files && e.target.files[0])} />
          </div>
        </div>
      </div>
    </div>
  )
}
