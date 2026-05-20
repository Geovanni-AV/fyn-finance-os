import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { Button, Card, ProgressBar, Modal, Input, Toggle, Badge, EmptyState, Drawer } from '../../components/ui'
import { formatMXN, formatMXNShort, CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_COLORS, getBudgetStatus, Budget, type CategoryId } from '../../types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useToast } from '../../context/ToastContext'

export default function Presupuestos() {
  const { budgets, transactions, addBudget, updateBudget, deleteBudget, refreshData } = useApp()
  const { success, error: toastError } = useToast()

  const currentPeriod = useMemo(() => new Date().toISOString().slice(0, 7), [])

  const { totalLimit, totalSpent } = useMemo(() => {
    return budgets.reduce((acc, b) => ({
      totalLimit: acc.totalLimit + b.monthlyLimit,
      totalSpent: acc.totalSpent + b.spent,
    }), { totalLimit: 0, totalSpent: 0 })
  }, [budgets])

  const globalPct = totalLimit > 0 ? totalSpent / totalLimit : 0
  const globalColor = globalPct > 0.9 ? '#EF4444' : globalPct > 0.7 ? '#F59E0B' : '#10B981'

  // Simple linear projection (assuming constant spending speed)
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

  const handleSaveLimit = async () => {
    if (selectedBudget && editLimit) {
      const num = Number(editLimit)
      if (!isNaN(num) && num >= 0) {
        try {
          await updateBudget(selectedBudget.id, { monthlyLimit: num })
          success('Límite de presupuesto actualizado')
          setSelectedBudget(null)
          await refreshData()
        } catch (err: any) {
          toastError(err.message || 'Error al actualizar el límite')
        }
      }
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este límite de presupuesto?')) {
      try {
        await deleteBudget(id)
        success('Límite de presupuesto eliminado')
        setSelectedBudget(null)
        await refreshData()
      } catch (err: any) {
        toastError(err.message || 'Error al eliminar el presupuesto')
      }
    }
  }

  // --- CREATE BUDGET DRAWER ---
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newCategory, setNewCategory] = useState<CategoryId>('alimentacion')
  const [newLimit, setNewLimit] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLimit || isNaN(Number(newLimit)) || Number(newLimit) <= 0) {
      toastError('Por favor introduce un límite mensual válido')
      return
    }

    // Check if budget for this category and period already exists
    const exists = budgets.some(b => b.category === newCategory)
    if (exists) {
      toastError('Ya existe un presupuesto para esta categoría este mes. Puedes editarlo directamente.')
      return
    }

    try {
      setIsSubmitting(true)
      await addBudget({
        category: newCategory,
        monthlyLimit: Number(newLimit),
        period: currentPeriod,
        spent: 0
      })
      success('Límite de presupuesto registrado exitosamente')
      setIsAddOpen(false)
      setNewLimit('')
      await refreshData()
    } catch (err: any) {
      toastError(err.message || 'Error al guardar el presupuesto')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- TEMPLATE CLONING ---
  const handleCloneDefaultTemplate = async () => {
    try {
      const defaults = [
        { category: 'alimentacion', limit: 6000 },
        { category: 'servicios', limit: 3000 },
        { category: 'hogar', limit: 5000 },
        { category: 'transporte', limit: 2000 },
        { category: 'entretenimiento', limit: 1500 },
        { category: 'otros', limit: 1000 }
      ]
      
      setIsSubmitting(true)
      for (const item of defaults) {
        // Skip if already exists
        if (budgets.some(b => b.category === item.category)) continue
        
        await addBudget({
          category: item.category as CategoryId,
          monthlyLimit: item.limit,
          period: currentPeriod,
          spent: 0
        })
      }
      success('Límites recomendados inicializados correctamente')
      await refreshData()
    } catch (err: any) {
      toastError(err.message || 'Error al clonar plantilla')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cumulative graph for selected category
  const chartData = useMemo(() => {
    if (!selectedBudget) return []
    const txs = transactions.filter(t => t.category === selectedBudget.category && t.date.startsWith(selectedBudget.period))
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

  // Category history calculated dynamically from SQLite transaction aggregates
  const categoryHistory = useMemo(() => {
    if (!selectedBudget) return []
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const history = []
    
    for (let i = 2; i >= 0; i--) {
      const d = new Date()
      d.setMonth(today.getMonth() - i)
      const mStr = d.toISOString().slice(0, 7)
      const monthLabel = monthNames[d.getMonth()]
      
      const spent = transactions
        .filter(t => t.category === selectedBudget.category && t.date.startsWith(mStr) && t.type === 'gasto')
        .reduce((sum, t) => sum + t.amount, 0)
        
      const status = spent > selectedBudget.monthlyLimit ? 'danger' : spent > selectedBudget.monthlyLimit * 0.7 ? 'warning' : 'ok'
      
      history.push({ month: monthLabel, spent, status })
    }
    return history
  }, [selectedBudget, transactions, today])

  // --- GASTOS HORMIGA ---
  const [hormigaThreshold, setHormigaThreshold] = useState(200)
  const [hormigaDailyLimit, setHormigaDailyLimit] = useState(230)
  
  const hormigaData = useMemo(() => {
    const todayStr = today.toISOString().split('T')[0]
    const currentMonthPrefix = todayStr.substring(0, 7)
    
    const allHormiga = transactions.filter(t => t.type === 'gasto' && t.amount <= hormigaThreshold)
    const todayHormiga = allHormiga.filter(t => t.date === todayStr)
    const monthHormiga = allHormiga.filter(t => t.date.startsWith(currentMonthPrefix))
    
    const todayTotal = todayHormiga.reduce((acc, t) => acc + t.amount, 0)
    const monthTotal = monthHormiga.reduce((acc, t) => acc + t.amount, 0)
    
    return { todayHormiga, todayTotal, monthTotal, monthLimit: hormigaDailyLimit * currentDay }
  }, [transactions, hormigaThreshold, hormigaDailyLimit, currentDay, today])

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Auditoría de Egresos</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark">
            Control de <br />
            <span className="text-primary/40">Presupuestos.</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setIsAddOpen(true)} className="!rounded-full !px-8 shadow-luster">
            <span className="material-symbols-outlined text-lg mr-1">add</span>
            Nuevo Límite
          </Button>
        </div>
      </div>

      {budgets.length === 0 ? (
        /* Empty State Premium: Subtle radial distribution lines */
        <div className="depth-1 p-16 rounded-[3rem] text-center max-w-2xl mx-auto space-y-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-primary/10 transition-colors" />
          
          <div className="w-24 h-24 rounded-full bg-atelier-bg-3-light dark:bg-atelier-bg-3-dark flex items-center justify-center mx-auto shadow-inner relative group-hover:scale-105 transition-transform duration-500">
            {/* Subtle radial distribution lines visualization */}
            <svg className="w-16 h-16 text-primary/30 animate-pulse" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 6" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="1" strokeDasharray="1 3" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="1 3" />
            </svg>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark uppercase tracking-tight">Configure sus límites mensuales</h2>
            <p className="text-sm text-atelier-text-main-light dark:text-atelier-text-main-dark italic opacity-70">
              Defina las cotas para cada categoría de egreso real
            </p>
            <p className="text-xs text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-50 max-w-md mx-auto leading-relaxed">
              No se han encontrado presupuestos activos para este periodo. FYN te permite asignar límites a tus consumos por categoría para vigilar desviaciones e identificar fugas de flujo de caja en tiempo real.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleCloneDefaultTemplate} variant="secondary" className="!rounded-full px-8 py-3.5 !text-[10px] font-black uppercase tracking-widest" disabled={isSubmitting}>
              <span className="material-symbols-outlined text-base mr-2">auto_awesome</span> Inicializar Plantilla Recomendada
            </Button>
            <Button onClick={() => setIsAddOpen(true)} className="!rounded-full px-8 py-3.5 !text-[10px] font-black uppercase tracking-widest shadow-luster" disabled={isSubmitting}>
              <span className="material-symbols-outlined text-base mr-2">add</span> Configurar Límite Manual
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Global Hero Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60">Gasto Acumulado en Periodo</p>
                <p className="text-6xl lg:text-7xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter tabular-nums">
                  {formatMXN(totalSpent)}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Límite Global</span>
                  <span className="text-lg font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark opacity-80">{formatMXN(totalLimit)}</span>
                </div>
                <div className="h-8 w-px bg-primary/10" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Proyección</span>
                  <span className={`text-lg font-bold tabular-nums ${projectedSpent > totalLimit ? 'text-danger' : 'text-primary'}`}>
                    {formatMXN(projectedSpent)}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-end space-y-4">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Rendimiento Presupuestal</span>
                  <span className="text-2xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tabular-nums">{Math.round(globalPct * 100)}%</span>
               </div>
               <div className="h-4 w-full depth-1 rounded-full overflow-hidden p-1">
                 <div 
                   className="h-full rounded-full transition-all duration-1000 ease-out shadow-luster"
                   style={{ 
                     width: `${Math.min(globalPct * 100, 100)}%`,
                     backgroundColor: globalColor
                   }}
                 />
               </div>
               <p className="text-[10px] font-bold text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">
                 {projectedSpent > totalLimit ? 'Precaución: La proyección indica una desviación del presupuesto.' : 'Optimización: Los gastos se mantienen dentro de los parámetros esperados.'}
               </p>
            </div>
          </div>

          {/* Categorías List Layout */}
          <div className="space-y-10 pt-8">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60">Desglose por División Técnica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
              {budgets.map(b => {
                const status = getBudgetStatus(b)
                const color = status === 'ok' ? '#10B981' : status === 'warning' ? '#F59E0B' : '#EF4444'
                const pct = Math.min((b.spent / b.monthlyLimit) * 100, 100)

                return (
                  <div key={b.id} onClick={() => handleOpenDetail(b)} className="group cursor-pointer space-y-4 active:scale-[0.98] transition-all">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full depth-1 flex items-center justify-center group-hover:depth-2 transition-all">
                          <span className="material-symbols-outlined text-xl" style={{ color }}>{CATEGORY_ICONS[b.category]}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight uppercase">{CATEGORY_LABELS[b.category]}</h3>
                          <p className="text-[10px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest opacity-40 mt-0.5">{formatMXNShort(b.monthlyLimit)} Límite</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tabular-nums tracking-tighter">{formatMXNShort(b.spent)}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{Math.round(pct)}% Utilizado</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-atelier-bg-3-light dark:bg-atelier-bg-3-dark rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ 
                          width: `${pct}%`,
                          backgroundColor: color,
                          opacity: status === 'ok' ? 0.6 : 1
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Control Micro-Gastos (Hormiga) Technical Panel */}
      <div className="pt-12">
        <div className="depth-1 rounded-[3rem] p-12 space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Auditoría de Micro-Transacciones</h2>
              <p className="text-sm text-atelier-text-main-light dark:text-atelier-text-main-dark font-medium italic opacity-60 max-w-md leading-relaxed">Control de fugas de capital menores a {formatMXN(hormigaThreshold)} por evento.</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Acumulado Mes</p>
              <p className="text-4xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tabular-nums tracking-tighter">{formatMXNShort(hormigaData.monthTotal)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Parameters Control */}
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60 italic">Umbral por Evento</span>
                  <span className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark">{formatMXN(hormigaThreshold)}</span>
                </div>
                <input type="range" min="50" max="500" step="50" value={hormigaThreshold} onChange={(e) => setHormigaThreshold(Number(e.target.value))} className="w-full h-1 bg-primary/10 rounded-full appearance-none cursor-pointer accent-primary" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60 italic">Cota Diaria Estimada</span>
                  <span className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark">{formatMXN(hormigaDailyLimit)}</span>
                </div>
                <input type="range" min="100" max="1000" step="50" value={hormigaDailyLimit} onChange={(e) => setHormigaDailyLimit(Number(e.target.value))} className="w-full h-1 bg-primary/10 rounded-full appearance-none cursor-pointer accent-primary" />
              </div>
            </div>

            {/* Performance Meter */}
            <div className="space-y-6">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60">Consumo Hoy</span>
                  <p className="text-xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tabular-nums">{formatMXN(hormigaData.todayTotal)}</p>
               </div>
               <div className="h-2 w-full bg-primary/5 rounded-full overflow-hidden">
                 <div 
                   className="h-full rounded-full transition-all duration-700"
                   style={{ 
                     width: `${Math.min((hormigaData.todayTotal / hormigaDailyLimit) * 100, 100)}%`,
                     backgroundColor: hormigaData.todayTotal > hormigaDailyLimit ? '#EF4444' : '#10B981',
                     opacity: 0.8
                   }}
                 />
               </div>
               <div className="flex justify-between">
                 <span className="text-[9px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest opacity-20 italic">0%</span>
                 <span className="text-[9px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest opacity-20 italic">100% (Target)</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Modal isOpen={!!selectedBudget} onClose={() => setSelectedBudget(null)} title="Detalle de Categoría" size="lg">
        {selectedBudget && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
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
              
              <button 
                onClick={() => handleDeleteBudget(selectedBudget.id)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-danger/10 hover:bg-danger text-danger hover:text-white transition-all cursor-pointer"
                title="Eliminar Presupuesto"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>

            {/* SECCIÓN A: Cumulative Graph */}
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

            {/* SECCIÓN B: Edit Limit */}
            <div className="flex items-end gap-3 bg-light-surface dark:bg-dark-surface p-4 rounded-card">
               <div className="flex-1">
                 <Input label="Límite mensual" type="number" value={editLimit} onChange={(e) => setEditLimit(e.target.value)} />
               </div>
               <Button onClick={handleSaveLimit}>Guardar</Button>
            </div>

            {/* SECCIÓN C: History calculated dynamically */}
            <div>
              <p className="text-sm font-semibold mb-2">Historial reciente</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {categoryHistory.map((m, i) => (
                  <div key={i} className="flex-shrink-0 border border-light-border dark:border-dark-border px-3 py-2 rounded-card text-xs flex flex-col items-center min-w-[100px]">
                    <span className="text-light-text-2 dark:text-dark-text-2 mb-1">{m.month}</span>
                    <span className="font-bold mb-1">{formatMXN(m.spent)}</span>
                    <Badge variant={m.status as any}>{m.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN D: Real Transactions list */}
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

      {/* NEW BUDGET DRAWER */}
      <Drawer isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Registrar Límite" width={420}>
        <form onSubmit={handleCreateBudget} className="space-y-6 p-4">
          <p className="text-xs text-light-text-2 dark:text-dark-text-2 mb-4 leading-relaxed">
            Asigna un límite mensual a una categoría específica para monitorear en tiempo real tus desviaciones de capital.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark ml-1">Categoría</label>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as CategoryId)}
              className="w-full depth-1 rounded-2xl px-4 py-3 text-sm text-atelier-text-main-light dark:text-atelier-text-main-dark bg-light-surface dark:bg-dark-surface border-2 border-transparent focus:border-primary/20 focus:outline-none focus:depth-2 focus:shadow-luster transition-all duration-300"
            >
              {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          <Input 
            label="Límite Mensual ($)" 
            type="number"
            placeholder="Ej. 5000" 
            value={newLimit} 
            onChange={e => setNewLimit(e.target.value)} 
          />

          <div className="pt-8">
            <Button type="submit" size="lg" className="w-full justify-center h-14" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin material-symbols-outlined mr-2">progress_activity</span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">save</span>
                  Guardar Límite
                </>
              )}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
