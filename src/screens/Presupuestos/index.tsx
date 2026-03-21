import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { Button, Card, ProgressBar, Modal, Input, Toggle, Badge, EmptyState } from '../../components/ui'
import { formatMXN, CATEGORY_ICONS, CATEGORY_LABELS, getBudgetStatus, Budget } from '../../types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useToast } from '../../context/ToastContext'

export default function Presupuestos() {
  const { budgets, transactions, updateBudget } = useApp()
  const { success } = useToast()

  const { totalLimit, totalSpent } = useMemo(() => {
    return budgets.reduce((acc, b) => ({
      totalLimit: acc.totalLimit + b.monthlyLimit,
      totalSpent: acc.totalSpent + b.spent,
    }), { totalLimit: 0, totalSpent: 0 })
  }, [budgets])

  const globalPct = totalLimit > 0 ? totalSpent / totalLimit : 0
  const globalColor = globalPct > 0.9 ? '#EF4444' : globalPct > 0.7 ? '#F59E0B' : '#10B981'

  // Proyección simple lineal (asumiendo gasto constante)
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const currentDay = today.getDate()
  const projectedSpent = currentDay > 0 ? (totalSpent / currentDay) * daysInMonth : totalSpent

  // --- MODAL DETALLE DE CATEGORÍA ---
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [editLimit, setEditLimit] = useState('')

  const handleOpenDetail = (b: Budget) => {
    setSelectedBudget(b)
    setEditLimit(b.monthlyLimit.toString())
  }

  const handleSaveLimit = () => {
    if (selectedBudget && editLimit) {
      const num = Number(editLimit)
      if (!isNaN(num) && num >= 0) {
        updateBudget(selectedBudget.id, { monthlyLimit: num })
        success('Límite de presupuesto actualizado')
        setSelectedBudget(null)
      }
    }
  }

  // Datos para gráfica de selectedBudget
  const chartData = useMemo(() => {
    if (!selectedBudget) return []
    const txs = transactions.filter(t => t.category === selectedBudget.category && t.date.startsWith(selectedBudget.period))
    // Generar 1 al currentDay
    let cumulative = 0
    return Array.from({ length: currentDay || 1 }, (_, i) => {
      const dayStr = `${selectedBudget.period}-${String(i + 1).padStart(2, '0')}`
      const dayTxs = txs.filter(t => t.date === dayStr)
      cumulative += dayTxs.reduce((acc, t) => acc + (t.type === 'gasto' ? t.amount : 0), 0)
      return {
        day: i + 1,
        real: cumulative,
        limit: selectedBudget.monthlyLimit
      }
    })
  }, [selectedBudget, transactions, currentDay])

  const categoryTxs = useMemo(() => {
    if (!selectedBudget) return []
    return transactions
      .filter(t => t.category === selectedBudget.category && t.date.startsWith(selectedBudget.period) && t.type === 'gasto')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
  }, [selectedBudget, transactions])

  // --- GASTOS HORMIGA ---
  const [hormigaThreshold, setHormigaThreshold] = useState(200)
  const [hormigaDailyLimit, setHormigaDailyLimit] = useState(231)
  
  const hormigaData = useMemo(() => {
    const todayStr = today.toISOString().split('T')[0]
    const currentMonthPrefix = todayStr.substring(0, 7)
    
    const allHormiga = transactions.filter(t => t.type === 'gasto' && t.amount <= hormigaThreshold)
    const todayHormiga = allHormiga.filter(t => t.date === todayStr)
    const monthHormiga = allHormiga.filter(t => t.date.startsWith(currentMonthPrefix))
    
    const todayTotal = todayHormiga.reduce((acc, t) => acc + t.amount, 0)
    const monthTotal = monthHormiga.reduce((acc, t) => acc + t.amount, 0)
    
    return { todayHormiga, todayTotal, monthTotal, monthLimit: hormigaDailyLimit * currentDay }
  }, [transactions, hormigaThreshold, hormigaDailyLimit, currentDay])

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">Presupuestos</h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 italic">Control de gastos y límites por categoría.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <span className="material-symbols-outlined text-lg">add</span>
            Nuevo
          </Button>
        </div>
      </div>

      {/* Resumen Global */}
      <Card className="relative overflow-hidden group shadow-xl" padding={false}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="p-6 relative z-10">
          <p className="text-sm font-semibold text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide mb-5">Resumen del Mes</p>
          <div className="flex flex-col md:flex-row gap-6 md:items-end mb-8">
             <div className="flex-1">
              <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase tracking-wider mb-2 font-medium">Gasto Total Acumulado</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tabular-nums tracking-tight text-light-text dark:text-dark-text drop-shadow-sm">{formatMXN(totalSpent)}</span>
                 <span className="text-sm font-semibold text-light-text-2 dark:text-dark-text-2">/ {formatMXN(totalLimit)}</span>
              </div>
            </div>
            <div className="md:w-48 glass bg-white/40 dark:bg-black/20 rounded-2xl p-4 border border-light-border/50 dark:border-dark-border/50 shadow-inner">
               <p className="text-[10px] font-bold text-light-text-2 dark:text-dark-text-2 uppercase tracking-widest mb-1.5">Proyección fin de mes</p>
               <p className={`text-xl font-extrabold tabular-nums drop-shadow-sm ${projectedSpent > totalLimit ? 'text-danger' : 'text-primary'}`}>
                {formatMXN(projectedSpent)}
              </p>
             </div>
           </div>
           <ProgressBar value={totalSpent} max={totalLimit} color={globalColor} ghost={projectedSpent} />
         </div>
       </Card>

      {/* Categorías */}
      <div>
        <h2 className="text-lg font-bold text-light-text dark:text-dark-text mb-4">Por categoría</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map(b => {
            const status = getBudgetStatus(b)
            const color = status === 'ok' ? '#10B981' : status === 'warning' ? '#F59E0B' : '#EF4444'
            const pct = Math.min((b.spent / b.monthlyLimit) * 100, 100)

            return (
              <Card key={b.id} onClick={() => handleOpenDetail(b)} clickable className="transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 opacity-10 pointer-events-none transition-transform group-hover:scale-110" style={{ backgroundColor: color }} />
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: `${color}15`, color }}>
                    <span className="material-symbols-outlined text-2xl">{CATEGORY_ICONS[b.category]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-light-text dark:text-dark-text tracking-tight capitalize">{CATEGORY_LABELS[b.category]}</h3>
                    <p className="text-xs font-medium text-light-text-2 dark:text-dark-text-2 mt-1">
                      {formatMXN(b.monthlyLimit - b.spent)} disponibles
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-lg tabular-nums text-light-text dark:text-dark-text drop-shadow-sm">{formatMXN(b.spent)}</p>
                    <p className="text-xs font-medium text-light-text-2 dark:text-dark-text-2 mt-1">de {formatMXN(b.monthlyLimit)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex-1">
                    <ProgressBar value={b.spent} max={b.monthlyLimit} color={color} />
                  </div>
                  <span className="text-xs font-bold tabular-nums w-10 text-right" style={{ color }}>
                    {Math.round(pct)}%
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Gastos Anuales Amortizados */}
      <Card className="group relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">event_repeat</span>
            <h2 className="text-lg font-bold text-light-text dark:text-dark-text">Gastos anuales amortizados</h2>
          </div>
          <Button variant="ghost" size="sm">+ Agregar</Button>
        </div>
        
        <div className="space-y-4">
          {[
            { name: 'Predial', freq: 'Anual', amount: 3000, monthly: 250, next: '2027-01-15' },
            { name: 'Seguro de auto', freq: 'Anual', amount: 8400, monthly: 700, next: '2026-08-10' },
            { name: 'Seguro Médico (GMM)', freq: 'Semestral', amount: 9000, monthly: 1500, next: '2026-06-01' }
          ].map((gasto, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-card glass hover:bg-light-surface dark:hover:bg-dark-surface transition-colors border border-transparent hover:border-light-border dark:hover:border-dark-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-light-text dark:text-dark-text">{gasto.name}</span>
                  <Badge variant="neutral">{gasto.freq}</Badge>
                </div>
                <p className="text-xs text-light-text-2 dark:text-dark-text-2">Próximo: {gasto.next} • {formatMXN(gasto.amount)} total</p>
              </div>
              <div className="flex items-center gap-4 mt-3 md:mt-0">
                <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">= {formatMXN(gasto.monthly)}/mes</span>
                <Toggle checked={true} onChange={() => {}} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border flex justify-between items-center text-sm">
          <span className="text-light-text-2 dark:text-dark-text-2">Total amortizado mensual:</span>
          <span className="font-bold text-light-text dark:text-dark-text">{formatMXN(2450)}</span>
        </div>
      </Card>

      {/* Control de Gastos Hormiga */}
      <Card className="bg-warning/5 border border-warning/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-warning">bug_report</span>
          <h2 className="text-lg font-bold text-light-text dark:text-dark-text">Control de Gastos Hormiga</h2>
        </div>
        <p className="text-sm text-light-text-2 dark:text-dark-text-2 mb-6">
          Gastos menores a {formatMXN(hormigaThreshold)} por transacción. Pequeños en monto, grandes en impacto acumulado.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="font-medium text-light-text dark:text-dark-text">Umbral por transacción</label>
                <span className="text-light-text-2 dark:text-dark-text-2">{formatMXN(hormigaThreshold)}</span>
              </div>
              <input type="range" min="50" max="500" step="50" value={hormigaThreshold} onChange={(e) => setHormigaThreshold(Number(e.target.value))} className="w-full h-1.5 bg-light-border dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-warning" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="font-medium text-light-text dark:text-dark-text">Límite diario</label>
                <span className="text-light-text-2 dark:text-dark-text-2">{formatMXN(hormigaDailyLimit)}</span>
              </div>
              <input type="range" min="100" max="1000" step="50" value={hormigaDailyLimit} onChange={(e) => setHormigaDailyLimit(Number(e.target.value))} className="w-full h-1.5 bg-light-border dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-warning" />
            </div>
          </div>

          <div className="bg-light-card/80 dark:bg-dark-card/80 rounded-card p-4 border border-light-border dark:border-dark-border">
            <h3 className="text-sm font-semibold mb-3">Hoy</h3>
            <div className="flex justify-between items-end mb-1 text-sm">
               <span className="font-bold text-light-text dark:text-dark-text">{formatMXN(hormigaData.todayTotal)}</span>
               <span className="text-light-text-2 dark:text-dark-text-2">de {formatMXN(hormigaDailyLimit)}</span>
            </div>
            <ProgressBar value={hormigaData.todayTotal} max={hormigaDailyLimit} color={hormigaData.todayTotal > hormigaDailyLimit ? '#EF4444' : '#F59E0B'} />
            
            {hormigaData.todayTotal > hormigaDailyLimit && (
              <div className="mt-3 bg-danger/10 text-danger text-xs px-2 py-1.5 rounded text-center animate-pulse font-medium">
                Límite diario superado
              </div>
            )}
            
            <div className="mt-4 space-y-2">
              {hormigaData.todayHormiga.length === 0 ? (
                <p className="text-xs text-center text-success font-medium py-2">Sin gastos hormiga hoy 🎉</p>
              ) : (
                hormigaData.todayHormiga.slice(0, 3).map(t => (
                  <div key={t.id} className="flex justify-between text-xs">
                    <span className="text-light-text-2 dark:text-dark-text-2 truncate pr-2">{t.description}</span>
                    <span className="text-light-text dark:text-dark-text font-medium">{formatMXN(t.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-warning/20 pt-4 mt-2">
           <div className="flex justify-between items-end mb-1 text-sm">
             <span className="text-light-text-2 dark:text-dark-text-2 font-medium">Acumulado del mes</span>
             <span><strong className="text-light-text dark:text-dark-text">{formatMXN(hormigaData.monthTotal)}</strong> <span className="text-xs text-light-text-2 dark:text-dark-text-2">vs {formatMXN(hormigaDailyLimit * 30)} equiv.</span></span>
           </div>
           <ProgressBar value={hormigaData.monthTotal} max={hormigaData.monthLimit} color={hormigaData.monthTotal > hormigaData.monthLimit ? '#EF4444' : '#F59E0B'} />
        </div>
      </Card>

      {/* MODAL DETALLE DE CATEGORÍA */}
      <Modal isOpen={!!selectedBudget} onClose={() => setSelectedBudget(null)} title="Detalle de Categoría" size="lg">
        {selectedBudget && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${getBudgetStatus(selectedBudget) === 'ok' ? '#10B981' : getBudgetStatus(selectedBudget) === 'warning' ? '#F59E0B' : '#EF4444'}15`, color: getBudgetStatus(selectedBudget) === 'ok' ? '#10B981' : getBudgetStatus(selectedBudget) === 'warning' ? '#F59E0B' : '#EF4444' }}>
                <span className="material-symbols-outlined text-2xl">{CATEGORY_ICONS[selectedBudget.category]}</span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-light-text dark:text-dark-text capitalize">{CATEGORY_LABELS[selectedBudget.category]}</h3>
                <div className="flex items-center gap-2 text-sm mt-0.5">
                  <span className="font-bold text-light-text dark:text-dark-text">{formatMXN(selectedBudget.spent)}</span>
                  <span className="text-light-text-2 dark:text-dark-text-2">/ {formatMXN(selectedBudget.monthlyLimit)}</span>
                  <Badge variant={getBudgetStatus(selectedBudget) === 'ok' ? 'success' : getBudgetStatus(selectedBudget) === 'warning' ? 'warning' : 'danger'}>
                    {getBudgetStatus(selectedBudget)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* SECCIÓN A: Gráfica Acumulada */}
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v) => `$${v}`} />
                  <RechartsTooltip cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ backgroundColor: '#1A1A1A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }} itemStyle={{ color: '#fff' }} formatter={(val: number) => [formatMXN(val), 'Acumulado']} labelFormatter={(l) => `Día ${l}`} />
                  <ReferenceLine y={selectedBudget.monthlyLimit} stroke="#9CA3AF" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="real" stroke="#2563EB" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* SECCIÓN B: Editar Límite */}
            <div className="flex items-end gap-3 bg-light-surface dark:bg-dark-surface p-4 rounded-card">
               <div className="flex-1">
                 <Input label="Límite mensual" type="number" value={editLimit} onChange={(e) => setEditLimit(e.target.value)} />
               </div>
               <Button onClick={handleSaveLimit}>Guardar</Button>
            </div>

            {/* SECCIÓN C: Historial (mock) */}
            <div>
              <p className="text-sm font-semibold mb-2">Historial reciente</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  { month: 'Enero', spent: selectedBudget.monthlyLimit * 0.9, status: 'ok' },
                  { month: 'Febrero', spent: selectedBudget.monthlyLimit * 1.1, status: 'danger' },
                  { month: 'Marzo', spent: selectedBudget.spent, status: getBudgetStatus(selectedBudget) }
                ].map((m, i) => (
                  <div key={i} className="flex-shrink-0 border border-light-border dark:border-dark-border px-3 py-2 rounded-card text-xs flex flex-col items-center min-w-[80px]">
                    <span className="text-light-text-2 dark:text-dark-text-2 mb-1">{m.month}</span>
                    <span className="font-bold mb-1">{formatMXN(m.spent)}</span>
                    <Badge variant={m.status as any}>{m.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN D: Transacciones */}
            <div>
               <p className="text-sm font-semibold mb-2">Transacciones este mes</p>
               {categoryTxs.length === 0 ? (
                 <EmptyState icon="receipt_long" title="Sin transacciones" description="No tienes gastos registrados en esta categoría durante este mes." />
               ) : (
                 <div className="space-y-2">
                   {categoryTxs.map(t => (
                     <div key={t.id} className="flex justify-between text-sm py-2 border-b border-light-border dark:border-dark-border last:border-0">
                        <div>
                          <p className="font-medium text-light-text dark:text-dark-text">{t.description}</p>
                          <p className="text-xs text-light-text-2 dark:text-dark-text-2">{t.date}</p>
                        </div>
                        <span className="font-bold text-danger">{formatMXN(t.amount)}</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>

          </div>
        )}
      </Modal>

    </div>
  )
}
