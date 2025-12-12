import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import CustomSelect from './CustomSelect'
import CustomInput from './CustomInput'

export default function Devices({ data, pushToast, threshold, searchRef }) {
  const [loading, setLoading] = useState(false)
  const [devices, setDevices] = useState([])

  useEffect(() => {
    if (data && data.devices) {
      setDevices(data.devices)
    }
  }, [data])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterSupplyLevel, setFilterSupplyLevel] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [sortBy, setSortBy] = useState('name')

  function getId(d) {
    return (d.deviceIp || d.url || d.deviceName || d.name || '').toString()
  }

  function getMuted() {
    try { return JSON.parse(localStorage.getItem('monitor.muted') || '[]') } catch (e) { return [] }
  }
  function toggleMuted(id) {
    try {
      const m = getMuted()
      const idx = m.indexOf(id)
      if (idx === -1) m.push(id)
      else m.splice(idx, 1)
      localStorage.setItem('monitor.muted', JSON.stringify(m))
      // force re-render
      setDevices(d => [...d])
    } catch (e) { console.error(e) }
  }

  function getFavs() {
    try { return JSON.parse(localStorage.getItem('monitor.favs') || '[]') } catch (e) { return [] }
  }
  function toggleFav(id) {
    try {
      const f = getFavs()
      const idx = f.indexOf(id)
      if (idx === -1) f.push(id)
      else f.splice(idx, 1)
      localStorage.setItem('monitor.favs', JSON.stringify(f))
      setDevices(d => [...d])
    } catch (e) { console.error(e) }
  }

  function formatSuppliesShort(supplies) {
    if (!supplies || !supplies.length) return ''
    const map = { 'Preto': 'P', 'Ciano': 'C', 'Magenta': 'M', 'Amarelo': 'A', 'Black': 'P', 'Cyan': 'C', 'Yellow': 'A' }
    return supplies.map(s => {
      const name = s.name || ''
      const key = map[name] || name.charAt(0).toUpperCase()
      const level = s.level || ''
      return `${key}:${level}`
    }).join(' ')
  }

  function getInventoryQty(name) {
    try {
      const raw = localStorage.getItem('monitor.inventory')
      if (!raw) return 0
      const inv = JSON.parse(raw)
      const found = (inv || []).find(i => (i.name || '').toLowerCase() === (name || '').toLowerCase())
      return found ? Number(found.qty) : 0
    } catch (e) { return 0 }
  }

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/status')
      const j = await res.json()
      setDevices(j.devices || [])
    } catch (e) { pushToast({ title: 'Erro', msg: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function pingDevice(d) {
    const url = encodeURIComponent(d.deviceIp || d.url || d.name)
    try {
      const res = await fetch(`/api/ping?url=${url}`)
      const j = await res.json()
      const meta = { deviceId: getId(d) }
      if (j.ok) { pushToast({ title: 'Ping OK', msg: `${d.deviceName || d.name}: ${j.device && j.device.machineStatus || 'OK'}`, meta }) }
      else { pushToast({ title: 'Ping falhou', msg: `${d.deviceName || d.name}: ${j.error}`, type: 'error', meta }) }
    } catch (e) { pushToast({ title: 'Erro', msg: e.message, type: 'error' }) }
  }

  function openPanel(d) {
    const host = (d.deviceIp || d.url || d.name || '').replace(/^https?:\/\//, '')
    // try https first
    const tryUrls = [`https://${host}`, `http://${host}`]
    // open in new tab the https URL (user can change protocol if needed)
    window.open(tryUrls[0], '_blank')
  }

  function exportVisible() {
    const rows = [['name', 'ip', 'status', 'supplies', 'timestamp']]
    const list = filteredList()
    for (const d of list) {
      rows.push([d.deviceName || d.name || '', d.deviceIp || d.url || '', d.status || '', (d.supplies || []).map(s => `${s.name}:${s.level || ''}`).join(';'), d.timestamp || ''])
    }
    const csv = rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'devices.csv'; a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  function filteredList() {
    const searchQuery = searchRef?.current?.value?.toLowerCase() || ''
    const favs = getFavs()

    return devices.filter(d => {
      // Search filter
      if (searchQuery) {
        const matchesName = (d.deviceName || d.name || '').toLowerCase().includes(searchQuery)
        const matchesIp = (d.deviceIp || d.url || '').toLowerCase().includes(searchQuery)
        if (!matchesName && !matchesIp) return false
      }

      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'ok' && d.status !== 'ok') return false
        if (filterStatus === 'error' && d.status === 'ok') return false
      }

      // Type filter
      if (filterType !== 'all') {
        if ((d.type || '').toLowerCase() !== filterType) return false
      }

      // Supply level filter
      if (filterSupplyLevel !== 'all' && d.supplies && d.supplies.length > 0) {
        const hasSupplyInRange = d.supplies.some(s => {
          const level = parseFloat((s.level || '').toString().replace('%', '')) || 0
          if (filterSupplyLevel === 'critical') return level < 10
          if (filterSupplyLevel === 'low') return level >= 10 && level < 30
          if (filterSupplyLevel === 'medium') return level >= 30 && level < 70
          if (filterSupplyLevel === 'high') return level >= 70
          return true
        })
        if (!hasSupplyInRange) return false
      }

      // Location filter
      if (filterLocation !== 'all') {
        if ((d.location || '') !== filterLocation) return false
      }

      // Favorites filter
      if (filterFavorites) {
        const id = getId(d)
        if (!favs.includes(id)) return false
      }

      return true
    }).sort((a, b) => {
      if (sortBy === 'name') return ('' + (a.deviceName || a.name || '')).localeCompare(b.deviceName || b.name || '')
      if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '')
      return 0
    })
  }

  // Get unique locations for filter
  const uniqueLocations = [...new Set(devices.map(d => d.location).filter(Boolean))]

  const list = filteredList()
  const start = (page - 1) * pageSize
  const pageItems = list.slice(start, start + pageSize)
  const totalPages = Math.max(1, Math.ceil((devices.length || 0) / pageSize))
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailDevice, setDetailDevice] = useState(null)
  const [detailHistory, setDetailHistory] = useState(null)
  const [showFullHistory, setShowFullHistory] = useState(false)

  return (
    <div>
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dispositivos</h2>
          <div className="text-sm text-white/60">Lista de impressoras detectadas na rede</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="px-3 py-2 rounded border border-white/6">Atualizar</button>
          <button onClick={exportVisible} className="px-3 py-2 rounded border border-white/6">Exportar visíveis</button>
        </div>
      </div>

      <div className="card mb-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Filtros Avançados</h3>
          <button
            onClick={() => {
              setFilterStatus('all')
              setFilterType('all')
              setFilterSupplyLevel('all')
              setFilterLocation('all')
              setFilterFavorites(false)
            }}
            className="px-3 py-1.5 text-sm rounded border border-white/10 hover:bg-white/5 transition"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CustomSelect
            label="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            icon="info"
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'ok', label: 'Online', icon: 'check_circle' },
              { value: 'error', label: 'Offline', icon: 'error' }
            ]}
          />

          <CustomSelect
            label="Tipo"
            value={filterType}
            onChange={setFilterType}
            icon="print"
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'color', label: 'Colorida', icon: 'palette' },
              { value: 'mono', label: 'Monocromática', icon: 'filter_b_and_w' }
            ]}
          />

          <CustomSelect
            label="Nível de Consumível"
            value={filterSupplyLevel}
            onChange={setFilterSupplyLevel}
            icon="battery_alert"
            searchable={false}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'critical', label: 'Crítico (< 10%)', icon: 'report' },
              { value: 'low', label: 'Baixo (10-30%)', icon: 'warning' },
              { value: 'medium', label: 'Médio (30-70%)', icon: 'info' },
              { value: 'high', label: 'Alto (> 70%)', icon: 'check_circle' }
            ]}
          />

          <CustomSelect
            label="Localização"
            value={filterLocation}
            onChange={setFilterLocation}
            icon="location_on"
            searchable={true}
            options={[
              { value: 'all', label: 'Todas' },
              ...uniqueLocations.map(loc => ({ value: loc, label: loc, icon: 'place' }))
            ]}
          />
        </div>

        <div className="flex gap-4 mt-4">
          <CustomSelect
            label="Ordenar Por"
            value={sortBy}
            onChange={setSortBy}
            icon="sort"
            options={[
              { value: 'name', label: 'Nome', icon: 'text_fields' },
              { value: 'status', label: 'Status', icon: 'signal_cellular_alt' }
            ]}
          />

          <div className="flex items-end">
            <button
              onClick={() => setFilterFavorites(!filterFavorites)}
              className={`px-4 py-2.5 rounded border transition ${filterFavorites
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                : 'border-white/10 hover:bg-white/5'
                }`}
            >
              <span className="flex items-center gap-2">
                <span className="mi">{filterFavorites ? 'star' : 'star_border'}</span>
                <span className="text-sm">Apenas Favoritos</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        {loading && <div className="p-6">Carregando...</div>}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 p-4 space-y-4">
          {!loading && pageItems.map((d, idx) => {
            const id = getId(d)
            const fav = getFavs().includes(id)
            const muted = getMuted().includes(id)
            const isMono = ((d.type || '').toLowerCase().includes('mono')) || ((d.deviceName || '').toLowerCase().includes('mono'))
            const statusColor = d.status === 'ok' ? 'green' : 'red'
            return (
              <div key={id || idx} className={`relative p-4 rounded-xl border border-white/10 bg-white/5 overflow-hidden group hover:border-white/20 transition-all hover:bg-white/10 break-inside-avoid mb-4`}>
                <div className={`absolute top-0 left-0 w-1 h-full bg-${statusColor}-500`}></div>

                {/* Header */}
                <div className="flex items-start justify-between gap-3 pl-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl shadow-inner" aria-hidden>
                      {isMono ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                          <rect x="3" y="6" width="18" height="10" rx="2" fill="currentColor" />
                          <rect x="7" y="11" width="10" height="3" rx="1" fill="#08101a" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                          <rect x="3" y="4" width="18" height="12" rx="2" fill="currentColor" />
                          <circle cx="8" cy="16" r="1.6" fill="#ef4444" />
                          <circle cx="12" cy="16" r="1.6" fill="#f59e0b" />
                          <circle cx="16" cy="16" r="1.6" fill="#06b6d4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-base leading-tight">{d.deviceName || d.name}</div>
                      <div className="text-xs text-white/50 font-mono mt-1">{d.deviceIp || d.url}</div>
                      {d.location && (
                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-cyan-300/80 mt-1.5 font-semibold">
                          <span className="mi text-xs">place</span> {d.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFav(id); }}
                      className={`text-lg transition-colors ${fav ? 'text-yellow-400' : 'text-white/20 hover:text-white/50'}`}
                      title={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <span className="mi">{fav ? 'star' : 'star_border'}</span>
                    </button>
                    {muted && <span className="mi text-white/40 text-sm" title="Silenciado">notifications_off</span>}
                  </div>
                </div>

                {/* Supplies */}
                <div className="pl-3 mb-4 space-y-3">
                  {(d.supplies || []).length === 0 ? (
                    <div className="p-3 rounded bg-white/5 text-xs text-center text-white/40 italic">
                      Sem dados de consumíveis
                    </div>
                  ) : (
                    (d.supplies || []).map((s, si) => {
                      const raw = (s.level || '').toString().replace('%', '')
                      const pct = Math.max(0, Math.min(100, parseFloat(raw) || 0))
                      const inv = getInventoryQty(s.name)
                      const colorClass = pct > 30 ? 'bg-green-500' : (pct > 10 ? 'bg-yellow-500' : 'bg-red-500')

                      return (
                        <div key={si} className="relative">
                          <div className="flex items-end justify-between text-xs mb-1">
                            <span className="font-medium text-white/80 truncate pr-2" title={s.name}>{s.name}</span>
                            <div className="flex items-center gap-2">
                              {inv > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50" title={`Estoque: ${inv}`}>📦 {inv}</span>}
                              <span className={pct < 10 ? 'text-red-400 font-bold' : 'text-white/70'}>{pct}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div style={{ width: `${pct}%` }} className={`h-full rounded-full ${colorClass} opacity-80 shadow-[0_0_10px_rgba(0,0,0,0.3)]`}></div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Footer / Actions */}
                <div className="pl-3 mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button onClick={() => pingDevice(d)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition" title="Testar Conexão">
                      <span className="mi text-lg">network_check</span>
                    </button>
                    <button onClick={() => openPanel(d)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition" title="Abrir Painel Web">
                      <span className="mi text-lg">language</span>
                    </button>
                    <button onClick={() => { const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = (d.deviceName || d.name || 'device') + '.json'; a.click(); a.remove(); URL.revokeObjectURL(url) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition" title="Exportar JSON">
                      <span className="mi text-lg">download</span>
                    </button>
                    <button onClick={() => toggleMuted(id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${muted ? 'text-red-400 bg-red-400/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`} title={muted ? 'Ativar Notificações' : 'Silenciar'}>
                      <span className="mi text-lg">{muted ? 'notifications_off' : 'notifications'}</span>
                    </button>
                  </div>

                  <button
                    onClick={async () => {
                      setDetailDevice(d)
                      setDetailOpen(true)
                      try { const h = JSON.parse(localStorage.getItem('monitor.detailsHistory') || '[]'); h.unshift({ id: getId(d), ts: new Date().toISOString(), name: d.deviceName || d.name }); localStorage.setItem('monitor.detailsHistory', JSON.stringify(h.slice(0, 100))); } catch (e) { }
                      try {
                        const res = await fetch('/api/history?limit=12')
                        const j = await res.json()
                        if (j.ok && j.rows) {
                          const arr = j.rows.map(r => {
                            const dev = (r.data && r.data.devices) ? (r.data.devices.find(x => (x.deviceIp || x.url || x.deviceName || x.name) === (d.deviceIp || d.url || d.deviceName || d.name))) : null
                            return { ts: r.ts, status: dev ? dev.status : 'missing' }
                          })
                          setDetailHistory(arr)
                        } else setDetailHistory(null)
                      } catch (e) { setDetailHistory(null) }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 transition flex items-center gap-2 group-hover:border-white/20"
                  >
                    Detalhes
                    <span className="mi text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between p-4 border-t border-white/5">
          <div className="text-sm text-white/50">Mostrando {pageItems.length} de {filteredList().length} dispositivos (Página {page} de {totalPages})</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 text-sm rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition">Anterior</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 text-sm rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition">Próxima</button>
          </div>
        </div>
      </div>

      <Modal open={detailOpen} title={detailDevice ? (detailDevice.deviceName || detailDevice.name) : 'Detalhes'} onClose={() => setDetailOpen(false)} footer={null}>
        {detailDevice && (
          <div className="space-y-6">

            {/* Header / Main Info */}
            <div className="flex items-start gap-5 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-20 h-20 rounded-2xl bg-black/20 flex items-center justify-center shrink-0">
                {(((detailDevice.deviceName || detailDevice.name) || '').toLowerCase().includes('mono')) ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/80">
                    <rect x="3" y="6" width="18" height="10" rx="2" fill="currentColor" />
                    <rect x="7" y="11" width="10" height="3" rx="1" fill="#08101a" />
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/80">
                    <rect x="3" y="4" width="18" height="12" rx="2" fill="currentColor" />
                    <circle cx="8" cy="16" r="1.6" fill="#ef4444" />
                    <circle cx="12" cy="16" r="1.6" fill="#f59e0b" />
                    <circle cx="16" cy="16" r="1.6" fill="#06b6d4" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold truncate pr-4">{detailDevice.deviceName || detailDevice.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${detailDevice.status === 'ok' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {detailDevice.status === 'ok' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div className="text-white/60 font-mono text-sm mt-1">{detailDevice.deviceIp || detailDevice.url}</div>

                <div className="flex flex-wrap gap-3 mt-4">
                  {detailDevice.location && (
                    <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-white/5 border border-white/5 text-white/70">
                      <span className="mi text-sm">place</span> {detailDevice.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-white/5 border border-white/5 text-white/70">
                    <span className="mi text-sm">print</span> {detailDevice.type || 'Tipo desc.'}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-white/5 border border-white/5 text-white/70">
                    <span className="mi text-sm">sell</span> {detailDevice.model || 'Modelo desc.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Supplies Section */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 h-full">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="mi text-cyan-400">opacity</span>
                  Níveis de Suprimento
                </h3>

                <div className="space-y-4">
                  {(detailDevice.supplies || []).length === 0 && <div className="text-sm text-white/40 italic text-center py-4">Nenhum dado disponível</div>}
                  {(detailDevice.supplies || []).map((s, si) => {
                    const raw = (s.level || '').toString().replace('%', '')
                    const pct = Math.max(0, Math.min(100, parseFloat(raw) || 0))
                    const inv = getInventoryQty(s.name)
                    const cls = pct > 30 ? 'bg-green-500' : (pct > 10 ? 'bg-yellow-500' : 'bg-red-500')

                    return (
                      <div key={si} className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{s.name}</span>
                          <div className="flex gap-2">
                            <button className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition" onClick={() => {
                              const note = window.prompt('Observação para manutenção:')
                              try {
                                const m = JSON.parse(localStorage.getItem('monitor.maintenance') || '[]')
                                m.unshift({ id: Date.now(), deviceId: getId(detailDevice), supply: s.name, note: note || '', ts: new Date().toISOString(), done: false })
                                localStorage.setItem('monitor.maintenance', JSON.stringify(m))
                                pushToast({ title: 'Agendado', msg: 'Manutenção criada', type: 'success' })
                              } catch (e) { }
                            }}>Manutenção</button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${cls} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className={`text-sm font-bold w-10 text-right ${pct < 20 ? 'text-red-400' : ''}`}>{pct}%</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                          <div className="flex items-center gap-2">
                            <span>Estoque: <b className="text-white">{inv}</b></span>
                            {inv > 0 && <button className="text-cyan-300 hover:text-cyan-200 underline" onClick={() => {
                              try {
                                const raw = JSON.parse(localStorage.getItem('monitor.inventory') || '[]')
                                const item = (raw || []).find(i => (i.name || '').toLowerCase() === (s.name || '').toLowerCase())
                                if (!item || Number(item.qty) <= 0) return
                                item.qty = Number(item.qty) - 1
                                localStorage.setItem('monitor.inventory', JSON.stringify(raw))
                                pushToast({ title: 'Estoque Atualizado', msg: `-1 ${s.name}`, type: 'success' })
                                setDetailDevice(d => ({ ...d }))
                              } catch (e) { }
                            }}>Usar 1</button>}
                          </div>
                          <button
                            onClick={() => {
                              try {
                                const key = JSON.stringify({ id: getId(detailDevice), supply: s.name })
                                const raw = JSON.parse(localStorage.getItem('monitor.reorder') || '[]')
                                const exists = (raw || []).some(r => r.id === getId(detailDevice) && (r.supply || '') === s.name)
                                if (!exists) { raw.push({ id: getId(detailDevice), supply: s.name, created: new Date().toISOString() }); localStorage.setItem('monitor.reorder', JSON.stringify(raw)); pushToast({ title: 'Auto-reorder', msg: 'Ativado', type: 'success' }) }
                                else { const nr = (raw || []).filter(r => !(r.id === getId(detailDevice) && (r.supply || '') === s.name)); localStorage.setItem('monitor.reorder', JSON.stringify(nr)); pushToast({ title: 'Auto-reorder', msg: 'Desativado', type: 'success' }) }
                              } catch (e) { }
                            }}
                            className={`${(JSON.parse(localStorage.getItem('monitor.reorder') || '[]') || []).some(r => r.id === getId(detailDevice) && (r.supply || '') === s.name) ? 'text-green-400' : 'text-white/30 hover:text-white/60'}`}
                            title="Auto-Reorder"
                          >
                            <span className="flex items-center gap-1"><span className="mi text-sm">autorenew</span> Auto</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Info & History */}
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <span className="mi text-purple-400">history</span>
                    Histórico de Status
                  </h3>
                  {detailHistory ? (
                    <div>
                      <div className="flex items-end gap-1 h-12 mb-4 px-2">
                        {detailHistory.slice(0, 20).reverse().map((h, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-sm ${h.status === 'ok' ? 'bg-green-500' : (h.status === 'missing' ? 'bg-white/10' : 'bg-red-500')}`}
                            style={{ height: h.status === 'ok' ? '100%' : '60%', opacity: 0.5 + (i / 40) }}
                            title={`${new Date(h.ts).toLocaleString()} - ${h.status}`}
                          ></div>
                        ))}
                      </div>
                      <div className="max-h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {detailHistory.map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/5">
                            <span className="font-mono text-white/60">{new Date(h.ts).toLocaleString()}</span>
                            <span className={`uppercase font-bold ${h.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{h.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <div className="text-center text-white/40 py-4">Carregando histórico...</div>}
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <span className="mi text-orange-400">build</span>
                    Ações
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-sm flex items-center justify-center gap-2 transition" onClick={() => pingDevice(detailDevice)}>
                      <span className="mi">network_check</span> Ping
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-sm flex items-center justify-center gap-2 transition" onClick={() => openPanel(detailDevice)}>
                      <span className="mi">open_in_new</span> Painel
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-sm flex items-center justify-center gap-2 transition col-span-2" onClick={() => setDetailOpen(false)}>
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
