import React, { useEffect, useState } from 'react'

export default function Support() {
  const [serverInfo, setServerInfo] = useState(null)

  useEffect(() => {
    async function loadServerInfo() {
      try {
        const res = await fetch('/api/server/info')
        const json = await res.json()
        if (json.ok) setServerInfo(json)
      } catch (e) {
        console.error('Failed to load server info:', e)
      }
    }
    loadServerInfo()
  }, [])

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (60 * 60 * 24))
    const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60))
    const mins = Math.floor((seconds % (60 * 60)) / 60)
    return `${days}d ${hours}h ${mins}m`
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-lg font-semibold">Suporte</h2>
        <div className="text-sm text-white/60 mt-2">Informações úteis e contato</div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Informações do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-white/3 rounded">
            <div className="text-xs text-white/60">Versão</div>
            <div className="font-semibold">{serverInfo?.version || 'N/A'}</div>
          </div>
          <div className="p-3 bg-white/3 rounded">
            <div className="text-xs text-white/60">Tempo Online</div>
            <div className="font-semibold">{serverInfo?.uptime ? formatUptime(serverInfo.uptime) : 'N/A'}</div>
          </div>
          <div className="p-3 bg-white/3 rounded">
            <div className="text-xs text-white/60">Node.js</div>
            <div className="font-semibold">{serverInfo?.nodeVersion || 'N/A'}</div>
          </div>
          <div className="p-3 bg-white/3 rounded">
            <div className="text-xs text-white/60">Última Coleta</div>
            <div className="font-semibold text-xs">
              {serverInfo?.lastCollection ? new Date(serverInfo.lastCollection).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Recursos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-white/3 rounded">
            <div className="font-semibold">API Endpoints</div>
            <div className="text-xs text-white/60 mt-1">
              <div>GET /api/status - Status dos dispositivos</div>
              <div>GET /api/alerts/history - Histórico de alertas</div>
              <div>POST /api/collect - Coletar dados manualmente</div>
              <div>GET /api/server/info - Informações do servidor</div>
            </div>
          </div>
          <div className="p-3 bg-white/3 rounded">
            <div className="font-semibold">Contato</div>
            <div className="text-xs text-white/60 mt-1">
              <div>Email: admin@empresa.local</div>
              <div>Suporte TI: (11) 1234-5678</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Resolução de Problemas</h3>
        <div className="space-y-2 text-sm">
          <details className="p-3 bg-white/3 rounded">
            <summary className="cursor-pointer font-medium">Dispositivos não aparecem</summary>
            <div className="text-xs text-white/60 mt-2">
              Verifique se a coleta automática está ativa (a cada 30 min). Você pode forçar uma coleta manual na página de configurações.
            </div>
          </details>
          <details className="p-3 bg-white/3 rounded">
            <summary className="cursor-pointer font-medium">Dados desatualizados</summary>
            <div className="text-xs text-white/60 mt-2">
              Use o botão "Atualizar" em cada página. A atualização automática ocorre a cada 30 segundos no frontend.
            </div>
          </details>
          <details className="p-3 bg-white/3 rounded">
            <summary className="cursor-pointer font-medium">Alertas não funcionam</summary>
            <div className="text-xs text-white/60 mt-2">
              Verifique se o threshold está configurado em printers.json. O padrão é 15%.
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
