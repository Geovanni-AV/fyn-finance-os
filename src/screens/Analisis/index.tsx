import { useMemo, useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { Card, Button, Drawer, ChipSelector, Badge, Skeleton } from '../../components/ui'
import { formatMXN, formatMXNShort, CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_LABELS, type CategoryId } from '../../types'

export default function Analisis() {
  const { transactions, accounts } = useApp()
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Statistical calculations
  const analysisData = useMemo(() => {
    const now = new Date()
    const thisMonthStr = now.toISOString().slice(0, 7)
    
    const lastMonthDate = new Date()
    lastMonthDate.setMonth(now.getMonth() - 1)
    const lastMonthStr = lastMonthDate.toISOString().slice(0, 7)
    
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

    // Trend mock data (last 6 months)
    const trendData = [
      { month: 'Oct', ingresos: 45000, gastos: 32000 },
      { month: 'Nov', ingresos: 48000, gastos: 35000 },
      { month: 'Dic', ingresos: 52000, gastos: 41000 },
      { month: 'Ene', ingresos: 46000, gastos: 38000 },
      { month: 'Feb', ingresos: 45500, gastos: 36500 },
      { month: 'Mar', ingresos: 47000, gastos: totalThis || 34200 }
    ]

    return { totalThis, totalLast, catData, trendData, totalBalance }
  }, [transactions, accounts])

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



  const gastoDiff = analysisData.totalLast > 0 
    ? ((analysisData.totalThis - analysisData.totalLast) / analysisData.totalLast) * 100 
    : 0

  return (
    <div className="p-4 lg:p-6 lg:max-w-6xl mx-auto space-y-8 animate-fade-in shadow-2xl shadow-black/5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">Análisis y Reportes</h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 italic">Inteligencia financiera para mejores decisiones.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="lg">
             <span className="material-symbols-outlined">filter_list</span>
             Filtros
          </Button>
          <Button onClick={() => setIsExportOpen(true)} size="lg" className="shadow-lg shadow-primary/20">
             <span className="material-symbols-outlined">ios_share</span>
             Exportar
          </Button>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-primary bg-primary/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Gasto Total Mes</p>
          <p className="text-3xl font-black text-light-text dark:text-dark-text mb-2">{formatMXN(analysisData.totalThis)}</p>
          <div className={`flex items-center gap-1 text-xs font-bold ${analysisData.totalThis > analysisData.totalLast ? 'text-danger' : 'text-success'}`}>
             <span className="material-symbols-outlined text-[14px]">
               {analysisData.totalThis > analysisData.totalLast ? 'trending_up' : 'trending_down'}
             </span>
             {analysisData.totalLast > 0 ? (((analysisData.totalThis - analysisData.totalLast) / analysisData.totalLast) * 100).toFixed(1) : '0'}% vs mes ant.
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-success bg-success/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-success mb-1">Balance Consolidado</p>
          <p className="text-3xl font-black text-light-text dark:text-dark-text mb-2">
            {formatMXN(analysisData.totalBalance)}
          </p>
          <p className="text-xs font-bold text-light-text-2 dark:text-dark-text-2 italic">
            Suma de todas tus cuentas activas
          </p>
        </Card>

        <Card className="p-6 border-l-4 border-l-warning bg-warning/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-warning mb-1">Ahorro Proyectado</p>
          <p className="text-3xl font-black text-light-text dark:text-dark-text mb-2">
            {formatMXN(12500)}
          </p>
          <p className="text-xs font-bold text-success flex items-center gap-1">
             <span className="material-symbols-outlined text-[14px]">check_circle</span>
             Superando meta por $4,200
          </p>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Area Chart */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-light-text dark:text-dark-text flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Tendencia de Flujo
            </h3>
            <Badge variant="outline">Últimos 6 meses</Badge>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysisData.trendData}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis hide />
                <RechartsTooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', background: 'white' }}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expenses by Category Bar */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="font-black text-light-text dark:text-dark-text flex items-center gap-2">
                <span className="material-symbols-outlined text-danger">pie_chart</span>
                Gastos por Categoría
             </h3>
             <Badge variant="primary">Este Mes</Badge>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData.catData} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} width={100} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                  {analysisData.catData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Insights Section */}
      <h3 className="text-xl font-black text-light-text dark:text-dark-text px-1 uppercase tracking-tighter">Insights Inteligentes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-light-surface/40 dark:bg-dark-surface/40 border border-light-border/10 dark:border-dark-border/10 flex gap-4 transition-all hover:bg-light-surface/60 dark:hover:bg-dark-surface/60">
           <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
             <span className="material-symbols-outlined text-2xl">lightbulb</span>
           </div>
           <div>
             <h4 className="font-black text-light-text dark:text-dark-text mb-1 italic">Optimización de Suscripciones</h4>
             <p className="text-sm text-light-text-2 dark:text-dark-text-2 leading-relaxed">Detectamos 3 suscripciones no utilizadas el último mes. Cancelarlas te ahorraría <span className="font-bold text-light-text dark:text-dark-text">$540 MXN</span> mensuales.</p>
           </div>
        </div>
        <div className="p-6 rounded-3xl bg-light-surface/40 dark:bg-dark-surface/40 border border-light-border/10 dark:border-dark-border/10 flex gap-4 transition-all hover:bg-light-surface/60 dark:hover:bg-dark-surface/60">
           <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center flex-shrink-0">
             <span className="material-symbols-outlined text-2xl">rocket_launch</span>
           </div>
           <div>
             <h4 className="font-black text-light-text dark:text-dark-text mb-1 italic">Potencial de Inversión</h4>
             <p className="text-sm text-light-text-2 dark:text-dark-text-2 leading-relaxed">Mantienes un excedente de <span className="font-bold text-light-text dark:text-dark-text">$12,000 MXN</span> en cuenta de débito. Moverlo a CETES generaría intereses inmediatos.</p>
           </div>
        </div>
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
                { value: 'mes', label: 'Marzo 2026' },
                { value: 'trimestre', label: 'Último Trimestre' },
                { value: 'year', label: 'Año 2026' },
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
