import React from 'react'
import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

export default function ConsumptionTrend({ series }) {
    // series: [{ts, data: {devices: [...]}}, ...]
    // We want to calculate average supply level across all devices for each timestamp

    let labels = []
    let dataPoints = []

    if (series && series.length) {
        // Sort chronological
        const sorted = series.slice().sort((a, b) => new Date(a.ts) - new Date(b.ts))

        labels = sorted.map(r => new Date(r.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

        dataPoints = sorted.map(r => {
            const devs = (r.data && r.data.devices) || []
            if (!devs.length) return 0

            const totalLevel = devs.reduce((acc, d) => {
                if (!d.supplies || !d.supplies.length) return acc
                // Average of this device's supplies
                const devAvg = d.supplies.reduce((sum, s) => {
                    const val = parseFloat((s.level || '').toString().replace('%', '')) || 0
                    return sum + val
                }, 0) / d.supplies.length
                return acc + devAvg
            }, 0)

            return totalLevel / devs.length
        })
    } else {
        // Mock data for display if no series
        labels = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
        dataPoints = [65, 64, 63, 63, 62, 60]
    }

    const data = {
        labels,
        datasets: [
            {
                fill: true,
                label: 'Nível Médio de Suprimentos (%)',
                data: dataPoints,
                borderColor: '#8b5cf6', // violet-500
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#8b5cf6'
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#ddd',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                ticks: { color: 'rgba(255,255,255,0.5)' }
            },
            y: {
                min: 0,
                max: 100,
                grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                ticks: { color: 'rgba(255,255,255,0.5)' }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    }

    return (
        <div className="w-full h-full min-h-[250px]">
            <Line data={data} options={options} />
        </div>
    )
}
