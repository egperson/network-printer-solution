import React, { useState, useEffect, useRef } from 'react'

export default function NetworkMap({devices}){
  const [autoArrange, setAutoArrange] = useState(true)
  const [positions, setPositions] = useState({})
  const [hoverCol, setHoverCol] = useState(null)
  const containerRef = useRef(null)

  useEffect(()=>{
    // load saved positions
    try{ const raw = localStorage.getItem('monitor.positions'); if(raw) setPositions(JSON.parse(raw)) }catch(e){}
  },[])

  useEffect(()=>{
    try{ localStorage.setItem('monitor.positions', JSON.stringify(positions)) }catch(e){}
  },[positions])

  function arrangeGrid(){
    const cols = 12
    const newPos = {}
    (devices || []).forEach((d, i) => {
      const id = d.deviceIp || d.url || d.deviceName || d.name || i
      newPos[id] = { col: (i % cols) + 1 }
    })
    setPositions(newPos)
  }

  useEffect(()=>{ if(autoArrange) arrangeGrid() },[devices, autoArrange])

  function getColForClientX(clientX){
    const el = containerRef.current
    if(!el) return 1
    const rect = el.getBoundingClientRect()
    const relX = clientX - rect.left
    const colWidth = rect.width / 12
    let col = Math.floor(relX / colWidth) + 1
    if(col < 1) col = 1
    if(col > 12) col = 12
    return col
  }

  function onDragStart(e, key){
    e.dataTransfer.setData('text/plain', key)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e){
    e.preventDefault()
    const col = getColForClientX(e.clientX)
    setHoverCol(col)
  }

  function onDrop(e){
    e.preventDefault()
    const key = e.dataTransfer.getData('text/plain')
    const col = getColForClientX(e.clientX)
    if(!key) return
    setPositions(prev => ({ ...prev, [key]: { col } }))
    setHoverCol(null)
  }

  function resetPositions(){
    setPositions({})
    try{ localStorage.removeItem('monitor.positions') }catch(e){}
  }

  return (
    <div className="space-y-6">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mapa de Rede</h2>
          <div className="text-sm text-white/60 mt-1">Visualização rápida dos dispositivos na rede (arraste para reposicionar)</div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-white/60">Auto-arrange</label>
          <input type="checkbox" checked={autoArrange} onChange={e=>setAutoArrange(e.target.checked)} />
          <button onClick={arrangeGrid} className="px-3 py-1 rounded border border-white/6">Rearranjar</button>
          <button onClick={resetPositions} className="px-3 py-1 rounded border border-white/6">Resetar posições</button>
        </div>
      </div>

      <div className="card p-5">
        <div ref={containerRef} onDragOver={onDragOver} onDrop={onDrop} className="relative">
          <div className="grid grid-cols-12 gap-2" style={{minHeight: 120}}>
            {(devices || []).map((d, idx) => {
              const key = d.deviceIp || d.url || d.deviceName || d.name || idx
              const defaultCol = (idx % 12) + 1
              const col = positions[key] ? positions[key].col : defaultCol
              const style = { gridColumnStart: col, gridColumnEnd: `span 1` }
              const cls = `p-2 rounded text-xs font-semibold flex items-center justify-center cursor-grab select-none transition-all ${d.status==='ok' ? 'bg-green-600/40 text-green-300 border border-green-500/30' : 'bg-red-600/40 text-red-300 border border-red-500/30'}`
              const label = d.deviceName ? (d.deviceName.length > 12 ? d.deviceName.slice(0,12)+'…' : d.deviceName) : (d.deviceIp || d.url || `#${idx+1}`)
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={(e)=>onDragStart(e, key)}
                  onDragEnd={()=>setHoverCol(null)}
                  title={`${d.deviceName || d.name || key} — ${d.deviceIp || d.url}`}
                  style={style}
                >
                  <div className={cls}>
                    {label}
                  </div>
                </div>
              )
            })}
            {(devices || []).length === 0 && <div className="col-span-full text-center py-8 text-white/50">Nenhum dispositivo</div>}
          </div>

          {hoverCol && (
            <div className="pointer-events-none absolute top-0 left-0 right-0 bottom-0">
              <div style={{position:'absolute', top:8, left:`calc(${(hoverCol-1)/12*100}% + 4px)`}} className="w-0 h-full border-l border-white/20" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
