import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { useDashboardKPIs, useRecentTransactions } from '../../hooks/useFinance'
import { Card, Badge, ProgressBar, GoalGauge } from '../../components/ui'
import {
  formatMXN, formatMXNShort, formatPercent,
  CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_COLORS,
  getBudgetStatus,
} from '../../types'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-card p-3 shadow-lg text-sm">
      {label && <p className="text-light-text-2 dark:text-dark-text-2 text-xs mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold tabular-nums text-light-text dark:text-dark-text">
          {formatMXN(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { accounts, budgets, goals, netWorthHistory, profile } = useApp()
  const kpis = useDashboardKPIs()
  const recent = useRecentTransactions(6)
  const [aiBannerOpen, setAiBannerOpen] = useState(true)

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const topGoal = useMemo(() =>
    [...goals].sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount))[0],
    [goals]
  )

  const chartData = useMemo(() =>
    netWorthHistory.slice(-6).map(n => ({
      month: n.month.slice(5),
      netWorth: n.netWorth,
    })),
    [netWorthHistory]
  )

  // Health badge
  const healthColor = kpis.porcentajeGastado < 0.7 ? 'success' : kpis.porcentajeGastado < 0.9 ? 'warning' : 'danger'
  const healthLabel = kpis.porcentajeGastado < 0.7 ? 'Salud financiera: Buena' : kpis.porcentajeGastado < 0.9 ? 'Atención' : 'Alerta'

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">
            {greeting}, {profile.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 italic">{today}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/alertas">
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:text-primary transition-all cursor-pointer">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="relative overflow-hidden group" padding={false}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="p-8 relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Balance total</p>
          <p className="text-5xl font-black tabular-nums tracking-tighter text-light-text dark:text-dark-text">
            {formatMXN(kpis.totalBalance)}
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Badge variant={healthColor}>{healthLabel}</Badge>
            <span className="text-[10px] text-light-text-2 dark:text-dark-text-2 font-bold uppercase tracking-wider">
              {accounts.filter(a => a.isActive).length} cuentas activas
            </span>
          </div>
        </div>
        {/* Sparkline */}
        <div className="h-28 px-0 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2965ff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#2965ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2965ff', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="netWorth" stroke="#2965ff" strokeWidth={3} fill="url(#heroGrad)" dot={false} activeDot={{ r: 6, fill: '#2965ff', stroke: '#fff', strokeWidth: 2 }} animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ingresos', value: kpis.ingresos, icon: 'trending_up', color: 'text-success', bg: 'bg-success/10' },
          { label: 'Gastos',   value: kpis.gastos,   icon: 'trending_down', color: 'text-danger', bg: 'bg-danger/10' },
          { label: 'Ahorro',   value: kpis.ahorro,   icon: 'savings', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Tasa ahorro', value: null, pct: kpis.tasaAhorro, icon: 'percent', color: 'text-warning', bg: 'bg-warning/10' },
        ].map(kpi => (
          <Card key={kpi.label} padding={false} className="p-4">
            <div className={`w-8 h-8 rounded-btn ${kpi.bg} flex items-center justify-center mb-3`}>
              <span className={`material-symbols-outlined text-lg ${kpi.color}`}>{kpi.icon}</span>
            </div>
            <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide font-medium mb-1">{kpi.label}</p>
            <p className="text-xl font-bold tabular-nums text-light-text dark:text-dark-text">
              {kpi.pct !== undefined ? formatPercent(kpi.pct) : formatMXNShort(kpi.value!)}
            </p>
          </Card>
        ))}
      </div>

      {/* Termómetro de gastos */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">Presupuesto del mes</h3>
          <Link to="/presupuestos">
            <span className="text-xs text-primary font-medium hover:underline cursor-pointer">Ver detalle</span>
          </Link>
        </div>
        <div className="space-y-2">
          <ProgressBar
            value={kpis.gastos}
            max={kpis.presupuestoTotal}
            color={kpis.porcentajeGastado > 0.9 ? '#EF4444' : kpis.porcentajeGastado > 0.7 ? '#F59E0B' : '#10B981'}
            ghost={kpis.gastosProyectados}
          />
          <div className="flex justify-between text-xs text-light-text-2 dark:text-dark-text-2">
            <span>Gastado: <span className="font-semibold tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(kpis.gastos)}</span></span>
            <span>Proyección: <span className={`font-semibold tabular-nums ${kpis.gastosProyectados > kpis.presupuestoTotal ? 'text-danger' : 'text-warning'}`}>{formatPercent(kpis.gastosProyectados / (kpis.presupuestoTotal || 1))}</span></span>
            <span>Límite: <span className="font-semibold tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(kpis.presupuestoTotal)}</span></span>
          </div>
        </div>
      </Card>

      {/* Movimientos recientes + Cuentas mini */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Movimientos */}
        <Card className="lg:col-span-3" padding={false}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border">
            <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">Movimientos recientes</h3>
            <Link to="/analisis" className="text-xs text-primary font-medium hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {recent.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-light-surface dark:hover:bg-dark-surface transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${CATEGORY_COLORS[tx.category]}20` }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: CATEGORY_COLORS[tx.category] }}>
                    {CATEGORY_ICONS[tx.category]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-light-text dark:text-dark-text truncate">{tx.description}</p>
                  <p className="text-xs text-light-text-2 dark:text-dark-text-2">
                    {new Date(tx.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <p className={`text-sm font-semibold tabular-nums flex-shrink-0 ${tx.type === 'ingreso' ? 'text-success' : 'text-danger'}`}>
                  {tx.type === 'ingreso' ? '+' : '-'}{formatMXNShort(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Cuentas mini */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border">
            <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">Mis cuentas</h3>
            <Link to="/cuentas" className="text-xs text-primary font-medium hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {accounts.filter(a => a.isActive).slice(0, 4).map(acc => (
              <div key={acc.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-btn flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: acc.color }}>
                  {acc.bank.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-light-text dark:text-dark-text truncate">{acc.name}</p>
                  {acc.lastFour && <p className="text-xs text-light-text-2 dark:text-dark-text-2">••••{acc.lastFour}</p>}
                </div>
                <p className={`text-sm font-semibold tabular-nums flex-shrink-0 ${acc.balance < 0 ? 'text-danger' : 'text-light-text dark:text-dark-text'}`}>
                  {formatMXNShort(acc.balance)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Presupuestos semáforo + Meta destacada */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top presupuestos */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border">
            <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">Presupuestos por categoría</h3>
            <Link to="/presupuestos" className="text-xs text-primary font-medium hover:underline">Gestionar</Link>
          </div>
          <div className="px-5 py-3 space-y-4">
            {budgets.slice(0, 5).map(b => {
              const pct = b.monthlyLimit > 0 ? b.spent / b.monthlyLimit : 0
              const status = getBudgetStatus(b)
              const color = status === 'ok' ? '#10B981' : status === 'warning' ? '#F59E0B' : '#EF4444'
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base" style={{ color }}>
                        {CATEGORY_ICONS[b.category]}
                      </span>
                      <span className="text-sm text-light-text dark:text-dark-text">{CATEGORY_LABELS[b.category]}</span>
                    </div>
                    <span className="text-xs text-light-text-2 dark:text-dark-text-2 tabular-nums">
                      {formatMXNShort(b.spent)} / {formatMXNShort(b.monthlyLimit)}
                    </span>
                  </div>
                  <ProgressBar value={b.spent} max={b.monthlyLimit} color={color} />
                </div>
              )
            })}
          </div>
        </Card>

        {/* Meta destacada */}
        {topGoal && (
          <Card className="flex flex-col items-center text-center">
            <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide font-medium mb-3">Meta destacada</p>
            <GoalGauge
              percentage={(topGoal.currentAmount / topGoal.targetAmount) * 100}
              color={topGoal.color}
              size={96}
            />
            <p className="mt-3 font-semibold text-light-text dark:text-dark-text">{topGoal.name}</p>
            <p className="text-sm text-light-text-2 dark:text-dark-text-2 tabular-nums mt-1">
              {formatMXNShort(topGoal.currentAmount)} / {formatMXNShort(topGoal.targetAmount)}
            </p>
            <p className="text-xs text-light-text-2 dark:text-dark-text-2 mt-1">
              Aporte: {formatMXNShort(topGoal.monthlyContribution)}/mes
            </p>
            <Link to="/metas" className="mt-4 text-xs text-primary font-medium hover:underline">Ver todas las metas</Link>
          </Card>
        )}
      </div>

      {/* Banner IA */}
      {aiBannerOpen && (
        <div className="bg-success/5 border border-success/20 rounded-card p-4 flex items-start gap-4 animate-fade-in-up">
          <div className="w-9 h-9 bg-success/10 rounded-btn flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-success text-xl">psychology</span>
          </div>
          <Card className="p-6 border-l-4 border-l-primary bg-primary/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Gasto Total Mes</p>
          <p className="text-3xl font-black text-light-text dark:text-dark-text mb-2">{formatMXN(analysisData.totalThis)}</p>
          <div className={`flex items-center gap-1 text-xs font-bold ${analysisData.totalThis > analysisData.totalLast ? 'text-danger' : 'text-success'}`}>
             <span className="material-symbols-outlined text-[14px]">
               {analysisData.totalThis > analysisData.totalLast ? 'trending_up' : 'trending_down'}
             </span>
             {analysisData.totalLast > 0 ? (((analysisData.totalThis - analysisData.totalLast) / analysisData.totalLast) * 100).toFixed(1) : '0'}% vs mes ant.
          </div>
        </Card>  <button onClick={() => setAiBannerOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-btn hover:bg-light-surface dark:hover:bg-dark-surface flex-shrink-0 cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-lg text-light-muted dark:text-dark-muted">close</span>
          </button>
        </div>
      )}
    </div>
  )
}
