import React, { useEffect, useState } from 'react'

export default function Reports({devices}){
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    async function load(){
      setLoading(true)
      try{
        const res = await fetch('/api/history?limit=200')
        const j = await res.json()
        if(j && j.rows) setHistory(j.rows)
      }catch(e){ console.error(e) }
      finally{ setLoading(false) }
    }
    load()
  },[])

  function exportCSV(){
    if(!history || !history.length) return alert('Nenhum dado para exportar')
    const rows = []
    const header = ['ts','device_count','ok_count','raw']
    rows.push(header.join(','))
    for(const r of history){
      const device_count = r.data && r.data.devices ? r.data.devices.length : 0
      const ok_count = r.data && r.data.devices ? r.data.devices.filter(d=>d.status==='ok').length : 0
      rows.push([`"${r.ts}"`, device_count, ok_count, `"${JSON.stringify(r.data).replace(/\"/g,'\"\"')}"`].join(','))
    }
    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='history.csv'; a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  function exportJSON(){
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='history.json'; a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="text-lg font-semibold">Relatórios</h2>
        <div className="text-sm text-white/60 mt-1">Exporte histórico, gere relatórios rápidos e avalie tendências.</div>
        <div className="mt-4 flex gap-2">
          <button onClick={exportCSV} className="btn-export">Exportar CSV</button>
          <button onClick={exportJSON} className="btn-export">Exportar JSON</button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3">Resumo rápido (últimos {history.length})</h3>
        {loading && <div>Carregando...</div>}
        {!loading && history.length === 0 && <div className="text-sm text-white/60">Nenhum histórico disponível</div>}
        {!loading && history.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map((h, i)=> (
              <div key={i} className="p-3 bg-white/5 rounded border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{new Date(h.ts).toLocaleString()}</div>
                    <div className="text-xs text-white/60">Dispositivos: {(h.data && h.data.devices) ? h.data.devices.length : 0}</div>
                  </div>
                  <div className="text-xs text-white/60">Snapshot ID: {h.id || '-'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
