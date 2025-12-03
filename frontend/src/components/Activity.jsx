import React from 'react'

export default function Activity({devices}){
  // simple text summary for now
  const recent = (devices||[]).slice(0,6)
  return (
    <div>
      {recent.length===0 && <div className="muted">Nenhuma atividade registrada</div>}
      {recent.map((d,i)=>(
        <div key={i} style={{padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
          <div style={{fontWeight:600}}>{d.deviceName||d.name||d.url}</div>
          <div className="small muted">{d.deviceIp||d.url} — {d.status||'—'}</div>
        </div>
      ))}
    </div>
  )
}
