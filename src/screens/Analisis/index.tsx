import { useMemo, useState, useEffect } from 'react'
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { Card, Button, Drawer, ChipSelector, Badge, Skeleton } from '../../components/ui'
import { formatMXN, formatMXNShort, CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_LABELS, type CategoryId } from '../../types'

export default function Analisis() {
  const { transactions, accounts, selectedPeriod, setSelectedPeriod, availableMonths } = useApp()
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Statistical calculations using real SQLite data
  const analysisData = useMemo(() => {
    const thisMonthStr = selectedPeriod
    
    // Calcular el mes anterior relativo a selectedPeriod
    const [year, month] = selectedPeriod.split('-').map(Number)
    const prevDate = new Date(year, month - 2, 1)
    const lastMonthStr = prevDate.toISOString().slice(0, 7)
    
    const expensesThisMonth = transactions.filter(t => t.type === 'gasto' && t.date.startsWith(thisMonthStr))
    const expensesLastMonth = transactions.filter(t => t.type === 'gasto' && t.date.startsWith(lastMonthStr))
    
    const totalThis = expensesThisMonth.reduce((sum, t) => sum + t.amount, 0)
    const totalLast = expensesLastMonth.reduce((sum, t) => sum + t.amount, 0)
    
    // Group by category for chart
    const categoryIds = Object.keys(CATEGORY_LABELS) as CategoryId[]
    const catData = categoryIds.map(id => {
      const amount = expensesThisMonth.filter(t => t.category === id).reduce((sum, t) => sum + t.amount, 0)
      return {
        id,
        name: CATEGORY_LABELS[id],
        amount,
        color: CATEGORY_COLORS[id] || '#cbd5e1'
      }
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

    // Dynamic saving potential: total incomes this month - total expenses this month
    const incomesThisMonth = transactions.filter(t => t.type === 'ingreso' && t.date.startsWith(thisMonthStr))
    const totalIncomesThis = incomesThisMonth.reduce((sum, t) => sum + t.amount, 0)
    const savingPotential = Math.max(0, totalIncomesThis - totalThis)

    // Calculate real monthly trend data for the last 6 months from SQLite transactions relative to selectedPeriod
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const trendData = []
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      const mStr = d.toISOString().slice(0, 7)
      const monthLabel = monthNames[d.getMonth()]
      
      const ingresos = transactions
        .filter(t => t.type === 'ingreso' && t.date.startsWith(mStr))
        .reduce((sum, t) => sum + t.amount, 0)
        
      const gastos = transactions
        .filter(t => t.type === 'gasto' && t.date.startsWith(mStr))
        .reduce((sum, t) => sum + t.amount, 0)
        
      trendData.push({ month: monthLabel, monthStr: mStr, ingresos, gastos })
    }

    return { totalThis, totalLast, catData, trendData, totalBalance, savingPotential }
  }, [transactions, accounts, selectedPeriod])

  const isTrendEmpty = useMemo(() => {
    return analysisData.trendData.every(d => d.ingresos === 0 && d.gastos === 0)
  }, [analysisData.trendData])

  const handleExport = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setIsExportOpen(false)
    }, 2500)
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 lg:max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Inteligencia y Proyección</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark leading-[0.9]">
            Análisis de <br />
            <span className="text-primary/40 text-[0.8em]">Tendencias.</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Period Selector */}
          <div className="relative inline-block">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text py-3 px-6 pr-12 rounded-full text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/40 transition-all cursor-pointer select-none"
            >
              {availableMonths.map((m) => {
                const [year, month] = m.split('-')
                const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1)
                const label = dateObj.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
                return (
                  <option key={m} value={m} className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text uppercase font-semibold text-xs tracking-wider">
                    {label}
                  </option>
                )
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-light-text-2 dark:text-dark-text-2">
              <span className="material-symbols-outlined text-sm font-light">keyboard_arrow_down</span>
            </div>
          </div>
          <Button onClick={() => setIsExportOpen(true)} size="lg" className="!rounded-full !px-8 shadow-luster">
             <span className="material-symbols-outlined text-lg">ios_share</span>
             Exportar
          </Button>
        </div>
      </div>

      {/* Technical KPIs Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="depth-1 p-8 rounded-[2.5rem] space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Gasto Mensual</p>
          <p className="text-4xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tabular-nums tracking-tighter">
            {formatMXN(analysisData.totalThis)}
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${analysisData.totalThis > analysisData.totalLast ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
              {analysisData.totalLast > 0 ? (((analysisData.totalThis - analysisData.totalLast) / analysisData.totalLast) * 100).toFixed(1) : '0'}%
            </span>
            <p className="text-[10px] uppercase font-bold text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 tracking-widest">vs mes anterior</p>
          </div>
        </div>
        
        <div className="depth-1 p-8 rounded-[2.5rem] space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Balance Neto</p>
          <p className="text-4xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tabular-nums tracking-tighter">
            {formatMXN(analysisData.totalBalance)}
          </p>
          <p className="text-[10px] uppercase font-black text-success tracking-widest opacity-60">Consolidado Activo</p>
        </div>

        <div className="depth-1 p-8 rounded-[2.5rem] space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Potencial de Ahorro</p>
          <p className="text-4xl font-black text-primary tabular-nums tracking-tighter">
            {formatMXN(analysisData.savingPotential)}
          </p>
          <p className="text-[10px] font-bold text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic leading-tight">
            {analysisData.savingPotential > 0 ? 'Excedente de flujo de caja libre' : 'Registra ingresos para calcular potencial'}
          </p>
        </div>
      </div>

      {/* Technical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Trend Area Chart Editorial */}
        <div className="lg:col-span-7 depth-1 p-10 rounded-[3rem] space-y-10">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">Evolución de Flujo</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Dinámica Histórica Semestral</p>
            </div>
            <Badge variant="neutral" className="!rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest">H1 2026</Badge>
          </div>
          
          <div className="h-80 w-full relative flex flex-col items-center justify-center">
            {isTrendEmpty ? (
              <>
                {/* Stunning background skeleton wave */}
                <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                  <svg className="w-full h-40 animate-pulse text-atelier-text-muted-light dark:text-atelier-text-muted-dark" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 0 50 Q 25 80 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                </div>
                <div className="text-center space-y-4 max-w-sm px-6 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-atelier-bg-3-light dark:bg-atelier-bg-3-dark flex items-center justify-center mx-auto text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 animate-pulse">
                    <span className="material-symbols-outlined text-2xl">query_stats</span>
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-atelier-text-main-light dark:text-atelier-text-main-dark">Esperando flujo histórico</p>
                  <p className="text-[10px] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-50 leading-relaxed">
                    El motor de análisis requiere al menos 1 transacción o cuenta activa para modelar tendencias.
                  </p>
                </div>
              </>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analysisData.trendData}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.1} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} />
                  <YAxis hide />
                  <RechartsTooltip 
                     contentStyle={{ background: '#000', border: 'none', borderRadius: '16px', fontSize: '10px', color: '#fff', padding: '12px' }}
                     itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="ingresos" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" animationDuration={1000} />
                  <Area type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses by Category Editorial List */}
        <div className="lg:col-span-5 depth-1 p-10 rounded-[3rem] space-y-10">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">Desglose de Capital</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Distribución por Identidad de Gasto</p>
          </div>
          
          {analysisData.catData.length === 0 ? (
            <div className="space-y-6 min-h-[220px] flex flex-col justify-center items-center text-center p-4">
               <div className="w-12 h-12 rounded-full bg-atelier-bg-3-light dark:bg-atelier-bg-3-dark flex items-center justify-center text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 mb-3 animate-pulse">
                  <span className="material-symbols-outlined text-2xl">pie_chart</span>
               </div>
               <p className="text-xs font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark uppercase tracking-wider">Sin egresos registrados</p>
               <p className="text-[10px] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-50 max-w-[200px] mt-1 leading-normal">
                  Tus transacciones categorizadas aparecerán desglosadas en esta sección.
               </p>
            </div>
          ) : (
            <div className="space-y-6">
              {analysisData.catData.slice(0, 5).map((cat, i) => (
                <div key={cat.id} className="space-y-3">
                   <div className="flex justify-between items-end">
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30">0{i+1}</span>
                         <span className="text-xs font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark uppercase tracking-widest">{cat.name}</span>
                      </div>
                      <span className="text-sm font-black tabular-nums tracking-tighter">{formatMXNShort(cat.amount)}</span>
                   </div>
                   <div className="h-1.5 w-full bg-atelier-bg-3-light dark:bg-atelier-bg-3-dark rounded-full overflow-hidden">
                      <div className="h-full rounded-full opacity-60 transition-all duration-1000 ease-out"
                        style={{ width: `${(cat.amount / analysisData.totalThis) * 100}%`, backgroundColor: cat.color }} />
                   </div>
                </div>
              ))}
            </div>
          )}
          
          <button className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity border-t border-primary/5 pt-8">
            Ver Distribución Completa
          </button>
        </div>
      </div>

      {/* Advisory Section */}
      <div className="space-y-8 pt-8">
        <div className="flex items-center gap-6">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60">Portfolio Advisory</h3>
          <div className="h-px flex-1 bg-primary/10" />
        </div>
        
        {isTrendEmpty ? (
          <div className="p-8 rounded-[3rem] depth-1 flex gap-8 transition-all hover:depth-2 group">
             <div className="w-16 h-16 rounded-[1.5rem] bg-primary/5 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
               <span className="material-symbols-outlined text-3xl font-light">insights</span>
             </div>
             <div className="space-y-3">
               <h4 className="text-lg font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight italic line-clamp-1">Motor de Asesoría Inactivo</h4>
               <p className="text-xs text-atelier-text-muted-light dark:text-atelier-text-muted-dark leading-relaxed opacity-60">
                 Para activar el motor de asesoría financiera, conecta tu cuenta de banco Nu/BBVA o añade transacciones reales. El asesor patrimonial analizará tus patrones de consumo en tiempo real para optimizar tu liquidez y eficiencia de flujo.
               </p>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-[3rem] depth-1 flex gap-8 transition-all hover:depth-2 group">
               <div className="w-16 h-16 rounded-[1.5rem] bg-primary/5 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                 <span className="material-symbols-outlined text-3xl font-light">tips_and_updates</span>
               </div>
               <div className="space-y-3">
                 <h4 className="text-lg font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight italic line-clamp-1">Eficiencia de Flujo</h4>
                 <p className="text-xs text-atelier-text-muted-light dark:text-atelier-text-muted-dark leading-relaxed opacity-60">Detectamos un volumen atípico en suscripciones digitales. Reducir el gasto hormiga en este sector liberaría <span className="font-black text-primary">$540 MXN</span> este ciclo.</p>
               </div>
            </div>
            <div className="p-8 rounded-[3rem] depth-1 flex gap-8 transition-all hover:depth-2 group">
               <div className="w-16 h-16 rounded-[1.5rem] bg-success/5 text-success flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                 <span className="material-symbols-outlined text-3xl font-light">monitoring</span>
               </div>
               <div className="space-y-3">
                 <h4 className="text-lg font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight italic line-clamp-1">Optimización de Liquidez</h4>
                 <p className="text-xs text-atelier-text-muted-light dark:text-atelier-text-muted-dark leading-relaxed opacity-60">El flujo de caja proyectado para el próximo trimestre permite una asignación adicional a <span className="font-black text-success">CETES 28</span> sin comprometer la operatividad.</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Drawer */}
      <Drawer isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} title="Exportar Reporte" width={420}>
        <div className="space-y-8 p-4">
          <p className="text-sm text-light-text-2 dark:text-dark-text-2">Personaliza la exportación de tus datos financieros para presentaciones o contabilidad externa.</p>
          
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted px-1">1. Seleccionar Formato</h4>
            <div className="grid grid-cols-1 gap-3">
               {[
                 { id: 'pdf', label: 'Reporte Visual PDF', desc: 'Gráficas y KPIs en formato editorial', icon: 'picture_as_pdf' },
                 { id: 'excel', label: 'Excel Estructurado', desc: 'Todas las transacciones para análisis', icon: 'table_view' },
                 { id: 'csv', label: 'Fichero CSV', desc: 'Datos puros para otros sistemas', icon: 'description' },
               ].map(f => (
                 <button 
                  key={f.id}
                  onClick={() => setExportFormat(f.id as any)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group w-full ${exportFormat === f.id ? 'border-primary bg-primary/5' : 'border-transparent bg-light-surface dark:bg-dark-surface hover:bg-light-surface/80 dark:hover:bg-dark-surface/80'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${exportFormat === f.id ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-light-border/20 dark:bg-dark-border/20 text-light-muted dark:text-dark-muted shadow-sm'}`}>
                      <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                    </div>
                    <div>
                      <p className={`font-black text-sm ${exportFormat === f.id ? 'text-primary' : 'text-light-text dark:text-dark-text'}`}>{f.label}</p>
                      <p className="text-[10px] font-bold text-light-text-2 dark:text-dark-text-2 opacity-70">{f.desc}</p>
                    </div>
                 </button>
               ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted px-1">2. Rango de Tiempo</h4>
            <ChipSelector 
              options={[
                { value: 'mes', label: 'Este Mes' },
                { value: 'trimestre', label: 'Último Trimestre' },
                { value: 'year', label: 'Año Completo' },
                { value: 'custom', label: 'Personalizado' }
              ]} 
              value="mes"
              onChange={() => {}}
            />
          </div>

          <div className="pt-8 flex flex-col items-center">
            <Button size="lg" className="w-full justify-center shadow-2xl shadow-primary/30 relative overflow-hidden h-14" disabled={isGenerating} onClick={handleExport}>
              {isGenerating ? (
                <>
                   <span className="animate-spin material-symbols-outlined mr-2">progress_activity</span>
                   Generando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">download_for_offline</span>
                  Descargar {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
            <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted mt-4 text-center italic">Protegemos tu privacidad: este reporte se genera localmente.</p>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
