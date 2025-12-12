import React from 'react'

export default function TopIncidents({ devices }) {
    // Filter devices with issues
    const incidents = React.useMemo(() => {
        return (devices || [])
            .filter(d => d.status !== 'ok' || (d.supplies && d.supplies.some(s => {
                const val = parseFloat((s.level || '').toString().replace('%', '')) || 0
                return val < 5
            })))
            .map(d => {
                let type = 'error'
                let msg = 'Offline'

                if (d.status === 'ok') {
                    const lowSupply = d.supplies.find(s => (parseFloat((s.level || '').replace('%', '')) || 0) < 5)
                    if (lowSupply) {
                        type = 'warning'
                        msg = `${lowSupply.name} crítico`
                    }
                }

                return { ...d, issueType: type, issueMsg: msg }
            })
            .slice(0, 5) // Top 5
    }, [devices])

    if (incidents.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-white/40 py-8">
                <span className="mi text-4xl mb-2">check</span>
                <p className="text-sm">Sem incidentes ativos</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {incidents.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${d.issueType === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                        <span className="mi">{d.issueType === 'error' ? 'error_outline' : 'water_drop'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{d.deviceName || d.name}</div>
                        <div className="text-xs text-white/50 truncate font-mono">{d.deviceIp || d.url}</div>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded ${d.issueType === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {d.issueMsg}
                    </div>
                </div>
            ))}
        </div>
    )
}
