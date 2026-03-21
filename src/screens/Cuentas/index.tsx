import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useNetWorth } from '../../hooks/useFinance'
import { Card, Button, Drawer, Accordion, Badge } from '../../components/ui'
import { formatMXN, formatMXNShort, CATEGORY_ICONS, CATEGORY_COLORS } from '../../types'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts'

type AssetType = 'banco' | 'inversion' | 'inmueble' | 'vehiculo' | 'otro'

export default function Cuentas() {
  const { accounts, transactions } = useApp()
  const nw = useNetWorth()
  const [selectedAcc, setSelectedAcc] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newAssetType, setNewAssetType] = useState<AssetType>('banco')

  const acc = useMemo(() => accounts.find(a => a.id === selectedAcc), [accounts, selectedAcc])
  const accTx = useMemo(() =>
    selectedAcc ? transactions.filter(t => t.accountId === selectedAcc).slice(0, 10) : [],
    [transactions, selectedAcc]
  )

  // Categorize accounts/assets
  const groupedAssets = useMemo(() => {
    const banks = accounts.filter(a => a.type === 'debito' || a.type === 'credito' || a.type === 'efectivo')
    const investments = accounts.filter(a => a.type === 'inversion')
    // Mocking some physical assets for visualization since they might not be in mockData yet
    const physical = [
      { id: 'p1', name: 'Casa Valle', bank: 'Inmueble', balance: 4500000, color: '#8b5cf6', type: 'inmueble', location: 'Valle de Bravo' },
      { id: 'p2', name: 'Tesla Model 3', bank: 'Vehículo', balance: 850000, color: '#ef4444', type: 'vehiculo', km: '12,500 km' }
    ]
    
    return {
      banks: { items: banks, total: banks.reduce((sum, a) => sum + (a.type === 'credito' ? 0 : a.balance), 0) },
      investments: { items: investments, total: investments.reduce((sum, a) => sum + a.balance, 0) },
      physical: { items: physical, total: physical.reduce((sum, a) => sum + a.balance, 0) }
    }
  }, [accounts])

  const chartData = useMemo(() => {
    const data = [
      { name: 'Efectivo/Bancos', value: groupedAssets.banks.total, color: '#3b82f6' },
      { name: 'Inversiones', value: groupedAssets.investments.total, color: '#10b981' },
      { name: 'Activos Físicos', value: groupedAssets.physical.total, color: '#f59e0b' }
    ].filter(d => d.value > 0)
    return data.sort((a, b) => b.value - a.value)
  }, [groupedAssets])

  const totalWealth = groupedAssets.banks.total + groupedAssets.investments.total + groupedAssets.physical.total

  return (
    <div className="p-4 lg:p-6 lg:max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">Mis Cuentas</h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 italic">Gestiona tus activos y vehículos financieros.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <span className="material-symbols-outlined text-lg">add</span>
            Nueva Cuenta
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main NW Card */}
        <Card className="lg:col-span-4 p-8 flex flex-col justify-center bg-primary/5 border-primary/10 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-2">Net Worth</p>
          <p className="text-5xl font-black text-light-text dark:text-dark-text tracking-tighter mb-2">
            {formatMXN(nw.netWorth + groupedAssets.physical.total)}
          </p>
          <div className="flex items-center gap-2 text-success">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-sm font-bold">+2.4% este mes</span>
          </div>
        </Card>

        {/* Wealth Distribution */}
        <Card className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 p-1 overflow-hidden">
          <div className="h-56 md:h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="p-6 md:p-8 flex flex-col justify-center space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-light-muted dark:text-dark-muted mb-2">Distribución</h3>
            {chartData.map(d => (
              <div key={d.name} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: d.color }} />
                  <span className="text-sm font-medium text-light-text-2 dark:text-dark-text-2 group-hover:text-light-text dark:group-hover:text-dark-text transition-colors">{d.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-light-text dark:text-dark-text">{formatMXNShort(d.value)}</p>
                  <p className="text-[10px] text-light-text-2 dark:text-dark-text-2 font-bold">{((d.value / totalWealth) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        ) : (
          <div className="col-span-full">
             <EmptyState 
               icon="account_balance"
               title="No hay cuentas"
               description="Agrega tu primera cuenta bancaria o billetera para empezar a trackear tu efectivo."
               action={<Button onClick={() => setIsAddModalOpen(true)}>Crear ahora</Button>}
             />
          </div>
        )}
      </div>

      {/* Grouped Assets List */}
      <div className="grid grid-cols-1 gap-6">
        {/* BANCOS */}
        <Accordion 
          title="Cuentas Bancarias y Efectivo" 
          badge={formatMXNShort(groupedAssets.banks.total)}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {groupedAssets.banks.items.map(a => (
              <div key={a.id} onClick={() => setSelectedAcc(a.id)}
                className="relative p-5 rounded-2xl cursor-pointer overflow-hidden border border-light-border/10 dark:border-dark-border/10 transition-all hover:scale-[1.02] hover:shadow-xl group"
                style={{ background: `linear-gradient(135deg, ${a.color}22 0%, ${a.color}11 100%)` }}>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold backdrop-blur-md">
                    {a.bank[0]}
                  </div>
                  <Badge variant={a.type === 'credito' ? 'danger' : 'success'}>
                    {a.type === 'credito' ? 'Crédito' : 'Débito'}
                  </Badge>
                </div>
                <p className="text-xs font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-1">{a.bank}</p>
                <h4 className="font-bold text-light-text dark:text-dark-text mb-4">{a.name}</h4>
                <p className="text-2xl font-black text-light-text dark:text-dark-text tabular-nums">{formatMXN(a.balance)}</p>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
              </div>
            ))}
          </div>
        </Accordion>

        {/* INVERSIONES */}
        <Accordion 
          title="Portafolio de Inversión" 
          badge={formatMXNShort(groupedAssets.investments.total)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {groupedAssets.investments.items.map(a => (
              <div key={a.id} className="p-5 rounded-2xl border border-light-border/20 dark:border-dark-border/20 bg-light-surface/30 dark:bg-dark-surface/30 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-success/10 text-success">
                    <span className="material-symbols-outlined text-xl">trending_up</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-light-text dark:text-dark-text leading-tight">{a.name}</h4>
                    <p className="text-xs text-light-text-2 dark:text-dark-text-2">{a.bank}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-black text-light-text dark:text-dark-text">{formatMXN(a.balance)}</p>
                  <p className="text-xs font-bold text-success flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">arrow_upward</span> 
                    +8.2% anual est.
                  </p>
                </div>
              </div>
            ))}
            {groupedAssets.investments.items.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-light-muted dark:text-dark-muted bg-light-surface/10 dark:bg-dark-surface/10 rounded-3xl border-2 border-dashed border-light-border/20 dark:border-dark-border/20">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">show_chart</span>
                <p className="text-sm font-medium">No hay inversiones registradas</p>
              </div>
            )}
          </div>
        </Accordion>

        {/* ACTIVOS FÍSICOS */}
        <Accordion 
          title="Activos Físicos y Bienes" 
          badge={formatMXNShort(groupedAssets.physical.total)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {groupedAssets.physical.items.map(a => (
              <div key={a.id} className="group p-5 rounded-2xl border border-light-border/20 dark:border-dark-border/20 bg-light-surface/30 dark:bg-dark-surface/30 hover:bg-light-surface/50 dark:hover:bg-dark-surface/50 transition-all cursor-pointer">
                <div className="flex justify-between mb-4">
                  <span className="material-symbols-outlined text-3xl text-primary opacity-50">
                    {a.type === 'inmueble' ? 'home_work' : 'directions_car'}
                  </span>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-light-muted dark:text-dark-muted">{a.bank}</p>
                    <p className="text-xs font-bold text-light-text dark:text-dark-text">{(a as any).location || (a as any).km}</p>
                  </div>
                </div>
                <h4 className="font-bold text-light-text dark:text-dark-text mb-1">{a.name}</h4>
                <p className="text-2xl font-black text-light-text dark:text-dark-text">{formatMXN(a.balance)}</p>
              </div>
            ))}
          </div>
        </Accordion>
      </div>

      {/* Drawer: Detalles */}
      <Drawer isOpen={!!selectedAcc} onClose={() => setSelectedAcc(null)} title="Detalle de Cuenta" width={420}>
        {acc && (
          <div className="space-y-8">
             <div className="relative p-8 rounded-3xl overflow-hidden text-center"
                style={{ background: `linear-gradient(135deg, ${acc.color}dd 0%, ${acc.color}88 100%)` }}>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="relative z-10 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.3em] opacity-70 mb-2">{acc.bank}</p>
                  <h2 className="text-2xl font-black mb-6">{acc.name}</h2>
                  <p className="text-4xl font-black tabular-nums tracking-tighter drop-shadow-lg">{formatMXN(acc.balance)}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <Button variant="secondary" className="justify-center py-4"><span className="material-symbols-outlined">edit</span>Editar</Button>
               <Button variant="secondary" className="justify-center py-4 text-danger"><span className="material-symbols-outlined">delete</span>Eliminar</Button>
             </div>

             <div>
               <h3 className="text-sm font-black uppercase tracking-widest text-light-muted dark:text-dark-muted mb-4 px-1">Últimos Movimientos</h3>
               <div className="space-y-2">
                 {accTx.map(tx => (
                   <div key={tx.id} className="flex items-center gap-4 p-4 rounded-2xl bg-light-surface/50 dark:bg-dark-surface/50 border border-light-border/10 dark:border-dark-border/10">
                     <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${CATEGORY_COLORS[tx.category]}20` }}>
                       <span className="material-symbols-outlined" style={{ color: CATEGORY_COLORS[tx.category] }}>{CATEGORY_ICONS[tx.category]}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-light-text dark:text-dark-text truncate">{tx.description}</p>
                       <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted">{new Date(tx.date).toLocaleDateString()}</p>
                     </div>
                     <p className={`text-sm font-black ${tx.type === 'ingreso' ? 'text-success' : 'text-danger'}`}>
                        {tx.type === 'ingreso' ? '+' : '-'}{formatMXNShort(tx.amount)}
                     </p>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}
      </Drawer>

      {/* Drawer: Agregar Activo */}
      <Drawer isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agregar Nuevo Activo" width={420}>
        <div className="space-y-6">
          <p className="text-sm text-light-text-2 dark:text-dark-text-2">Selecciona el tipo de patrimonio que deseas registrar para tener una visión completa de tu salud financiera.</p>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'banco', icon: 'account_balance', label: 'Bancos' },
              { id: 'inversion', icon: 'trending_up', label: 'Inversión' },
              { id: 'inmueble', icon: 'home_work', label: 'Inmueble' },
              { id: 'vehiculo', icon: 'directions_car', label: 'Vehículo' },
              { id: 'otro', icon: 'category', label: 'Otro' },
            ].map(type => (
              <button 
                key={type.id}
                onClick={() => setNewAssetType(type.id as AssetType)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${newAssetType === type.id ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-light-surface dark:bg-dark-surface hover:bg-light-surface/80 dark:hover:bg-dark-surface/80 text-light-muted dark:text-dark-muted'}`}>
                <span className="material-symbols-outlined text-2xl">{type.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-wider">{type.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t border-light-border/20 dark:border-dark-border/20">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-light-muted dark:text-dark-muted ml-1">Nombre del Activo</label>
              <input type="text" className="w-full h-12 px-4 rounded-xl bg-light-surface dark:bg-dark-surface border-none focus:ring-2 focus:ring-primary/50 outline-none font-bold" placeholder="Eje: Casa en Cuernavaca" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-light-muted dark:text-dark-muted ml-1">Valor Estimado / Saldo</label>
              <input type="number" className="w-full h-12 px-4 rounded-xl bg-light-surface dark:bg-dark-surface border-none focus:ring-2 focus:ring-primary/50 outline-none font-black text-xl" placeholder="$ 0.00" />
            </div>

            {newAssetType === 'vehiculo' && (
               <div className="space-y-1.5 animate-fade-in-up">
                 <label className="text-[10px] font-black uppercase tracking-widest text-light-muted dark:text-dark-muted ml-1">Kilometraje</label>
                 <input type="text" className="w-full h-12 px-4 rounded-xl bg-light-surface dark:bg-dark-surface border-none focus:ring-2 focus:ring-primary/50 outline-none font-bold" placeholder="Eje: 25,000 km" />
               </div>
            )}

            {newAssetType === 'inmueble' && (
               <div className="space-y-1.5 animate-fade-in-up">
                 <label className="text-[10px] font-black uppercase tracking-widest text-light-muted dark:text-dark-muted ml-1">Ubicación / Ciudad</label>
                 <input type="text" className="w-full h-12 px-4 rounded-xl bg-light-surface dark:bg-dark-surface border-none focus:ring-2 focus:ring-primary/50 outline-none font-bold" placeholder="Eje: CDMX, Polanco" />
               </div>
            )}
          </div>

          <div className="pt-6">
            <Button size="lg" className="w-full justify-center shadow-xl shadow-primary/20" onClick={() => setIsAddModalOpen(false)}>
              Guardar Activo
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
