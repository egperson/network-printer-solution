import React, { useEffect, useState } from 'react'

export default function Logs({pushToast}){
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showRaw, setShowRaw] = useState(false)

  async function load(){
    setLoading(true)
    try{
      const res = await fetch('/api/status')
      const j = await res.json()
      setData(j)
    }catch(e){ pushToast({title:'Erro', msg: e.message, type:'error'}) }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ load() },[])

  function download(){
    if(!data) return pushToast({title:'Nada', msg:'Sem dados para baixar'})
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'status.json'; a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  function filteredDevices(){
    if(!data || !data.devices) return []
    let list = data.devices.slice()
    if(startDate){
      const s = new Date(startDate)
      list = list.filter(d=> d.timestamp && new Date(d.timestamp) >= s)
    }
    if(endDate){
      const e = new Date(endDate)
      // include whole day
      e.setHours(23,59,59,999)
      list = list.filter(d=> d.timestamp && new Date(d.timestamp) <= e)
    }
    return list
  }

  const list = filteredDevices()
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize))
  const pageItems = list.slice((page-1)*pageSize, (page-1)*pageSize + pageSize)

  return (
    <div>
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Logs</h2>
          <div className="text-sm text-white/60">Último snapshot de `/api/status`</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={download} className="px-3 py-2 rounded border border-white/6">Baixar JSON</button>
          <button onClick={async ()=>{ await fetch('/api/clear-data',{method:'POST'}); load(); pushToast({title:'Limpo', msg:'Dados locais limpos'}) }} className="ml-2 px-3 py-2 rounded border border-white/6">Limpar dados</button>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-white/60">De</label>
          <input aria-label="Data início" type="date" value={startDate} onChange={e=>{ setStartDate(e.target.value); setPage(1) }} />
          <label className="text-sm text-white/60">Até</label>
          <input aria-label="Data fim" type="date" value={endDate} onChange={e=>{ setEndDate(e.target.value); setPage(1) }} />
          <label className="text-sm text-white/60">/ Página</label>
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1) }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <label className="text-sm text-white/60">Raw</label>
          <input aria-label="Mostrar JSON cru" type="checkbox" checked={showRaw} onChange={e=>setShowRaw(e.target.checked)} />
        </div>
      </div>

      <div className="card">
        {loading && <div>Carregando...</div>}
        {!loading && showRaw && <pre className="text-xs whitespace-pre-wrap">{data ? JSON.stringify(data, null, 2) : 'Nenhum dado'}</pre>}
        {!loading && !showRaw && (
          <div>
            <div className="text-sm text-white/60 mb-2">Mostrando {list.length} entradas — Página {page} / {totalPages}</div>
            <div className="space-y-2">
              {pageItems.map((d,i)=>(
                <div key={i} className="p-2 border border-white/6 rounded grid grid-cols-2 gap-2">
                  <div>
                    <div className="font-medium">{d.deviceName || d.name || d.url}</div>
                    <div className="text-xs text-white/60">{d.deviceIp || d.url}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Status: {d.status || '-'}</div>
                    <div className="text-xs text-white/60">{d.timestamp || ''}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-white/60">Total: {list.length}</div>
              <div className="flex gap-2">
                <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 rounded border border-white/6">Anterior</button>
                <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-3 py-1 rounded border border-white/6">Próxima</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
