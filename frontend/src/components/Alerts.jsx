import React, { useEffect, useState } from 'react'

export default function Alerts(){
  const [items, setItems] = useState([])

  useEffect(()=>{
    try{
      const hist = JSON.parse(localStorage.getItem('monitor.alerts') || '[]')
      setItems(hist)
    }catch(e){ setItems([]) }
  },[])

  function clearAll(){
    localStorage.removeItem('monitor.alerts')
    setItems([])
  }

  function remove(id){
    const next = items.filter(i=>i.id !== id)
    setItems(next)
    localStorage.setItem('monitor.alerts', JSON.stringify(next))
  }

  return (
    <div>
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Alerts / Histórico</h2>
          <div className="text-sm text-white/60">Últimos alertas gerados pelo monitor</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearAll} className="px-3 py-2 rounded border border-white/6">Limpar tudo</button>
        </div>
      </div>

      <div className="card p-2">
        {items.length === 0 && <div className="text-sm text-white/60 p-4">Nenhum alerta</div>}
        <ul>
          {items.map(it => (
            <li key={it.id} className="border-b border-white/6 py-3 flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold">{it.title}</div>
                <div className="text-xs text-white/60">{it.msg}</div>
                <div className="text-xs text-white/50 mt-1">{new Date(it.ts).toLocaleString()}</div>
              </div>
              <div className="ml-4">
                <button onClick={()=>remove(it.id)} className="px-2 py-1 rounded border border-white/6">Remover</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
