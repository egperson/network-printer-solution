import React from 'react'

export default function ReliabilityTable({ devices, series }) {
    // Calculate reliability metrics per device based on history series
    // If no series, use current status as a simple snapshot

    const stats = React.useMemo(() => {
        if (!devices || !devices.length) return []

        return devices.map(d => {
            const id = d.deviceIp || d.url || d.deviceName || d.name
            let totalSamples = 0
            let uptimeSamples = 0
            let errors = 0

            if (series && series.length) {
                series.forEach(snap => {
                    if (snap.data && snap.data.devices) {
                        const match = snap.data.devices.find(x => (x.deviceIp || x.url || x.deviceName || x.name) === id)
                        if (match) {
                            totalSamples++
                            if (match.status === 'ok') uptimeSamples++
                            else errors++
                        }
                    }
                })
            }

            // Fallback if no history or only 1 sample
            if (totalSamples === 0) {
                totalSamples = 1
                if (d.status === 'ok') uptimeSamples = 1
                else errors = 1
            }

            const reliability = ((uptimeSamples / totalSamples) * 100).toFixed(1)

            return {
                ...d,
                reliability,
                errors,
                totalSamples
            }
        }).sort((a, b) => parseFloat(a.reliability) - parseFloat(b.reliability)) // Sort by least reliable first
    }, [devices, series])

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-sm text-white/50 border-b border-white/5">
                        <th className="py-2 px-3 font-medium">Dispositivo</th>
                        <th className="py-2 px-3 font-medium">IP / URL</th>
                        <th className="py-2 px-3 font-medium text-center">Confiabilidade</th>
                        <th className="py-2 px-3 font-medium text-center">Incidentes</th>
                        <th className="py-2 px-3 font-medium text-right">Status Atual</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {stats.slice(0, 10).map((d, i) => (
                        <tr key={i} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                            <td className="py-3 px-3 font-medium">
                                {d.deviceName || d.name}
                            </td>
                            <td className="py-3 px-3 text-white/60 font-mono text-xs">
                                {d.deviceIp || d.url}
                            </td>
                            <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${parseFloat(d.reliability) > 90 ? 'bg-green-500' : parseFloat(d.reliability) > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${d.reliability}%` }}
                                        />
                                    </div>
                                    <span className="text-xs w-8 text-right">{d.reliability}%</span>
                                </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                                {d.errors > 0 ? (
                                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-xs font-bold">{d.errors}</span>
                                ) : (
                                    <span className="text-white/20">-</span>
                                )}
                            </td>
                            <td className="py-3 px-3 text-right">
                                <span className={`inline-block w-2 h-2 rounded-full ${d.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                            </td>
                        </tr>
                    ))}
                    {stats.length === 0 && (
                        <tr>
                            <td colSpan="5" className="py-8 text-center text-white/40">
                                Nenhum dado disponível
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
