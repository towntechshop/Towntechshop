import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const BAR_COLOR = '#1D4ED8'
const BAR_HOVER = '#0B1F3A'

function dayKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-US')
}

// مبيعات كل يوم (الطلبات غير الملغية) — عمود لكل يوم مع تفاصيل عند الوقوف بالماوس
export default function DailySalesChart({ days = 30 }) {
  const [hoverIndex, setHoverIndex] = useState(null)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const start = new Date()
    start.setDate(start.getDate() - (days - 1))
    start.setHours(0, 0, 0, 0)

    supabase
      .from('orders')
      .select('created_at, total_amount, status')
      .gte('created_at', start.toISOString())
      .then(({ data }) => setOrders(data || []))
  }, [days])

  const series = useMemo(() => {
    const totals = new Map()
    orders
      .filter((order) => order.status !== 'cancelled')
      .forEach((order) => {
        const key = dayKey(order.created_at)
        const current = totals.get(key) || { revenue: 0, count: 0 }
        totals.set(key, {
          revenue: current.revenue + Number(order.total_amount || 0),
          count: current.count + 1,
        })
      })

    const result = []
    const today = new Date()
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
      const key = dayKey(date)
      result.push({ key, date, ...(totals.get(key) || { revenue: 0, count: 0 }) })
    }
    return result
  }, [orders, days])

  const maxRevenue = Math.max(...series.map((point) => point.revenue), 0)
  const total = series.reduce((sum, point) => sum + point.revenue, 0)
  const ordersCount = series.reduce((sum, point) => sum + point.count, 0)

  const width = 720
  const height = 220
  const padding = { top: 16, right: 8, bottom: 26, left: 8 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const slot = plotWidth / series.length
  const barWidth = Math.max(Math.min(slot - 2, 18), 3)
  const niceMax = maxRevenue > 0 ? maxRevenue * 1.1 : 1

  const gridLines = [0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: padding.top + plotHeight - ratio * plotHeight,
    value: Math.round(niceMax * ratio),
  }))

  const hovered = hoverIndex !== null ? series[hoverIndex] : null

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-950">المبيعات اليومية</h2>
          <p className="text-slate-500 text-sm font-bold mt-1">آخر {days} يوم — الطلبات غير الملغية</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-slate-500 font-bold">الإجمالي</p>
            <p className="text-lg font-black text-slate-950">{formatMoney(total)} ج</p>
          </div>
          <div>
            <p className="text-slate-500 font-bold">عدد الطلبات</p>
            <p className="text-lg font-black text-slate-950">{ordersCount}</p>
          </div>
        </div>
      </div>

      <div className="relative" dir="ltr">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          role="img"
          aria-label={`مبيعات آخر ${days} يوم، الإجمالي ${formatMoney(total)} جنيه`}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {gridLines.map((line) => (
            <g key={line.y}>
              <line x1={padding.left} x2={width - padding.right} y1={line.y} y2={line.y} stroke="#E2E8F0" strokeWidth="1" />
              <text x={width - padding.right} y={line.y - 4} textAnchor="end" fontSize="10" fill="#94A3B8">
                {formatMoney(line.value)}
              </text>
            </g>
          ))}
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + plotHeight}
            y2={padding.top + plotHeight}
            stroke="#CBD5E1"
            strokeWidth="1"
          />

          {series.map((point, index) => {
            const barHeight = maxRevenue > 0 ? (point.revenue / niceMax) * plotHeight : 0
            const x = padding.left + index * slot + (slot - barWidth) / 2
            const y = padding.top + plotHeight - barHeight
            const radius = Math.min(4, barWidth / 2, barHeight)
            const isHover = hoverIndex === index

            return (
              <g key={point.key} onMouseEnter={() => setHoverIndex(index)}>
                {/* منطقة تفاعل أكبر من العمود */}
                <rect x={padding.left + index * slot} y={padding.top} width={slot} height={plotHeight} fill="transparent" />
                {barHeight > 0 && (
                  <path
                    d={`M${x},${y + plotHeight - plotHeight + barHeight + 0} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + barWidth - radius} Q${x + barWidth},${y} ${x + barWidth},${y + radius} V${y + barHeight} Z`}
                    fill={isHover ? BAR_HOVER : BAR_COLOR}
                  />
                )}
                {(index % 5 === 0 || index === series.length - 1) && (
                  <text
                    x={x + barWidth / 2}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748B"
                  >
                    {point.date.getDate()}/{point.date.getMonth() + 1}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 bg-slate-950 text-white rounded-xl px-3 py-2 text-xs font-bold shadow-lg whitespace-nowrap"
            style={{ left: `${((hoverIndex + 0.5) / series.length) * 100}%` }}
            dir="rtl"
          >
            <p>{hovered.date.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
            <p className="text-sm font-black">{formatMoney(hovered.revenue)} جنيه</p>
            <p className="text-white/70">{hovered.count} طلب</p>
          </div>
        )}
      </div>
    </section>
  )
}
