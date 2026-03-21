import { useState, useMemo } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '../../context/AppContext'
import { Card, Badge } from '../../components/ui'
import { formatMXN, formatMXNShort, CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_COLORS, type CategoryId } from '../../types'

const PAGE_SIZE = 10

export default function Analisis() {
  const { transactions, accounts } = useApp()
  const [filter, setFilter] = useState<'todos' | 'ingreso' | 'gasto'>('todos')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 7)
  })()

  const monthTx  = transactions.filter(t => t.date.startsWith(currentMonth))
  const lastMonthTx = transactions.filter(t => t.date.startsWith(lastMonth))

  const kpis = useMemo(() => {
    const ingresos  = monthTx.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
    const gastos    = monthTx.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
    const ahorro    = ingresos - gastos
    const tasa      = ingresos > 0 ? ahorro / ingresos : 0
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

    const prevIngresos = lastMonthTx.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
    const prevGastos   = lastMonthTx.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)

    return { ingresos, gastos, ahorro, tasa, totalBalance, prevIngresos, prevGastos }
  }, [monthTx, lastMonthTx, accounts])

  // Category distribution
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    monthTx.filter(t => t.type === 'gasto').forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + t.amount
    })
    return Object.entries(map)
      .map(([cat, total]) => ({ name: CATEGORY_LABELS[cat as CategoryId], value: total, color: CATEGORY_COLORS[cat as CategoryId], icon: CATEGORY_ICONS[cat as CategoryId] }))
      .sort((a, b) => b.value - a.value)
  }, [monthTx])

  // Monthly comparison (last 3 months)
  const monthlyCompare = [
    { month: 'Ene', ingresos: 37000, gastos: 29000 },
    { month: 'Feb', ingresos: 40800, gastos: 32500 },
    { month: 'Mar', ingresos: kpis.ingresos, gastos: kpis.gastos },
  ]

  // Filtered transactions
  const filtered = useMemo(() =>
    transactions
      .filter(t => filter === 'todos' || t.type === filter)
      .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, filter, search]
  )
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const delta = (current: number, prev: number) => {
    if (!prev) return 0
    return ((current - prev) / prev) * 100
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Análisis</h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 mt-0.5">Panel de rendimiento financiero</p>
        </div>
        <button className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-btn text-sm font-medium cursor-pointer hover:bg-primary-hover transition-colors">
          <span className="material-symbols-outlined text-lg">download</span> Exportar PDF
        </button>
      </div>

      {/* 5 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Balance total',  value: kpis.totalBalance, prev: null,             color: 'text-primary',  icon: 'account_balance' },
          { label: 'Ingresos',       value: kpis.ingresos,     prev: kpis.prevIngresos, color: 'text-success',  icon: 'trending_up'     },
          { label: 'Gastos',         value: kpis.gastos,       prev: kpis.prevGastos,  color: 'text-danger',   icon: 'trending_down'   },
          { label: 'Ahorro',         value: kpis.ahorro,       prev: null,             color: 'text-primary',  icon: 'savings'         },
          { label: 'Tasa ahorro',    value: null, pct: kpis.tasa, prev: null,          color: 'text-warning',  icon: 'percent'         },
        ].map(k => {
          const d = k.prev !== null ? delta(k.value ?? 0, k.prev) : null
          return (
            <Card key={k.label} padding={false} className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-light-text-2 dark:text-dark-text-2 mb-2">{k.label}</p>
              <p className={`text-xl font-bold tabular-nums ${k.color}`}>
                {k.pct !== undefined ? `${(k.pct * 100).toFixed(1)}%` : formatMXNShort(k.value!)}
              </p>
              {d !== null && (
                <div className={`flex items-center gap-0.5 mt-1 text-xs font-medium ${d >= 0 ? 'text-success' : 'text-danger'}`}>
                  <span className="material-symbols-outlined text-sm">{d >= 0 ? 'trending_up' : 'trending_down'}</span>
                  {Math.abs(d).toFixed(1)}%
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bar chart comparativo */}
        <Card className="lg:col-span-8">
          <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">Flujo de caja mensual</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyCompare} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.3} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--chart-label)' }} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: 'var(--chart-label)' }} />
              <Tooltip formatter={(v: number, name: string) => [formatMXN(v), name === 'ingresos' ? 'Ingresos' : 'Gastos']} />
              <Legend />
              <Bar dataKey="ingresos" fill="#2563EB" radius={[4, 4, 0, 0]} animationDuration={600} />
              <Bar dataKey="gastos"   fill="#E2E8F0" radius={[4, 4, 0, 0]} animationDuration={600} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Donut gastos por categoría */}
        <Card className="lg:col-span-4">
          <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">Gastos por categoría</h3>
          <div className="flex justify-center mb-4">
            <PieChart width={160} height={160}>
              <Pie data={categoryData} cx={80} cy={80} innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value" animationDuration={600}>
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2">
            {categoryData.slice(0, 5).map(c => (
              <div key={c.name} className="flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="flex-1 text-light-text dark:text-dark-text truncate">{c.name}</span>
                <span className="tabular-nums font-medium text-light-text dark:text-dark-text">{formatMXNShort(c.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transactions table */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-light-border dark:border-dark-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h3 className="font-semibold text-light-text dark:text-dark-text">Transacciones</h3>
            <div className="flex-1 sm:max-w-xs relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted text-lg">search</span>
              <input
                value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
                placeholder="Buscar..."
                className="w-full pl-9 pr-4 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-btn text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div className="flex gap-1.5">
              {(['todos', 'ingreso', 'gasto'] as const).map(f => (
                <button key={f} onClick={() => { setFilter(f); setPage(0) }}
                  className={`px-3 py-1.5 rounded-btn text-xs font-bold capitalize cursor-pointer transition-colors border ${
                    filter === f
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-light-surface dark:bg-dark-surface text-light-text-2 dark:text-dark-text-2 border-light-border dark:border-dark-border'
                  }`}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-light-surface dark:bg-dark-surface text-light-text-2 dark:text-dark-text-2 text-xs font-bold uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Transacción</th>
                <th className="px-5 py-3 text-left hidden sm:table-cell">Categoría</th>
                <th className="px-5 py-3 text-left hidden md:table-cell">Fecha</th>
                <th className="px-5 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {paginated.map(tx => (
                <tr key={tx.id} className="hover:bg-light-surface dark:hover:bg-dark-surface transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-btn flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${CATEGORY_COLORS[tx.category]}20` }}>
                        <span className="material-symbols-outlined text-lg" style={{ color: CATEGORY_COLORS[tx.category] }}>
                          {CATEGORY_ICONS[tx.category]}
                        </span>
                      </div>
                      <p className="font-medium text-light-text dark:text-dark-text truncate max-w-[180px]">{tx.description}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <Badge variant={tx.type === 'ingreso' ? 'success' : 'neutral'}>
                      {CATEGORY_LABELS[tx.category]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-light-text-2 dark:text-dark-text-2 hidden md:table-cell">
                    {new Date(tx.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className={`px-5 py-3 text-right font-bold tabular-nums ${tx.type === 'ingreso' ? 'text-success' : 'text-danger'}`}>
                    {tx.type === 'ingreso' ? '+' : '-'}{formatMXNShort(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-light-border dark:border-dark-border">
          <p className="text-sm text-light-text-2 dark:text-dark-text-2">
            {filtered.length} transacciones · Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-btn bg-light-surface dark:bg-dark-surface text-light-muted dark:text-dark-muted disabled:opacity-40 cursor-pointer hover:bg-light-border dark:hover:bg-dark-border transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-btn bg-light-surface dark:bg-dark-surface text-light-muted dark:text-dark-muted disabled:opacity-40 cursor-pointer hover:bg-light-border dark:hover:bg-dark-border transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
