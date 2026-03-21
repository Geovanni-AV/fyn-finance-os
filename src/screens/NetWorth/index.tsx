import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '../../context/AppContext'
import { useNetWorth } from '../../hooks/useFinance'
import { Card, Skeleton } from '../../components/ui'
import { formatMXN, formatMXNShort } from '../../types'

export default function NetWorth() {
  const { accounts, netWorthHistory } = useApp()
  const { assets, liabilities, netWorth } = useNetWorth()
  const [range, setRange] = useState<'3m' | '6m' | '1y'>('1y')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="lg:col-span-2 h-32 rounded-card" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 rounded-card" />
            <Skeleton className="h-20 rounded-card" />
          </div>
        </div>
        <Skeleton className="h-64 h-w-full rounded-card" />
      </div>
    )
  }

  const chartData = netWorthHistory
    .slice(range === '3m' ? -3 : range === '6m' ? -6 : -12)
    .map(n => ({
      month: n.month.slice(5) + '/' + n.month.slice(2, 4),
      activos: n.assets,
      pasivos: -n.liabilities,
      netWorth: n.netWorth,
    }))

  const activeAccounts = accounts.filter(a => a.isActive && a.balance > 0)
  const liabilityAccounts = accounts.filter(a => a.isActive && a.balance < 0)

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">Net Worth</h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 italic">Tu patrimonio neto consolidado en tiempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex items-center gap-1.5 text-sm font-medium text-primary cursor-pointer">
            <span className="material-symbols-outlined text-lg">download</span> Exportar
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <p className="text-xs font-medium text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide mb-1">Patrimonio neto total</p>
          <div className="flex items-baseline gap-4 mb-3">
            <p className={`text-4xl font-bold tabular-nums tracking-tight ${netWorth < 0 ? 'text-danger' : 'text-light-text dark:text-dark-text'}`}>
              {formatMXN(netWorth)}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-success font-medium">Activos: <span className="tabular-nums font-bold">{formatMXNShort(assets)}</span></span>
            <span className="text-danger font-medium">Pasivos: <span className="tabular-nums font-bold">{formatMXNShort(liabilities)}</span></span>
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <Card padding={false} className="p-4 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-success/10 rounded-btn flex items-center justify-center">
                <span className="material-symbols-outlined text-success text-sm">trending_up</span>
              </div>
              <p className="text-sm text-light-text-2 dark:text-dark-text-2">Total activos</p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(assets)}</p>
          </Card>
          <Card padding={false} className="p-4 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-danger/10 rounded-btn flex items-center justify-center">
                <span className="material-symbols-outlined text-danger text-sm">trending_down</span>
              </div>
              <p className="text-sm text-light-text-2 dark:text-dark-text-2">Total pasivos</p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-danger">{formatMXNShort(liabilities)}</p>
          </Card>
        </div>
      </div>

      {/* Chart histórico */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-light-text dark:text-dark-text">Evolución histórica</h3>
          <div className="flex gap-1 bg-light-surface dark:bg-dark-surface rounded-btn p-0.5">
            {(['3m', '6m', '1y'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-btn cursor-pointer transition-colors ${
                  range === r ? 'bg-light-card dark:bg-dark-card text-primary shadow-sm' : 'text-light-text-2 dark:text-dark-text-2'
                }`}>
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradActivos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNW" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-label)' }} />
            <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--chart-label)' }} />
            <Tooltip formatter={(v: number) => [formatMXN(v), '']} />
            <Area type="monotone" dataKey="activos"  stroke="#10B981" strokeWidth={1.5} fill="url(#gradActivos)" dot={false} animationDuration={600} />
            <Area type="monotone" dataKey="netWorth" stroke="#2563EB" strokeWidth={2.5} fill="url(#gradNW)" dot={false} animationDuration={600} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-success/20">
            <span className="material-symbols-outlined text-success">trending_up</span>
            <h3 className="font-bold text-light-text dark:text-dark-text">Activos</h3>
            <span className="ml-auto font-bold text-success tabular-nums">{formatMXNShort(assets)}</span>
          </div>
          {activeAccounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between p-3 bg-light-surface dark:bg-dark-surface rounded-btn">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ backgroundColor: acc.color }}>{acc.bank.slice(0, 2)}</div>
                <span className="text-sm text-light-text dark:text-dark-text">{acc.name}</span>
              </div>
              <span className="font-semibold tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(acc.balance)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between p-3 bg-light-surface dark:bg-dark-surface rounded-btn">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-warning/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-warning text-sm">home</span>
              </div>
              <span className="text-sm text-light-text dark:text-dark-text">Inmuebles</span>
            </div>
            <span className="font-semibold tabular-nums text-light-text dark:text-dark-text">$2,800,000</span>
          </div>
        </div>

        {/* Pasivos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-danger/20">
            <span className="material-symbols-outlined text-danger">trending_down</span>
            <h3 className="font-bold text-light-text dark:text-dark-text">Pasivos</h3>
            <span className="ml-auto font-bold text-danger tabular-nums">{formatMXNShort(liabilities)}</span>
          </div>
          {liabilityAccounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between p-3 bg-light-surface dark:bg-dark-surface rounded-btn border-l-4 border-danger">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ backgroundColor: acc.color }}>{acc.bank.slice(0, 2)}</div>
                <span className="text-sm text-light-text dark:text-dark-text">{acc.name}</span>
              </div>
              <span className="font-semibold tabular-nums text-danger">{formatMXNShort(Math.abs(acc.balance))}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fórmula visual */}
      <div className="bg-light-surface dark:bg-dark-surface rounded-card p-6 lg:p-10 text-center">
        <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase tracking-widest font-bold mb-6">Cálculo de patrimonio</p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <div className="text-center">
            <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase font-semibold mb-1">Activos</p>
            <p className="text-3xl font-bold text-success tabular-nums">{formatMXNShort(assets)}</p>
          </div>
          <p className="text-4xl font-light text-light-muted dark:text-dark-muted hidden md:block">−</p>
          <div className="text-center">
            <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase font-semibold mb-1">Pasivos</p>
            <p className="text-3xl font-bold text-danger tabular-nums">{formatMXNShort(liabilities)}</p>
          </div>
          <p className="text-5xl font-light text-light-muted dark:text-dark-muted hidden md:block">=</p>
          <div className="bg-primary/10 border border-primary/20 rounded-card p-4 text-center">
            <p className="text-xs text-primary uppercase font-bold mb-1 tracking-widest">Patrimonio neto</p>
            <p className={`text-4xl font-black tabular-nums ${netWorth < 0 ? 'text-danger' : 'text-light-text dark:text-dark-text'}`}>
              {formatMXN(netWorth)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
