import { useState, useMemo, useEffect } from 'react'
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '../../context/AppContext'
import { calcMonthlyPayment, calcAmortizationTable, calcSavingsProjection } from '../../hooks/useFinance'
import { Card, Button, Tabs, Skeleton } from '../../components/ui'
import { formatMXN, formatMXNShort } from '../../types'

type Tab = 'credito' | 'ahorro' | 'deudas'

export default function Simulador() {
  const { debts } = useApp()
  const [tab, setTab] = useState<Tab>('credito')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // ── Crédito ──────────────────────────────────────────────────────────────────
  const [principal, setPrincipal] = useState(30000)
  const [annualRate, setAnnualRate] = useState(27)
  const [termMonths, setTermMonths] = useState(12)
  const [showFullAmort, setShowFullAmort] = useState(false)

  const creditCalc = useMemo(() => {
    const r = annualRate / 100
    const monthlyPmt = calcMonthlyPayment(principal, r, termMonths)
    const totalPmt = monthlyPmt * termMonths
    const totalInterest = totalPmt - principal
    const cat = (r * 1.15 * 100)
    const amort = calcAmortizationTable(principal, r, termMonths)
    return { monthlyPmt, totalPmt, totalInterest, cat, amort }
  }, [principal, annualRate, termMonths])

  const pieData = [
    { name: 'Capital', value: principal, color: '#2563EB' },
    { name: 'Intereses', value: Math.max(0, creditCalc.totalInterest), color: '#6366F1' },
  ]

  // ── Ahorro ───────────────────────────────────────────────────────────────────
  const [savInitial, setSavInitial] = useState(10000)
  const [savMonthly, setSavMonthly] = useState(3000)
  const [savRate, setSavRate] = useState(8)
  const [savTerm, setSavTerm] = useState(24)

  const savCalc = useMemo(() =>
    calcSavingsProjection(savInitial, savMonthly, savRate / 100, savTerm),
    [savInitial, savMonthly, savRate, savTerm]
  )
  const savFinal = savCalc[savCalc.length - 1]

  // ── Deudas ───────────────────────────────────────────────────────────────────
  const [extraPmt, setExtraPmt] = useState(2000)
  const [debtStrategy, setDebtStrategy] = useState<'avalancha' | 'bola_de_nieve'>('avalancha')

  const debtProjection = useMemo(() => {
    const months = 18
    return Array.from({ length: months + 1 }, (_, i) => {
      const row: Record<string, number | string> = { mes: i === 0 ? 'Hoy' : `M${i}` }
      debts.forEach(d => {
        const pmt = d.minimumPayment + (i === 0 ? 0 : extraPmt / (debts.length || 1))
        const balance = Math.max(0, d.balance - pmt * i)
        row[d.name] = Math.round(balance)
      })
      return row
    })
  }, [debts, extraPmt])

  const DEBT_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444']

  const tabs = [
    { id: 'credito' as Tab, label: 'Crédito',          icon: 'credit_card' },
    { id: 'ahorro'  as Tab, label: 'Ahorro e inversión', icon: 'savings' },
    { id: 'deudas'  as Tab, label: 'Liberación deudas', icon: 'release_alert' },
  ]

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-12 w-full rounded-card" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Skeleton className="lg:col-span-4 h-[400px] rounded-card" />
          <Skeleton className="lg:col-span-8 h-[400px] rounded-card" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">Simulador Financiero</h1>
        <p className="text-sm text-light-text-2 dark:text-dark-text-2 italic">Proyecta tu futuro con herramientas de precisión.</p>
      </div>

      <Tabs tabs={tabs} activeTab={tab} onChange={(id) => setTab(id as Tab)} />

      {/* ── CRÉDITO ──────────────────────────────────────────────────────────── */}
      {tab === 'credito' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-5 space-y-5">
            <h3 className="font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tune</span> Parámetros
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-light-text dark:text-dark-text">Monto del crédito</label>
                  <span className="text-primary font-bold tabular-nums">{formatMXN(principal)}</span>
                </div>
                <input type="range" min={5000} max={500000} step={5000} value={principal}
                  onChange={e => setPrincipal(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-light-text dark:text-dark-text">Tasa anual (TNA)</label>
                  <span className="text-primary font-bold">{annualRate}%</span>
                </div>
                <input type="range" min={0} max={100} step={0.5} value={annualRate}
                  onChange={e => setAnnualRate(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-light-text dark:text-dark-text">Plazo</label>
                  <span className="text-primary font-bold">{termMonths} meses</span>
                </div>
                <input type="range" min={1} max={60} step={1} value={termMonths}
                  onChange={e => setTermMonths(Number(e.target.value))} className="w-full" />
              </div>
            </div>

            <div className="border border-light-border dark:border-dark-border rounded-card overflow-hidden">
              <div className="px-4 py-3 border-b border-light-border dark:border-dark-border flex justify-between items-center">
                <p className="text-xs font-bold uppercase text-light-text-2 dark:text-dark-text-2 tracking-wider">Amortización</p>
                <button onClick={() => setShowFullAmort(s => !s)} className="text-primary text-xs font-medium cursor-pointer hover:underline">
                  {showFullAmort ? 'Ver menos' : 'Ver completa'}
                </button>
              </div>
              <div className="max-h-[180px] overflow-y-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-light-card dark:bg-dark-card shadow-sm z-10">
                    <tr className="text-[10px] uppercase text-light-muted dark:text-dark-muted border-b border-light-border dark:border-dark-border">
                      <th className="px-4 py-2 font-bold">Mes</th>
                      <th className="px-4 py-2 font-bold text-right">Pago</th>
                      <th className="px-4 py-2 font-bold text-right">Interés</th>
                      <th className="px-4 py-2 font-bold text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showFullAmort ? creditCalc.amort : creditCalc.amort.slice(0, 3)).map(row => (
                      <tr key={row.month} className="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-surface dark:hover:bg-dark-surface transition-colors">
                        <td className="px-4 py-2 text-[11px] font-medium text-light-text dark:text-dark-text">{row.month}</td>
                        <td className="px-4 py-2 text-[11px] text-right tabular-nums text-light-text-2 dark:text-dark-text-2">{formatMXNShort(row.payment)}</td>
                        <td className="px-4 py-2 text-[11px] text-right tabular-nums text-danger">{formatMXNShort(row.interest)}</td>
                        <td className="px-4 py-2 text-[11px] text-right tabular-nums text-light-text dark:text-dark-text font-medium">{formatMXNShort(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-7 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-primary/10 border-primary/30">
                <p className="text-sm text-primary font-medium mb-1">Pago mensual</p>
                <p className="text-3xl font-black text-light-text dark:text-dark-text tabular-nums">
                  {formatMXN(creditCalc.monthlyPmt)}
                </p>
              </Card>
              <Card>
                <p className="text-sm text-light-text-2 dark:text-dark-text-2 font-medium mb-1">CAT aprox.</p>
                <p className="text-2xl font-bold text-light-text dark:text-dark-text tabular-nums">
                  {creditCalc.cat.toFixed(1)}% <span className="text-xs font-normal text-light-text-2 dark:text-dark-text-2">sin IVA</span>
                </p>
              </Card>
            </div>

            <Card>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-44 h-44 flex-shrink-0">
                  <PieChart width={176} height={176}>
                    <Pie data={pieData} cx={88} cy={88} innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" animationDuration={600}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-light-text-2 dark:text-dark-text-2 font-medium">Total</span>
                    <span className="text-xl font-bold tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(creditCalc.totalPmt)}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <h3 className="font-semibold text-light-text dark:text-dark-text">Resumen del préstamo</h3>
                  {[
                    { label: 'Capital solicitado', value: formatMXN(principal), color: '#2563EB' },
                    { label: 'Total intereses',    value: formatMXN(creditCalc.totalInterest), color: '#6366F1' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                        <span className="text-light-text-2 dark:text-dark-text-2">{r.label}</span>
                      </div>
                      <span className="font-bold tabular-nums text-light-text dark:text-dark-text">{r.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-light-border dark:border-dark-border pt-2 flex justify-between">
                    <span className="font-medium text-light-text dark:text-dark-text">Total a pagar</span>
                    <span className="font-black text-primary text-lg tabular-nums">{formatMXN(creditCalc.totalPmt)}</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-primary/5 border border-primary/20 rounded-card p-4 flex gap-3">
              <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary text-sm mb-1">Tip de Fyn</p>
                <p className="text-sm text-light-text-2 dark:text-dark-text-2">
                  Aumentar tu mensualidad un 12% reduce considerablemente el tiempo y costo total del crédito.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AHORRO ───────────────────────────────────────────────────────────── */}
      {tab === 'ahorro' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-4 space-y-5">
            <h3 className="font-semibold text-light-text dark:text-dark-text">Parámetros de ahorro</h3>
            {[
              { label: 'Monto inicial', value: savInitial, setter: setSavInitial, min: 0, max: 100000, step: 1000, fmt: formatMXN },
              { label: 'Aportación mensual', value: savMonthly, setter: setSavMonthly, min: 0, max: 20000, step: 500, fmt: formatMXN },
              { label: 'Tasa anual', value: savRate, setter: setSavRate, min: 0, max: 20, step: 0.5, fmt: (v: number) => `${v}%` },
              { label: 'Plazo (meses)', value: savTerm, setter: setSavTerm, min: 6, max: 60, step: 1, fmt: (v: number) => `${v} meses` },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-light-text dark:text-dark-text">{r.label}</label>
                  <span className="text-primary font-bold tabular-nums">{r.fmt(r.value)}</span>
                </div>
                <input type="range" min={r.min} max={r.max} step={r.step} value={r.value}
                  onChange={e => r.setter(Number(e.target.value))} className="w-full" />
              </div>
            ))}
            {savFinal && (
              <div className="border-t border-light-border dark:border-dark-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-2 dark:text-dark-text-2">Total aportado</span>
                  <span className="font-bold tabular-nums text-light-text dark:text-dark-text">{formatMXN(savFinal.contributions)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-2 dark:text-dark-text-2">Rendimientos</span>
                  <span className="font-bold tabular-nums text-success">{formatMXN(Math.max(0, savFinal.interest))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-light-text dark:text-dark-text">Total final</span>
                  <span className="font-black text-primary text-lg tabular-nums">{formatMXN(savFinal.balance)}</span>
                </div>
              </div>
            )}
          </Card>
          <Card className="lg:col-span-8">
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">Proyección de crecimiento</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={savCalc.map(r => ({ ...r, month: `M${r.month}` }))}>
                <defs>
                  <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-label)' }} interval={Math.floor(savTerm / 6)} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--chart-label)' }} />
                <Tooltip formatter={(v: number, name: string) => [formatMXN(v), name === 'contributions' ? 'Aportaciones' : 'Balance total']} />
                <Area type="monotone" dataKey="contributions" stackId="1" stroke="#2563EB" fill="url(#contribGrad)" strokeWidth={2} dot={false} animationDuration={600} />
                <Area type="monotone" dataKey="balance" stroke="#10B981" fill="url(#intGrad)" strokeWidth={2} dot={false} animationDuration={600} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── DEUDAS ───────────────────────────────────────────────────────────── */}
      {tab === 'deudas' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase font-medium mb-1">Deuda total</p>
              <p className="text-2xl font-bold tabular-nums text-danger">{formatMXN(debts.reduce((s, d) => s + d.balance, 0))}</p>
            </Card>
            <Card>
              <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase font-medium mb-1">Pago mínimo</p>
              <p className="text-2xl font-bold tabular-nums text-light-text dark:text-dark-text">{formatMXN(debts.reduce((s, d) => s + d.minimumPayment, 0))}</p>
            </Card>
            <Card>
               <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase font-medium mb-1">Pago extra</p>
               <p className="text-2xl font-bold tabular-nums text-primary">{formatMXN(extraPmt)}</p>
            </Card>
          </div>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-light-text dark:text-dark-text">Estrategia</h3>
              <div className="flex gap-1 bg-light-surface dark:bg-dark-surface rounded-btn p-0.5">
                {(['avalancha', 'bola_de_nieve'] as const).map(s => (
                  <button key={s} onClick={() => setDebtStrategy(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-btn capitalize cursor-pointer transition-colors ${
                      debtStrategy === s ? 'bg-primary text-white' : 'text-light-text-2 dark:text-dark-text-2'
                    }`}>
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-light-text dark:text-dark-text">Pago extra mensual</label>
                <span className="text-primary font-bold tabular-nums">{formatMXN(extraPmt)}</span>
              </div>
              <input type="range" min={0} max={10000} step={500} value={extraPmt}
                onChange={e => setExtraPmt(Number(e.target.value))} className="w-full" />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">Proyección de saldos (18 meses)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={debtProjection}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.3} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--chart-label)' }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--chart-label)' }} />
                <Tooltip formatter={(v: number, name: string) => [formatMXN(v), name]} />
                <Legend />
                {debts.map((d, i) => (
                  <Line key={d.id} type="monotone" dataKey={d.name} stroke={DEBT_COLORS[i % DEBT_COLORS.length]} strokeWidth={2} dot={false} animationDuration={600} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  )
}
