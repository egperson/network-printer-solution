import React, { useEffect, useState } from 'react'
import { useDialog } from '../hooks/useDialog'
import { ConfirmDialog, PromptDialog, AlertDialog } from './Dialogs'

export default function AutoReorder() {
  const [list, setList] = useState([])
  const { showConfirm, showPrompt, showAlert, confirmDialog, promptDialog, alertDialog } = useDialog()

  useEffect(() => { try { const raw = JSON.parse(localStorage.getItem('monitor.reorder') || '[]'); setList(raw) } catch (e) { setList([]) } }, [])

  function remove(idx) {
    const copy = [...list]; copy.splice(idx, 1); setList(copy); localStorage.setItem('monitor.reorder', JSON.stringify(copy))
  }

  async function clearAll() {
    const confirmed = await showConfirm('Remover todos os itens de auto-reorder?', 'Confirmar')
    if (!confirmed) return
    setList([])
    localStorage.removeItem('monitor.reorder')
  }

  function exportJSON() { const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'auto-reorder.json'; a.click(); a.remove(); URL.revokeObjectURL(url) }

  async function exportOrderCSV() {
    if (!list || !list.length) {
      await showAlert('Nenhum item para pedido')
      return
    }
    const rows = [['deviceId', 'supply', 'created']]; for (const r of list) rows.push([`"${r.id}"`, `"${r.supply}"`, `"${r.created}"`]); const csv = rows.map(r => r.join(',')).join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'reorder-purchase-order.csv'; a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  async function addManual() {
    const device = await showPrompt('Digite o ID do dispositivo (IP ou nome)', 'Adicionar Item')
    if (!device) return
    const supply = await showPrompt('Digite o nome do consumível', 'Adicionar Item')
    if (!supply) return
    const raw = JSON.parse(localStorage.getItem('monitor.reorder') || '[]')
    raw.unshift({ id: device, supply, created: new Date().toISOString() })
    localStorage.setItem('monitor.reorder', JSON.stringify(raw))
    setList(raw)
  }


  return (
    <>
      <div className="space-y-4">
        <div className="card p-4">
          <h2 className="text-lg font-semibold">Auto-Reorder</h2>
          <div className="text-sm text-white/60 mt-1">Itens marcados para re-encomenda automática quando estiverem baixos.</div>
          <div className="mt-3 flex gap-2">
            <button className="btn-sm" onClick={exportJSON}>Exportar JSON</button>
            <button className="btn-sm" onClick={exportOrderCSV}>Gerar pedido (CSV)</button>
            <button className="btn-sm" onClick={addManual}>Adicionar manual</button>
            <button className="btn-sm" onClick={clearAll}>Limpar tudo</button>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold mb-3">Itens ({list.length})</h3>
          {list.length === 0 && <div className="text-sm text-white/60">Nenhum item marcado</div>}
          <div className="space-y-2">
            {list.map((r, i) => (
              <div key={i} className="p-3 bg-white/3 rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.supply}</div>
                  <div className="text-xs text-white/60">Device: {r.id}</div>
                  <div className="text-xs text-white/60">Criado: {new Date(r.created).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-sm" onClick={() => remove(i)}>Remover</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog {...confirmDialog} />
      <PromptDialog {...promptDialog} />
      <AlertDialog {...alertDialog} />
    </>
  )
}
