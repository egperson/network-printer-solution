import React, { useEffect, useState } from 'react'
import Modal from './Modal'

export default function Inventory(){
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(()=>{
    try{ const raw = localStorage.getItem('monitor.inventory'); if(raw) setItems(JSON.parse(raw)) }catch(e){}
  },[])

  useEffect(()=>{ try{ localStorage.setItem('monitor.inventory', JSON.stringify(items)) }catch(e){} },[items])

  function addItem(){ setEditing({name:'', qty:0}); setOpen(true) }
  function editItem(i){ setEditing({...items[i], _idx:i}); setOpen(true) }
  function removeItem(i){ const next = items.slice(); next.splice(i,1); setItems(next) }

  function saveEditing(){
    if(!editing) return
    const copy = items.slice()
    if(editing._idx !== undefined){ copy[editing._idx] = { name: editing.name, qty: Number(editing.qty) } }
    else { copy.push({ name: editing.name, qty: Number(editing.qty) }) }
    setItems(copy)
    setOpen(false)
    setEditing(null)
  }

  function importFile(file){
    if(!file) return
    const reader = new FileReader()
    reader.onload = e => {
      try{ const obj = JSON.parse(e.target.result); if(Array.isArray(obj)) setItems(obj); else alert('Formato inválido') }catch(err){ alert('JSON inválido') }
    }
    reader.readAsText(file)
  }

  function exportJSON(){
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='inventory.json'; a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Inventário</h2>
          <div className="text-sm text-white/60">Gerencie o estoque de consumíveis</div>
        </div>
        <div className="flex items-center gap-2">
          <input aria-label="Importar inventário" type="file" accept="application/json" onChange={e=>importFile(e.target.files && e.target.files[0])} />
          <button onClick={exportJSON} className="btn-export">Exportar JSON</button>
          <button onClick={addItem} className="px-3 py-2 rounded border border-white/6">Adicionar</button>
        </div>
      </div>

      <div className="card p-5">
        {items.length === 0 ? (
          <div className="text-sm text-white/60">Nenhum item no inventário</div>
        ) : (
          <div className="space-y-2">
            {items.map((it,i)=> (
              <div key={i} className="p-3 rounded bg-white/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{it.name}</div>
                  <div className="text-xs text-white/60">Quantidade: {it.qty}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>editItem(i)} className="px-2 py-1 rounded border border-white/6">Editar</button>
                  <button onClick={()=>removeItem(i)} className="px-2 py-1 rounded border border-white/6">Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} title={editing ? (editing._idx !== undefined ? 'Editar item' : 'Adicionar item') : ''} onClose={()=>{setOpen(false); setEditing(null)}} footer={(
        <div className="flex gap-2">
          <button onClick={()=>{ setOpen(false); setEditing(null) }} className="px-3 py-2 rounded border border-white/6">Cancelar</button>
          <button onClick={saveEditing} className="btn-export">Salvar</button>
        </div>
      )}>
        {editing && (
          <div className="space-y-2">
            <div>
              <label className="text-sm">Nome</label>
              <input value={editing.name} onChange={e=>setEditing({...editing, name: e.target.value})} />
            </div>
            <div>
              <label className="text-sm">Quantidade</label>
              <input type="number" value={editing.qty} onChange={e=>setEditing({...editing, qty: Number(e.target.value)})} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
