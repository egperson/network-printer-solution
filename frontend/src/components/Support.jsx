import React from 'react'

export default function Support(){
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-lg font-semibold">Suporte</h2>
        <div className="text-sm text-white/60 mt-2">Informações úteis e contato</div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/3 rounded">
            <div className="font-semibold">Documentação</div>
            <div className="text-xs text-white/60 mt-1">Ver documentação do projeto e endpoints.</div>
          </div>
          <div className="p-3 bg-white/3 rounded">
            <div className="font-semibold">Contato</div>
            <div className="text-xs text-white/60 mt-1">Admin: admin@example.local</div>
          </div>
        </div>
      </div>
    </div>
  )
}
