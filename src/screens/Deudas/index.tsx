import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '../../context/AppContext'
import { Card, Badge, CalendarGrid, type CalendarEvent, Button } from '../../components/ui'
import { formatMXN, formatMXNShort } from '../../types'

const DEBT_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

type Strategy = 'avalancha' | 'bola_de_nieve'

export default function Deudas() {
  const { debts } = useApp()
  const [strategy, setStrategy] = useState<Strategy>('bola_de_nieve')
  const [extraPayment, setExtraPayment] = useState(2500)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const totalMinPayment = debts.reduce((s, d) => s + d.minimumPayment, 0)
  const totalInterestsMonthly = debts.reduce((s, d) => s + d.balance * (d.interestRate / 12), 0)

  const sortedDebts = useMemo(() => {
    const copy = [...debts]
    return strategy === 'avalancha'
      ? copy.sort((a, b) => b.interestRate - a.interestRate)
      : copy.sort((a, b) => a.balance - b.balance)
  }, [debts, strategy])

  // Events for Calendar
  const events: CalendarEvent[] = useMemo(() => {
    const evs: CalendarEvent[] = []
    debts.forEach((d, idx) => {
      // Payment Event
      evs.push({
        id: `pay-${d.id}`,
        day: d.dueDay,
        title: `Pago: ${d.name}`,
        type: 'danger',
        color: DEBT_COLORS[idx % DEBT_COLORS.length],
        amount: d.minimumPayment
      })
      // Mock Cut-off Event for credit cards (usually 20 days after/before)
      if (d.type === 'tarjeta') {
        const cutDay = ((d.dueDay + 10) % 31) || 1
        evs.push({
          id: `cut-${d.id}`,
          day: cutDay,
          title: `Corte: ${d.name}`,
          type: 'warning',
          color: DEBT_COLORS[idx % DEBT_COLORS.length]
        })
      }
    })
    return evs
  }, [debts])

  const getDiagnostic = (rate: number) => {
    if (rate === 0) return { label: 'Sin interés', variant: 'success' as const }
    if (rate < 0.15) return { label: 'Óptimo', variant: 'success' as const }
    if (rate < 0.25) return { label: 'Manejable', variant: 'info' as const }
    if (rate < 0.35) return { label: 'Elevado', variant: 'warning' as const }
    return { label: 'Crítico', variant: 'danger' as const }
  }

  // Projection logic
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

  const nextDueDebts = useMemo(() => 
    [...debts].sort((a, b) => a.dueDay - b.dueDay),
    [debts]
  )

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">Deudas y Créditos</h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 italic">Monitorea y optimiza el pago de tus compromisos financieros.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary">
            <span className="material-symbols-outlined text-lg">add</span> Agregar Deuda
          </Button>
        </div>
      </div>

      {/* Primary Row: Calendar and Next Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Calendario de Pagos</h2>
              <p className="text-xs text-light-text-2 dark:text-dark-text-2">Vencimientos y fechas de corte del mes</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-danger" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">Pago</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">Corte</span>
              </div>
            </div>
          </div>
          <div className="relative z-10">
            <CalendarGrid 
              year={2026}
              month={2}
              events={events} 
              onDayClick={setSelectedDay}
              className="bg-light-surface/30 dark:bg-dark-surface/30 p-4 rounded-2xl border border-light-border/20 dark:border-dark-border/20"
            />
          </div>
        </Card>

        <Card className="flex flex-col h-full bg-primary/5 border-primary/10 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary/10" />
          <div className="p-5 border-b border-primary/5">
            <h3 className="font-bold text-light-text dark:text-dark-text flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">event_upcoming</span>
              Próximos Vencimientos
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {nextDueDebts.map((d, i) => {
              const daysLeft = d.dueDay - new Date().getDate()
              return (
                <div key={d.id} className="flex items-center gap-4 p-4 hover:bg-white/40 dark:hover:bg-black/40 rounded-xl transition-all group">
                  <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg transition-transform group-hover:scale-105"
                    style={{ backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length] }}>
                    <span className="text-[9px] font-black uppercase opacity-80 leading-none mb-0.5">Día</span>
                    <span className="text-lg font-black leading-none">{d.dueDay}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-light-text dark:text-dark-text truncate">{d.name}</p>
                    <p className={`text-[11px] font-medium ${daysLeft <= 3 ? 'text-danger' : 'text-light-text-2 dark:text-dark-text-2'}`}>
                      {daysLeft < 0 ? 'Vencido' : daysLeft === 0 ? '¡Hoy es el día!' : `Faltan ${daysLeft} días`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(d.minimumPayment)}</p>
                    <p className="text-[10px] text-light-muted dark:text-dark-muted">Mínimo</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-4 bg-white/40 dark:bg-black/40 border-t border-primary/5">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-light-text-2 dark:text-dark-text-2">Total del mes</span>
              <span className="text-primary text-base underline decoration-primary/30 underline-offset-4">{formatMXN(totalMinPayment)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <KPIItem title="Deuda Total" value={formatMXN(totalDebt)} icon="account_balance" color="text-danger" bg="bg-danger/10" trend="+2.4%" />
        <KPIItem title="Intereses (mes)" value={formatMXN(totalInterestsMonthly)} icon="percent" color="text-warning" bg="bg-warning/10" />
        <KPIItem title="Capacidad de Pago" value="65%" icon="insights" color="text-success" bg="bg-success/10" />
        <KPIItem title="Tasa Promedio" value="24.5%" icon="auto_graph" color="text-primary" bg="bg-primary/10" />
      </div>

      {/* Diagnosis Table */}
      <Card padding={false} className="overflow-hidden">
        <div className="px-6 py-5 border-b border-light-border dark:border-dark-border flex items-center justify-between bg-light-surface/20 dark:bg-dark-surface/20">
          <h2 className="text-lg font-bold text-light-text dark:text-dark-text">Estado de Créditos</h2>
          <Button variant="ghost" size="sm">Historial Completo</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-light-surface/50 dark:bg-dark-surface/50 text-light-muted dark:text-dark-muted font-bold uppercase tracking-widest text-[10px]">
                <th className="px-6 py-4 text-left">Institución / Crédito</th>
                <th className="px-6 py-4 text-right">Saldo Actual</th>
                <th className="px-6 py-4 text-center">Tasa (Anual)</th>
                <th className="px-6 py-4 text-right">Pago Mínimo</th>
                <th className="px-6 py-4 text-center">Salud</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/50 dark:divide-dark-border/50">
              {debts.map(d => {
                const { label, variant } = getDiagnostic(d.interestRate)
                return (
                  <tr key={d.id} className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-light-text dark:text-dark-text">{d.name}</td>
                    <td className="px-6 py-4 text-right font-black tabular-nums text-danger">{formatMXNShort(d.balance)}</td>
                    <td className="px-6 py-4 text-center tabular-nums text-light-text-2 dark:text-dark-text-2">
                      {d.interestRate > 0 ? `${(d.interestRate * 100).toFixed(1)}%` : '0%'}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-light-text-2 dark:text-dark-text-2">{formatMXNShort(d.minimumPayment)}</td>
                    <td className="px-6 py-4 text-center"><Badge variant={variant}>{label}</Badge></td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" iconOnly><span className="material-symbols-outlined text-base">more_vert</span></Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Row: Strategy & Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Acelerador de Deuda</h2>
            <div className="bg-light-surface dark:bg-dark-surface p-1 rounded-xl flex">
              {(['bola_de_nieve', 'avalancha'] as Strategy[]).map(s => (
                <button key={s} onClick={() => setStrategy(s)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    strategy === s ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
                  }`}>
                  {s.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm font-bold text-light-text dark:text-dark-text">Pago Extra Mensual</p>
                <p className="text-xs text-light-text-2 dark:text-dark-text-2">Se aplicará primero a {sortedDebts[0]?.name}</p>
              </div>
              <span className="text-2xl font-black text-primary tabular-nums">{formatMXN(extraPayment)}</span>
            </div>
            
            <input type="range" min={0} max={10000} step={250} value={extraPayment}
              onChange={e => setExtraPayment(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-light-border dark:bg-dark-border rounded-lg appearance-none cursor-pointer" />
            
            <div className="flex justify-between mt-3 text-[10px] font-black uppercase text-light-muted dark:text-dark-muted tracking-widest">
              <span>Mínimo</span>
              <span>Recomendado</span>
              <span>Agresivo</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-success/10 border border-success/20 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-success opacity-80 mb-1">Intereses Ahorrados</p>
              <p className="text-xl font-black text-success tabular-nums">{formatMXN(extraPayment * 1.5 * 12)}</p>
            </div>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-80 mb-1">Meses Adelantados</p>
              <p className="text-xl font-black text-primary tabular-nums">14 Meses</p>
            </div>
          </div>
        </Card>

        {/* Projection Chart */}
        <Card className="flex flex-col">
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Proyección de Libertad Financiera
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--chart-label)', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--chart-label)', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}
                  formatter={(v: number, name: string) => [formatMXN(v), name]} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px', paddingTop: '20px' }} />
                {debts.map((d, i) => (
                  <Line key={d.id} type="monotone" dataKey={d.name} stroke={DEBT_COLORS[i % DEBT_COLORS.length]} strokeWidth={3} dot={false} animationDuration={1000} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

function KPIItem({ title, value, icon, color, bg, trend }: { title: string; value: string; icon: string; color: string; bg: string; trend?: string }) {
  return (
    <Card padding={false} className="p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:rotate-12 ${bg}`}>
          <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
        </div>
        {trend && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[11px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className={`text-2xl font-black tabular-nums tracking-tighter text-light-text dark:text-dark-text`}>{value}</p>
    </Card>
  )
}
