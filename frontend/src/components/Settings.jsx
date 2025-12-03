import React, { useEffect, useState } from 'react'

export default function Settings({ autoRefresh, setAutoRefresh, threshold, setThreshold, pushToast }) {
  const [localAuto, setLocalAuto] = useState(autoRefresh)
  const [localThreshold, setLocalThreshold] = useState(threshold)
  const [limit, setLimit] = useState(20)
  const [config, setConfig] = useState(null)
  const [newPrefix, setNewPrefix] = useState('')
  const [newLabel, setNewLabel] = useState('')

  useEffect(() => {
    setLocalAuto(autoRefresh);
    setLocalThreshold(threshold);
    loadConfig();
  }, [autoRefresh, threshold])

  async function loadConfig() {
    try {
      const res = await fetch('/api/printers')
      const json = await res.json()
      if (json.ok) {
        setConfig(json.printers)
      }
    } catch (e) {
      console.error('Failed to load config:', e)
    }
  }

  function save() {
    setAutoRefresh(Number(localAuto))
    setThreshold(Number(localThreshold))
    localStorage.setItem('monitor.autoRefresh', String(localAuto))
    localStorage.setItem('monitor.threshold', String(localThreshold))
    pushToast({ title: 'Config salva', msg: 'Configurações atualizadas' })
  }

  async function saveConfig(newConfig) {
    try {
      const res = await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      })
      const json = await res.json()
      if (json.ok) {
        setConfig(newConfig)
        pushToast({ title: 'Sucesso', msg: 'Configuração de rede salva' })
      } else {
        pushToast({ title: 'Erro', msg: json.error, type: 'error' })
      }
    } catch (e) {
      pushToast({ title: 'Erro', msg: e.message, type: 'error' })
    }
  }

  function addPrefix() {
    if (!newPrefix.trim()) {
      return pushToast({ title: 'Aviso', msg: 'Digite um prefixo válido', type: 'warning' })
    }

    const updatedConfig = { ...config }
    if (!updatedConfig.scan) {
      updatedConfig.scan = {
        enabled: true,
        prefixes: [],
        start: 1,
        end: 254,
        protocol: 'https',
        concurrency: 15
      }
    }
    if (!updatedConfig.scan.prefixes) {
      updatedConfig.scan.prefixes = []
    }

    // Check if prefix already exists (support both string and object format)
    const existingPrefix = updatedConfig.scan.prefixes.find(p => {
      const prefixStr = typeof p === 'string' ? p : p.prefix;
      return prefixStr === newPrefix.trim();
    });

    if (existingPrefix) {
      return pushToast({ title: 'Aviso', msg: 'Prefixo já existe', type: 'warning' })
    }

    // Add as object with label
    updatedConfig.scan.prefixes.push({
      prefix: newPrefix.trim(),
      label: newLabel.trim() || null
    })

    saveConfig(updatedConfig)
    setNewPrefix('')
    setNewLabel('')

    // Trigger collection to scan new prefix
    setTimeout(() => {
      triggerCollection()
    }, 1000)
  }

  async function triggerCollection() {
    try {
      const res = await fetch('/api/collect', { method: 'POST' })
      const json = await res.json()
      if (json.ok) {
        pushToast({ title: 'Coleta Iniciada', msg: 'Escaneando novos dispositivos...' })
      }
    } catch (e) {
      console.error('Failed to trigger collection:', e)
    }
  }

  function removePrefix(prefixToRemove) {
    const updatedConfig = { ...config }
    if (updatedConfig.scan && updatedConfig.scan.prefixes) {
      updatedConfig.scan.prefixes = updatedConfig.scan.prefixes.filter(p => {
        const prefixStr = typeof p === 'string' ? p : p.prefix;
        return prefixStr !== prefixToRemove;
      })
      saveConfig(updatedConfig)
    }
  }

  function updateScanRange(field, value) {
    const updatedConfig = { ...config }
    if (!updatedConfig.scan) {
      updatedConfig.scan = {
        enabled: true,
        prefixes: [],
        start: 1,
        end: 254,
        protocol: 'https',
        concurrency: 15
      }
    }
    updatedConfig.scan[field] = field === 'enabled' ? value : Number(value)
    saveConfig(updatedConfig)
  }

  async function triggerLimited() {
    try {
      const res = await fetch(`/api/collect?limit=${Number(limit)}`, { method: 'POST' })
      const j = await res.json()
      if (j.ok) pushToast({ title: 'Varredura', msg: `Varredura limitada a ${limit} iniciada` })
      else pushToast({ title: 'Erro', msg: j.error, type: 'error' })
    } catch (e) { pushToast({ title: 'Erro', msg: e.message, type: 'error' }) }
  }

  async function exportPrinters() {
    try {
      const res = await fetch('/api/printers')
      const j = await res.json()
      if (!j.ok) return pushToast({ title: 'Erro', msg: j.error, type: 'error' })
      const blob = new Blob([JSON.stringify(j.printers, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'printers.json'; a.click(); a.remove(); URL.revokeObjectURL(url)
      pushToast({ title: 'Exportado', msg: 'printers.json baixado' })
    } catch (e) { pushToast({ title: 'Erro', msg: e.message, type: 'error' }) }
  }

  async function importPrintersFile(file) {
    if (!file) return pushToast({ title: 'Aviso', msg: 'Nenhum arquivo selecionado' })
    try {
      const txt = await file.text()
      const obj = JSON.parse(txt)
      const res = await fetch('/api/printers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) })
      const j = await res.json()
      if (j.ok) {
        pushToast({ title: 'Importado', msg: 'printers.json atualizado' })
        loadConfig()
      } else {
        pushToast({ title: 'Erro', msg: j.error, type: 'error' })
      }
    } catch (e) { pushToast({ title: 'Erro', msg: e.message, type: 'error' }) }
  }

  const scanConfig = config?.scan || {}
  const prefixes = scanConfig.prefixes || []

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-lg font-semibold">Configurações</h2>
        <div className="mt-2 text-sm text-white/60">Configure o sistema de monitoramento</div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Prefixos de Rede</h3>
        <div className="text-xs text-white/60 mb-3">
          Adicione prefixos de IP para escanear com identificação/localização
        </div>

        <div className="space-y-2 mb-3">
          <input
            type="text"
            value={newPrefix}
            onChange={e => setNewPrefix(e.target.value)}
            placeholder="Prefixo (ex: 10.12.86.)"
            className="w-full px-3 py-2 bg-transparent border border-white/10 rounded"
          />
          <input
            type="text"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Localização (ex: Prédio A - Andar 1)"
            className="w-full px-3 py-2 bg-transparent border border-white/10 rounded"
          />
          <button onClick={addPrefix} className="w-full px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700">
            Adicionar Prefixo
          </button>
        </div>

        {prefixes.length === 0 && (
          <div className="text-sm text-white/50 p-3 bg-white/5 rounded">
            Nenhum prefixo configurado
          </div>
        )}

        <div className="space-y-2">
          {prefixes.map((item, idx) => {
            const prefix = typeof item === 'string' ? item : item.prefix;
            const label = typeof item === 'string' ? null : item.label;

            return (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded">
                <div className="flex-1">
                  <div className="font-semibold">{prefix}</div>
                  {label && (
                    <div className="text-xs text-cyan-300 mt-1">
                      📍 {label}
                    </div>
                  )}
                  <div className="text-xs text-white/60 mt-1">
                    Range: {scanConfig.start || 1} - {scanConfig.end || 254}
                  </div>
                </div>
                <button
                  onClick={() => removePrefix(prefix)}
                  className="px-3 py-1 rounded border border-red-500/50 text-red-300 hover:bg-red-500/10"
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/60">IP Início</label>
            <input
              type="number"
              value={scanConfig.start || 1}
              onChange={e => updateScanRange('start', e.target.value)}
              className="w-full px-2 py-1 bg-transparent border border-white/10 rounded"
            />
          </div>
          <div>
            <label className="text-xs text-white/60">IP Fim</label>
            <input
              type="number"
              value={scanConfig.end || 254}
              onChange={e => updateScanRange('end', e.target.value)}
              className="w-full px-2 py-1 bg-transparent border border-white/10 rounded"
            />
          </div>
          <div>
            <label className="text-xs text-white/60">Protocolo</label>
            <select
              value={scanConfig.protocol || 'https'}
              onChange={e => updateScanRange('protocol', e.target.value)}
              className="w-full px-2 py-1 bg-transparent border border-white/10 rounded"
            >
              <option value="https">HTTPS</option>
              <option value="http">HTTP</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60">Concorrência</label>
            <input
              type="number"
              value={scanConfig.concurrency || 15}
              onChange={e => updateScanRange('concurrency', e.target.value)}
              className="w-full px-2 py-1 bg-transparent border border-white/10 rounded"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="scan-enabled"
            checked={scanConfig.enabled || false}
            onChange={e => updateScanRange('enabled', e.target.checked)}
          />
          <label htmlFor="scan-enabled" className="text-sm">
            Ativar varredura automática
          </label>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Configurações Gerais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Auto-refresh (segundos)</label>
            <input type="number" value={localAuto} onChange={e => setLocalAuto(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Limiar (consumíveis %)</label>
            <input type="number" value={localThreshold} onChange={e => setLocalThreshold(e.target.value)} />
          </div>
        </div>
        <button onClick={save} className="mt-3 px-3 py-2 rounded border border-white/6">
          Salvar
        </button>
      </div>

      <div className="card p-4">
        <h4 className="font-semibold mb-3">Scan Rápido</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="w-28"
          />
          <button onClick={triggerLimited} className="px-3 py-2 rounded border border-white/6">
            Iniciar
          </button>
        </div>
      </div>

      <div className="card p-4">
        <h4 className="font-semibold mb-3">Importar / Exportar</h4>
        <div className="flex items-center gap-2">
          <button onClick={exportPrinters} className="px-3 py-2 rounded border border-white/6">
            Exportar printers.json
          </button>
          <input
            aria-label="Importar printers.json"
            type="file"
            accept="application/json"
            onChange={e => importPrintersFile(e.target.files && e.target.files[0])}
          />
        </div>
      </div>
    </div>
  )
}
