import React from 'react'

export default function Toasts({toasts, onClose}){
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-2 rounded shadow ${t.type==='error' ? 'bg-white text-black' : 'bg-white/6 text-white'} flex items-start gap-3`} style={{border: t.type==='error' ? '1px solid rgba(0,0,0,0.6)' : '1px solid rgba(255,255,255,0.02)'}}>
          <div className="flex-1">
            <div className="text-sm font-semibold">{t.title || (t.type==='error' ? 'Alerta' : 'Info')}</div>
            <div className="text-xs mt-1">{t.msg}</div>
          </div>
          <div>
            <button aria-label={`Fechar alerta ${t.title}`} onClick={()=>onClose && onClose(t.id)} className="px-2 py-1 rounded border border-white/6 bg-transparent text-white text-xs">Fechar</button>
          </div>
        </div>
      ))}
    </div>
  )
}
