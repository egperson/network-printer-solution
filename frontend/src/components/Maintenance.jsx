import React, { useState } from 'react'

export default function Maintenance({pushToast}){
  const [tasks, setTasks] = useState(() => {
    try{ return JSON.parse(localStorage.getItem('monitor.maintenance')||'[]') }catch(e){ return [] }
  })
  const [newTask, setNewTask] = useState('')

  function add(){ if(!newTask) return; const t = { id: Date.now(), text: newTask, done:false }; const next=[t, ...tasks]; setTasks(next); localStorage.setItem('monitor.maintenance', JSON.stringify(next)); setNewTask(''); pushToast && pushToast({title:'Agendado', msg:'Tarefa adicionada'}) }
  function toggle(id){ const next=tasks.map(t=> t.id===id? {...t, done: !t.done} : t); setTasks(next); localStorage.setItem('monitor.maintenance', JSON.stringify(next)) }
  function remove(id){ const next=tasks.filter(t=>t.id!==id); setTasks(next); localStorage.setItem('monitor.maintenance', JSON.stringify(next)) }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="text-lg font-semibold">Manutenção</h2>
        <div className="text-sm text-white/60">Agende tarefas de manutenção e acompanhe o histórico</div>
        <div className="mt-4 flex gap-2">
          <input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Descrição da tarefa" className="px-3 py-2 rounded bg-white/5" />
          <button onClick={add} className="btn-export">Adicionar</button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3">Tarefas</h3>
        {tasks.length === 0 && <div className="text-sm text-white/60">Nenhuma tarefa</div>}
        {tasks.map(t=> (
          <div key={t.id} className="p-3 rounded bg-white/5 flex items-center justify-between mb-2">
            <div>
              <div className={`font-medium ${t.done ? 'text-white/60 line-through' : ''}`}>{t.text}</div>
              <div className="text-xs text-white/60">{new Date(t.id).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>toggle(t.id)} className="px-2 py-1 rounded border border-white/6">{t.done ? 'Reabrir' : 'Concluir'}</button>
              <button onClick={()=>remove(t.id)} className="px-2 py-1 rounded border border-white/6">Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
