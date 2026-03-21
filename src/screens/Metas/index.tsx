import { useState, useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '../../context/AppContext'
import { calcSavingsProjection } from '../../hooks/useFinance'
import { Card, GoalGauge, Badge, Modal, Drawer, Button, Input, Skeleton } from '../../components/ui'
import { formatMXN, formatMXNShort } from '../../types'
import type { SavingGoal } from '../../types'

const GOAL_TYPES = [
  { value: 'emergencia', label: 'Emergencia', icon: 'shield' },
  { value: 'viaje',      label: 'Viaje',      icon: 'flight' },
  { value: 'auto',       label: 'Auto',       icon: 'directions_car' },
  { value: 'casa',       label: 'Casa',       icon: 'home' },
  { value: 'educacion',  label: 'Educación',  icon: 'school' },
  { value: 'retiro',     label: 'Retiro',     icon: 'elderly' },
  { value: 'otro',       label: 'Otro',       icon: 'category' },
] as const

const GOAL_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316']

export default function Metas() {
  const { goals, addGoal } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [activeGoal, setActiveGoal] = useState<SavingGoal | null>(null)
  const [sliderTerm, setSliderTerm] = useState(12)
  const [sliderRate, setSliderRate] = useState(8)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // New goal form
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newContrib, setNewContrib] = useState('')
  const [newType, setNewType] = useState<SavingGoal['type']>('otro')

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)

  const drawerProjection = useMemo(() => {
    if (!activeGoal) return []
    return calcSavingsProjection(activeGoal.currentAmount, activeGoal.monthlyContribution, activeGoal.expectedReturn, 24)
      .map(r => ({ month: `+${r.month}m`, real: r.balance, objetivo: activeGoal.targetAmount }))
  }, [activeGoal])

  const handleCreateGoal = () => {
    if (!newName || !newTarget) return
    addGoal({
      name: newName, type: newType,
      targetAmount: parseFloat(newTarget),
      currentAmount: 0,
      targetDate: newDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      monthlyContribution: parseFloat(newContrib) || 0,
      expectedReturn: sliderRate / 100,
      color: GOAL_COLORS[goals.length % GOAL_COLORS.length],
      icon: GOAL_TYPES.find(t => t.value === newType)?.icon ?? 'category',
    })
    setShowModal(false)
    setNewName(''); setNewTarget(''); setNewDate(''); setNewContrib('')
  }

  const getGoalStatus = (g: SavingGoal) => {
    const pct = g.currentAmount / g.targetAmount
    if (pct >= 1) return { label: 'Completada', variant: 'success' as const }
    if (pct >= 0.7) return { label: 'En progreso', variant: 'info' as const }
    if (new Date(g.targetDate) < new Date()) return { label: 'Vencida', variant: 'danger' as const }
    return { label: 'En progreso', variant: 'neutral' as const }
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">Mis Metas</h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 italic">Visualiza y gestiona tus objetivos financieros.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowModal(true)}>
            <span className="material-symbols-outlined text-lg">add</span> Nueva Meta
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding={false} className="p-4">
          <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide font-medium mb-1">Ahorro total</p>
          <p className="text-2xl font-bold tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(totalSaved)}</p>
        </Card>
        <Card padding={false} className="p-4">
          <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide font-medium mb-1">Metas activas</p>
          <p className="text-2xl font-bold text-light-text dark:text-dark-text">{goals.length}</p>
        </Card>
      </div>

      {/* Goals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map(g => {
          const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100)
          const { label, variant } = getGoalStatus(g)
          return (
            <Card key={g.id} className="hover:border-primary/30 transition-colors cursor-pointer" clickable
              onClick={() => setActiveGoal(g)}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-btn flex items-center justify-center" style={{ backgroundColor: `${g.color}20` }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: g.color }}>{g.icon}</span>
                </div>
                <GoalGauge percentage={pct} color={g.color} size={56} />
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-light-text dark:text-dark-text leading-tight">{g.name}</h3>
                  <Badge variant={variant} className="flex-shrink-0">{label}</Badge>
                </div>
                <p className="text-xs text-light-text-2 dark:text-dark-text-2">
                  Meta: {new Date(g.targetDate).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-2 dark:text-dark-text-2">Ahorrado</span>
                  <span className="font-semibold tabular-nums text-light-text dark:text-dark-text">
                    {formatMXNShort(g.currentAmount)} / {formatMXNShort(g.targetAmount)}
                  </span>
                </div>
                <div className="h-2 w-full bg-light-surface dark:bg-dark-surface rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: g.color }} />
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-light-border dark:border-dark-border">
                <div>
                  <p className="text-[10px] uppercase text-light-muted dark:text-dark-muted font-bold">Aporte mensual</p>
                  <p className="font-bold tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(g.monthlyContribution)}</p>
                </div>
                <button className="text-primary text-sm font-medium flex items-center gap-0.5 hover:underline cursor-pointer">
                  Detalles <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </Card>
          )
        })}

        {/* Add card */}
        <button onClick={() => setShowModal(true)}
          className="rounded-card border-2 border-dashed border-light-border dark:border-dark-border flex flex-col items-center justify-center gap-2 p-8 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer min-h-[200px]">
          <span className="material-symbols-outlined text-3xl text-light-muted dark:text-dark-muted">add_circle</span>
          <span className="text-sm font-medium text-light-muted dark:text-dark-muted">Nueva meta</span>
        </button>
      </div>

      {/* Modal nueva meta */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva meta de ahorro" size="md">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-light-text dark:text-dark-text mb-2">Tipo de meta</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_TYPES.map(t => (
                <button key={t.value} onClick={() => setNewType(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium cursor-pointer transition-all border ${
                    newType === t.value
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-light-surface dark:bg-dark-surface text-light-text-2 dark:text-dark-text-2 border-light-border dark:border-dark-border'
                  }`}>
                  <span className="material-symbols-outlined text-sm">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <Input label="Nombre de la meta" placeholder="Ej: Vacaciones Japón" value={newName} onChange={e => setNewName(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto objetivo" type="number" placeholder="0.00" value={newTarget} onChange={e => setNewTarget(e.target.value)} />
            <Input label="Fecha límite" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
          </div>
          <Input label="Aportación mensual" type="number" placeholder="0.00" value={newContrib} onChange={e => setNewContrib(e.target.value)} />
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-sm font-medium text-light-text dark:text-dark-text">Tasa de rendimiento anual</p>
              <span className="text-primary font-bold text-sm">{sliderRate}%</span>
            </div>
            <input type="range" min={0} max={15} step={0.5} value={sliderRate}
              onChange={e => setSliderRate(Number(e.target.value))} className="w-full" />
          </div>
          {newTarget && newContrib && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-card">
              <p className="text-xs text-primary font-bold uppercase mb-1">Ahorro mensual estimado</p>
              <p className="text-2xl font-black text-primary tabular-nums">{formatMXN(parseFloat(newContrib) || 0)}/mes</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button className="flex-1 justify-center" onClick={handleCreateGoal} disabled={!newName || !newTarget}>Crear meta</Button>
          </div>
        </div>
      </Modal>

      {/* Drawer detalle */}
      <Drawer isOpen={activeGoal !== null} onClose={() => setActiveGoal(null)} title={activeGoal?.name ?? ''}>
        {activeGoal && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <GoalGauge
                percentage={Math.min((activeGoal.currentAmount / activeGoal.targetAmount) * 100, 100)}
                color={activeGoal.color}
                size={80}
              />
              <div>
                <p className="font-semibold text-light-text dark:text-dark-text">{activeGoal.name}</p>
                <p className="text-sm text-light-text-2 dark:text-dark-text-2 tabular-nums">
                  {formatMXN(activeGoal.currentAmount)} / {formatMXN(activeGoal.targetAmount)}
                </p>
              </div>
            </div>

            <div className="h-0.5 bg-light-border dark:bg-dark-border" />

            <div className="space-y-2 text-sm">
              {[
                ['Fecha objetivo', new Date(activeGoal.targetDate).toLocaleDateString('es-MX')],
                ['Aportación mensual', formatMXN(activeGoal.monthlyContribution)],
                ['Rendimiento esperado', `${(activeGoal.expectedReturn * 100).toFixed(1)}% anual`],
                ['Restante', formatMXN(activeGoal.targetAmount - activeGoal.currentAmount)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-light-border dark:border-dark-border">
                  <span className="text-light-text-2 dark:text-dark-text-2">{k}</span>
                  <span className="font-medium text-light-text dark:text-dark-text tabular-nums">{v}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-medium text-light-text dark:text-dark-text mb-3">Proyección 24 meses</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={drawerProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--chart-label)' }} interval={3} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--chart-label)' }} />
                  <Tooltip formatter={(v: number) => [formatMXN(v), '']} />
                  <Line type="monotone" dataKey="real" stroke={activeGoal.color} strokeWidth={2} dot={false} animationDuration={600} />
                  <Line type="monotone" dataKey="objetivo" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 justify-center">Pausar</Button>
              <Button className="flex-1 justify-center">Agregar fondos</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
