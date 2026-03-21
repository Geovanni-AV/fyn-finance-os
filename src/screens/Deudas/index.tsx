import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '../../context/AppContext'
import { calcMonthlyPayment } from '../../hooks/useFinance'
import { Card, Badge } from '../../components/ui'
import { formatMXN, formatMXNShort } from '../../types'

const DEBT_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444']

type Strategy = 'avalancha' | 'bola_de_nieve'

export default function Deudas() {
  const { debts } = useApp()
  const [strategy, setStrategy] = useState<Strategy>('bola_de_nieve')
  const [extraPayment, setExtraPayment] = useState(2500)

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const totalMinPayment = debts.reduce((s, d) => s + d.minimumPayment, 0)
  const totalInterestsMonthly = debts.reduce((s, d) => s + d.balance * (d.interestRate / 12), 0)

  const sortedDebts = useMemo(() => {
    const copy = [...debts]
    return strategy === 'avalancha'
      ? copy.sort((a, b) => b.interestRate - a.interestRate)
      : copy.sort((a, b) => a.balance - b.balance)
  }, [debts, strategy])

  const getDiagnostic = (rate: number) => {
    if (rate === 0) return { label: 'Sin interés', variant: 'success' as const }
    if (rate < 0.15) return { label: 'Óptimo', variant: 'success' as const }
    if (rate < 0.25) return { label: 'Manejable', variant: 'info' as const }
    if (rate < 0.35) return { label: 'Elevado', variant: 'warning' as const }
    return { label: 'Crítico', variant: 'danger' as const }
  }

  // Simple projection for chart (6 months)
  const projectionData = useMemo(() => {
    const months = 6
    return Array.from({ length: months + 1 }, (_, i) => {
      const row: Record<string, number | string> = { month: i === 0 ? 'Hoy' : `+${i}m` }
      debts.forEach(d => {
        const monthlyPmt = d.minimumPayment + (i === 0 ? 0 : extraPayment / debts.length)
        const balance = Math.max(0, d.balance - monthlyPmt * i)
        row[d.name] = Math.round(balance)
      })
      return row
    })
  }, [debts, extraPayment])

  const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const today = new Date()

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Deudas y créditos</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding={false} className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-danger/10 rounded-btn flex items-center justify-center">
              <span className="material-symbols-outlined text-danger text-xl">payments</span>
            </div>
            <span className="text-xs text-danger font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs">trending_up</span> Alta
            </span>
          </div>
          <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide font-medium mb-1">Deuda total</p>
          <p className="text-2xl font-bold tabular-nums text-light-text dark:text-dark-text">{formatMXN(totalDebt)}</p>
        </Card>
        <Card padding={false} className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-primary/10 rounded-btn flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
            </div>
          </div>
          <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide font-medium mb-1">Pago mínimo</p>
          <p className="text-2xl font-bold tabular-nums text-primary">{formatMXN(totalMinPayment)}</p>
          <p className="text-xs text-light-text-2 dark:text-dark-text-2 mt-1">Próximo vence en {debts[0]?.dueDay ?? '--'} días</p>
        </Card>
        <Card padding={false} className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-warning/10 rounded-btn flex items-center justify-center">
              <span className="material-symbols-outlined text-warning text-xl">percent</span>
            </div>
          </div>
          <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide font-medium mb-1">Intereses (mes)</p>
          <p className="text-2xl font-bold tabular-nums text-warning">{formatMXN(totalInterestsMonthly)}</p>
        </Card>
      </div>

      {/* Diagnóstico table */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border">
          <h2 className="font-semibold text-light-text dark:text-dark-text">Diagnóstico crediticio</h2>
          <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Ver reporte</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-light-surface dark:bg-dark-surface text-light-text-2 dark:text-dark-text-2 text-xs font-semibold uppercase tracking-wider">
                {['Deuda', 'Saldo', 'Tasa', 'Min. pago', 'Vence', 'Diagnóstico', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {debts.map(d => {
                const { label, variant } = getDiagnostic(d.interestRate)
                return (
                  <tr key={d.id} className="hover:bg-light-surface dark:hover:bg-dark-surface transition-colors">
                    <td className="px-4 py-3 font-medium text-light-text dark:text-dark-text">{d.name}</td>
                    <td className="px-4 py-3 tabular-nums text-danger font-medium">{formatMXNShort(d.balance)}</td>
                    <td className="px-4 py-3 tabular-nums text-light-text dark:text-dark-text">
                      {d.interestRate > 0 ? `${(d.interestRate * 100).toFixed(0)}%` : 'Sin int.'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(d.minimumPayment)}</td>
                    <td className="px-4 py-3 text-light-text-2 dark:text-dark-text-2">Día {d.dueDay}</td>
                    <td className="px-4 py-3"><Badge variant={variant}>{label}</Badge></td>
                    <td className="px-4 py-3">
                      <button className="text-primary hover:underline text-xs cursor-pointer">Editar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Strategy + Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 space-y-5">
          <h2 className="font-semibold text-light-text dark:text-dark-text">Estrategia de pago</h2>
          {/* Tabs */}
          <div className="flex border-b border-light-border dark:border-dark-border">
            {(['bola_de_nieve', 'avalancha'] as Strategy[]).map(s => (
              <button key={s} onClick={() => setStrategy(s)}
                className={`px-5 py-2.5 text-sm font-medium capitalize cursor-pointer transition-colors border-b-2 ${
                  strategy === s ? 'border-primary text-primary' : 'border-transparent text-light-text-2 dark:text-dark-text-2 hover:text-light-text dark:hover:text-dark-text'
                }`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          {/* Orden */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-light-text-2 dark:text-dark-text-2 uppercase tracking-wider">Orden de liquidación</p>
            {sortedDebts.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 p-3 bg-light-surface dark:bg-dark-surface rounded-btn">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-primary text-white' : 'bg-light-border dark:bg-dark-border text-light-text-2 dark:text-dark-text-2'}`}>
                  {i + 1}
                </div>
                <span className="flex-1 text-sm font-medium text-light-text dark:text-dark-text">{d.name}</span>
                <span className="text-xs text-light-text-2 dark:text-dark-text-2 tabular-nums">{formatMXNShort(d.balance)}</span>
              </div>
            ))}
          </div>
          {/* Slider extra */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-light-text dark:text-dark-text">Pago extra mensual</p>
              <span className="text-primary font-bold tabular-nums">{formatMXN(extraPayment)}</span>
            </div>
            <input type="range" min={0} max={10000} step={100} value={extraPayment}
              onChange={e => setExtraPayment(Number(e.target.value))}
              className="w-full" />
            <div className="flex justify-between mt-1 text-xs text-light-text-2 dark:text-dark-text-2">
              <span>$0</span><span>$10,000</span>
            </div>
          </div>
        </Card>

        {/* Calendar de pagos */}
        <Card className="space-y-4">
          <h3 className="font-semibold text-light-text dark:text-dark-text">Próximos vencimientos</h3>
          <div className="space-y-3">
            {debts.sort((a, b) => a.dueDay - b.dueDay).map((d, i) => (
              <div key={d.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-btn flex flex-col items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length] }}>
                  <span className="text-[9px] font-bold uppercase">{MONTHS_SHORT[today.getMonth()]}</span>
                  <span className="text-sm font-bold leading-none">{d.dueDay}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-light-text dark:text-dark-text truncate">{d.name}</p>
                  <p className="text-xs text-light-text-2 dark:text-dark-text-2">Mínimo</p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(d.minimumPayment)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Projection chart */}
      <Card>
        <h3 className="font-semibold text-light-text dark:text-dark-text mb-5">Proyección de saldos</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--chart-label)' }} />
            <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: 'var(--chart-label)' }} />
            <Tooltip formatter={(v: number, name: string) => [formatMXN(v), name]} />
            <Legend />
            {debts.map((d, i) => (
              <Line key={d.id} type="monotone" dataKey={d.name} stroke={DEBT_COLORS[i % DEBT_COLORS.length]} strokeWidth={2} dot={false} animationDuration={600} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
