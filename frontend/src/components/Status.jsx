import React, { useEffect, useState } from 'react'
import ProgressModal from './ProgressModal'
import CustomCard from './CustomCard'
import CustomButton from './CustomButton'

export default function Status({ data }) {
  const [serverInfo, setServerInfo] = useState(null)
  const [latency, setLatency] = useState(null)
  const [collecting, setCollecting] = useState(false)

  const devices = (data && data.devices) || []
  const total = devices.length
  const ok = devices.filter(d => d.status === 'ok').length
  const err = total - ok
  const lastRun = data && data.lastRun

  useEffect(() => {
    let mounted = true
    async function loadServerInfo() {
      try {
        const start = Date.now()
        const res = await fetch('/api/server/info')
        const end = Date.now()
        const json = await res.json()
        if (mounted && json.ok) {
          setServerInfo(json)
          setLatency(Math.round(end - start))
        }
      } catch (e) {
        console.error('Failed to load info', e)
      }
    }
    loadServerInfo()
    const interval = setInterval(loadServerInfo, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  const formatUptime = (seconds) => {
    if (!seconds) return '--'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 B'
    try {
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      if (i < 0) return '0 B'
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + (sizes[i] || 'B')
    } catch (e) { return 'Error' }
  }

  const triggerCollection = async () => {
    setCollecting(true)
    try {
      const res = await fetch('/api/collect', { method: 'POST' })
      if (res.ok) {
        window.location.reload()
      } else {
        console.error('Failed to trigger collection')
        alert('Falha ao iniciar a coleta de dados.')
      }
    } catch (e) {
      console.error('Error triggering collection', e)
      alert('Erro ao comunicar com o servidor para iniciar a coleta.')
    } finally {
      setCollecting(false)
    }
  }

  const manufacturerStats = devices.reduce((acc, dev) => {
    // Try to guess manufacturer from name if not explicit
    let name = dev.manufacturer || 'Outros';
    if (name === 'Outros') {
      const parts = (dev.name || '').split(' ');
      if (parts.length > 0) name = parts[0];
    }
    // Clean up common names
    name = name.toUpperCase().replace(/[^A-Z]/g, '');
    if (name.includes('HP') || name.includes('HEWLETT')) name = 'HP';
    else if (name.includes('LEXMARK')) name = 'LEXMARK';
    else if (name.includes('BROTHER')) name = 'BROTHER';
    else if (name.includes('EPSON')) name = 'EPSON';
    else if (name.includes('RICOH')) name = 'RICOH';
    else name = 'OUTROS';

    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const returnIp = serverInfo?.system?.network?.ip || '127.0.0.1';

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Status do Sistema</h2>
          <div className="text-sm text-white/60">Monitoramento Completo de Infraestrutura</div>
        </div>
        <div className="flex gap-3">
          <CustomButton onClick={() => window.location.reload()} icon="refresh" variant="secondary">
            Recarregar
          </CustomButton>
          <CustomButton onClick={triggerCollection} icon="sync" variant="primary">
            Coletar Agora
          </CustomButton>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomCard className="p-4 flex flex-col items-center justify-center text-center" variant="glass">
          <span className="mi text-3xl text-cyan-400 mb-2">dns</span>
          <div className="text-2xl font-bold">{serverInfo ? formatUptime(serverInfo.uptime) : '--'}</div>
          <div className="text-xs text-white/50">Tempo de Atividade</div>
        </CustomCard>

        <CustomCard className="p-4 flex flex-col items-center justify-center text-center" variant="glass">
          <span className={`mi text-3xl mb-2 ${latency !== null && latency < 100 ? 'text-green-400' : 'text-yellow-400'}`}>speed</span>
          <div className="text-2xl font-bold">{latency !== null ? `${latency}ms` : '--'}</div>
          <div className="text-xs text-white/50">Latência de Rede</div>
        </CustomCard>

        <CustomCard className="p-4 flex flex-col items-center justify-center text-center" variant="glass">
          <span className="mi text-3xl text-purple-400 mb-2">router</span>
          <div className="text-2xl font-bold cursor-help" title={`MAC: ${serverInfo?.system?.network?.mac || '?'}`}>
            {returnIp}
          </div>
          <div className="text-xs text-white/50">IP do Servidor</div>
        </CustomCard>

        <CustomCard className="p-4 flex flex-col items-center justify-center text-center" variant="glass">
          <span className="mi text-3xl text-blue-400 mb-2">developer_board</span>
          <div className="text-2xl font-bold">
            {serverInfo?.system ? `${serverInfo.system.loadavg[0].toFixed(2)}` : '--'}
          </div>
          <div className="text-xs text-white/50">Carga da CPU (1min)</div>
        </CustomCard>
      </div>

      {/* Detailed Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-6">
          <CustomCard title="Composição da Frota" icon="pie_chart">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(manufacturerStats).map(([name, count]) => (
                <div key={name} className="p-3 bg-white/5 rounded border border-white/5 flex flex-col items-center">
                  <span className="text-xs text-white/50 font-bold mb-1">{name}</span>
                  <span className="text-xl font-bold">{count}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-white/40 text-center">
              Detectado via nomes de host e protocolos de descoberta
            </div>
          </CustomCard>

          <CustomCard title="Resumo de Saúde" icon="analytics">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                <div className="text-3xl font-bold mb-1">{total}</div>
                <div className="text-xs text-white/50 uppercase tracking-wider">Total</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">{ok}</div>
                <div className="text-xs text-green-400/50 uppercase tracking-wider font-bold">Online</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">{err}</div>
                <div className="text-xs text-red-400/50 uppercase tracking-wider font-bold">Erro</div>
              </div>
            </div>
          </CustomCard>

          <CustomCard title="Acesso Rápido" icon="link">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => window.location.href = '#/alerts'} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition flex flex-col items-center justify-center gap-2 group">
                <span className="mi text-2xl text-yellow-400 group-hover:scale-110 transition">notifications</span>
                <span className="text-sm font-semibold">Alertas</span>
              </button>
              <button onClick={() => window.location.href = '#/inventory'} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition flex flex-col items-center justify-center gap-2 group">
                <span className="mi text-2xl text-cyan-400 group-hover:scale-110 transition">inventory_2</span>
                <span className="text-sm font-semibold">Inventário</span>
              </button>
              <button onClick={() => window.location.href = '#/settings'} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition flex flex-col items-center justify-center gap-2 group">
                <span className="mi text-2xl text-white/80 group-hover:scale-110 transition">settings</span>
                <span className="text-sm font-semibold">Configurações</span>
              </button>
            </div>
          </CustomCard>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <CustomCard title="Especificações do Servidor" icon="memory">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/60">Hostname</span>
                <span className="font-mono text-cyan-400">{serverInfo?.system?.hostname || '--'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/60">Modelo CPU</span>
                <div className="text-right">
                  <span className="font-mono text-xs block text-white/80 max-w-[150px] truncate" title={serverInfo?.system?.cpuModel}>
                    {serverInfo?.system?.cpuModel || '--'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/60">Núcleos</span>
                <span className="font-mono">{serverInfo?.system?.cpus || 1} vCPUs</span>
              </div>

              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/60">IP Principal</span>
                <span className="font-mono">{serverInfo?.system?.network?.ip}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/60">MAC Address</span>
                <span className="font-mono text-[10px]">{serverInfo?.system?.network?.mac}</span>
              </div>

              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/60">Memória Física</span>
                <span className="font-mono">{serverInfo?.system ? formatBytes(serverInfo.system.totalmem) : '--'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/60">Ambiente</span>
                <span className={`font-mono ${serverInfo?.env === 'production' ? 'text-green-400' :
                    serverInfo?.env === 'Localhost' ? 'text-cyan-400' : 'text-yellow-400'
                  }`}>
                  {serverInfo?.env || '...'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/60">Livre</span>
                <span className="font-mono text-green-400">{serverInfo?.system ? formatBytes(serverInfo.system.freemem) : '--'}</span>
              </div>

              <div className="flex justify-between items-center text-sm pt-1">
                <span className="text-white/60">Plataforma</span>
                <span className="font-mono">{serverInfo?.system?.platform} {serverInfo?.system?.release}</span>
              </div>
            </div>
          </CustomCard>
        </div>
      </div>

      <ProgressModal
        open={collecting}
        title="Coletando Dados"
        message="Executando scan de rede..."
        estimatedSeconds={devices.length * 0.5 + 5}
        onClose={() => setCollecting(false)}
      />
    </div >
  )
}
