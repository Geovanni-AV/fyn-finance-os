import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useNetWorth } from '../../hooks/useFinance'
import { Card, Button, Drawer, Badge } from '../../components/ui'
import { formatMXN, formatMXNShort, CATEGORY_ICONS, CATEGORY_COLORS, BankName, BANKS } from '../../types'

type AssetType = 'banco' | 'inversion' | 'inmueble' | 'vehiculo' | 'otro'

export default function Cuentas() {
  const { accounts, transactions, addAccount, deleteAccount, refreshData } = useApp()
  const nw = useNetWorth()
  const [selectedAcc, setSelectedAcc] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newAssetType, setNewAssetType] = useState<AssetType>('banco')

  // Form states
  const [newAssetName, setNewAssetName] = useState('')
  const [newAssetBalance, setNewAssetBalance] = useState('')
  const [newAssetBank, setNewAssetBank] = useState<string>('Otra')

  const acc = useMemo(() => accounts.find(a => a.id === selectedAcc), [accounts, selectedAcc])
  const accTx = useMemo(() =>
    selectedAcc ? transactions.filter(t => t.accountId === selectedAcc).slice(0, 10) : [],
    [transactions, selectedAcc]
  )

  // Categorize accounts/assets
  const groupedAssets = useMemo(() => {
    const banks = accounts.filter(a => a.type === 'debito' || a.type === 'credito' || a.type === 'efectivo')
    const investments = accounts.filter(a => a.type === 'inversion')
    
    return {
      banks: { items: banks, total: banks.reduce((sum, a) => sum + (a.type === 'credito' ? 0 : a.balance), 0) },
      investments: { items: investments, total: investments.reduce((sum, a) => sum + a.balance, 0) }
    }
  }, [accounts])

  const chartData = useMemo(() => {
    const data = [
      { name: 'Efectivo/Bancos', value: groupedAssets.banks.total, color: '#3b82f6' },
      { name: 'Inversiones', value: groupedAssets.investments.total, color: '#10b981' }
    ].filter(d => d.value > 0)
    return data.sort((a, b) => b.value - a.value)
  }, [groupedAssets])

  const totalWealth = groupedAssets.banks.total + groupedAssets.investments.total

  const handleCreateAsset = async () => {
    if (!newAssetName || !newAssetBalance) return
    const balanceNum = parseFloat(newAssetBalance)
    if (isNaN(balanceNum)) return

    let type: any = 'debito'
    let color = '#2563EB'
    
    if (newAssetType === 'inversion') {
      type = 'inversion'
      color = '#10b981'
    } else if (newAssetType === 'inmueble') {
      type = 'inversion'
      color = '#8b5cf6'
    } else if (newAssetType === 'vehiculo') {
      type = 'inversion'
      color = '#ef4444'
    }

    const bankName = newAssetType === 'inmueble' ? 'Otra' : newAssetType === 'vehiculo' ? 'Otra' : newAssetBank
    const bankData = BANKS.find(b => b.name === bankName)
    if (bankData) {
      color = bankData.color
    }

    await addAccount({
      name: newAssetName,
      bank: bankName as any,
      type,
      balance: balanceNum,
      currency: 'MXN',
      color,
      isActive: true
    })

    // Reset fields
    setNewAssetName('')
    setNewAssetBalance('')
    setNewAssetBank('Otra')
    setIsAddModalOpen(false)
    if (refreshData) await refreshData()
  }

  const renderAddDrawer = () => (
    <Drawer isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Originación de Activo" width={480}>
      <div className="space-y-12 pb-12">
        <p className="text-sm text-atelier-text-muted-light dark:text-atelier-text-muted-dark font-medium leading-relaxed opacity-60">Integra un nuevo componente a tu ecosistema financiero para una auditoría patrimonial completa.</p>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'banco', icon: 'account_balance', label: 'Liquidez' },
            { id: 'inversion', icon: 'monitoring', label: 'Especulación' },
            { id: 'inmueble', icon: 'house', label: 'Real Estate' },
            { id: 'vehiculo', icon: 'speed', label: 'Movilidad' },
          ].map(type => (
            <button 
              key={type.id}
              onClick={() => setNewAssetType(type.id as AssetType)}
              className={`flex flex-col items-start gap-4 p-6 rounded-[2rem] transition-all duration-500 cursor-pointer ${
                newAssetType === type.id 
                  ? 'depth-2 ring-1 ring-primary/20 bg-primary/5 text-primary' 
                  : 'depth-1 text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60 hover:opacity-100'
              }`}>
              <span className="material-symbols-outlined text-2xl font-light">{type.icon}</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">{type.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-8">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Especificaciones Técnicas</h3>
          <div className="space-y-10">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark ml-1 italic opacity-40">Identificador del Activo</p>
              <input 
                type="text" 
                value={newAssetName}
                onChange={e => setNewAssetName(e.target.value)}
                className="w-full bg-transparent border-b border-primary/20 py-4 px-1 text-base font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark focus:outline-none placeholder:opacity-20 transition-all focus:border-primary" 
                placeholder="Ej. Nu Débito, Casa Valle, etc." 
              />
            </div>

            {newAssetType === 'banco' && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark ml-1 italic opacity-40">Institución Financiera</p>
                <select
                  value={newAssetBank}
                  onChange={e => setNewAssetBank(e.target.value)}
                  className="w-full bg-atelier-bg-alt-light dark:bg-atelier-bg-2-dark border border-primary/10 rounded-2xl py-3 px-4 text-base font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark focus:outline-none"
                >
                  {BANKS.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark ml-1 italic opacity-40 text-right">Monto Nominal (MXN)</p>
              <input 
                type="number" 
                value={newAssetBalance}
                onChange={e => setNewAssetBalance(e.target.value)}
                className="w-full bg-transparent border-none py-2 text-4xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark focus:outline-none placeholder:opacity-10 text-right tracking-tighter" 
                placeholder="0.00" 
              />
            </div>
          </div>
        </div>

        <div className="pt-6">
          <Button 
            disabled={!newAssetName || !newAssetBalance}
            size="lg" 
            className="w-full justify-center !rounded-full py-5 text-[10px] font-black uppercase tracking-[0.3em] shadow-luster disabled:opacity-20" 
            onClick={handleCreateAsset}
          >
            Confirmar Originación
          </Button>
        </div>
      </div>
    </Drawer>
  )

  if (accounts.length === 0) {
    return (
      <div className="space-y-12 animate-fade-in pb-12">
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Patrimonio y Liquidez</p>
            <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark">
              Cartera de <br />
              <span className="text-primary/40">Activos Netos.</span>
            </h1>
          </div>
        </div>

        {/* Premium Empty State Vault */}
        <div className="glass depth-2 p-12 md:p-20 rounded-[3rem] border border-primary/5 text-center max-w-4xl mx-auto space-y-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/10 text-primary mx-auto animate-pulse">
            <span className="material-symbols-outlined text-5xl font-light">lock</span>
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Arquitectura Patrimonial Vacía</p>
            <h2 className="text-3xl md:text-4xl font-black italic tracking-tight text-atelier-text-main-light dark:text-atelier-text-main-dark">
              Bóveda Digital esperando activos.
            </h2>
            <p className="text-sm font-medium text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60 leading-relaxed">
              Actualmente no cuentas con cuentas bancarias, inversiones o activos fijos registrados en SQLite. Comienza a modelar tu patrimonio real de inmediato.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-md mx-auto pt-6">
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 justify-center !rounded-full !py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-luster flex items-center gap-2"
            >
              Originación de Activo
              <span className="material-symbols-outlined text-base">add</span>
            </Button>
            <Button 
              onClick={async () => {
                try {
                  const filePath = await (window as any).electronAPI.showOpenDialog()
                  if (!filePath) return
                  console.log('[Cuentas] PDF Path selected:', filePath)
                  
                  const result = await (window as any).electronAPI.parseAndSavePDF(filePath)
                  console.log('[Cuentas] Ingestion result:', result)
                  
                  if (result && result.success) {
                    alert(`¡Importación exitosa!\nBanco: ${result.bank}\nCuenta: ${result.accountName}\nTransacciones insertadas: ${result.inserted}\nDuplicados omitidos: ${result.duplicates}`)
                    if (refreshData) await refreshData()
                  } else {
                    alert(`Error en importación: ${result?.error || 'Desconocido'}`)
                  }
                } catch (error: any) {
                  console.error('[Cuentas] Error uploading PDF:', error)
                  alert(`Error al procesar el PDF: ${error.message || error}`)
                }
              }}
              className="flex-1 justify-center !rounded-full !py-4 text-[10px] font-black uppercase tracking-[0.2em] !bg-atelier-bg-2-dark !text-atelier-text-main-dark hover:!bg-atelier-bg-3-dark border border-primary/5 flex items-center gap-2"
            >
              Cargar Estado PDF
              <span className="material-symbols-outlined text-base">cloud_upload</span>
            </Button>
          </div>
        </div>

        {renderAddDrawer()}
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Patrimonio y Liquidez</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark">
            Cartera de <br />
            <span className="text-primary/40">Activos Netos.</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setIsAddModalOpen(true)} className="!rounded-full !px-8 shadow-luster">
            <span className="material-symbols-outlined text-lg">add</span>
            Añadir Activo
          </Button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade-in-up">
        {/* Main NW Hero */}
        <div className="lg:col-span-5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Valor Neto de Cartera</p>
          <p className="text-6xl lg:text-7xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter tabular-nums">
            {formatMXN(totalWealth)}
          </p>
          <div className="flex items-center gap-4">
            <Badge variant="success" className="px-4 py-1 rounded-full uppercase text-[9px] tracking-widest font-black">
              Auditoría Real
            </Badge>
            <p className="text-[11px] font-bold text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 uppercase tracking-widest">Sincronización SQLite</p>
          </div>
        </div>

        {/* Wealth Distribution Stats */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          {chartData.map(d => (
            <div key={d.name} className="p-6 depth-1 rounded-[2rem] space-y-4 hover:depth-2 transition-all group">
              <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: d.color }} />
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60 group-hover:opacity-100 transition-opacity">{d.name}</p>
                <p className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tabular-nums tracking-tight">{formatMXNShort(d.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grouped Assets List */}
      <div className="grid grid-cols-1 gap-6 animate-fade-in-up">
        {/* BANCOS */}
        {groupedAssets.banks.items.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Instituciones de Liquidez</h3>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest tabular-nums">{formatMXNShort(groupedAssets.banks.total)}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {groupedAssets.banks.items.map(a => (
                <Card key={a.id} onClick={() => setSelectedAcc(a.id)} padding={false} 
                  className="p-8 hover:!depth-2 !rounded-[2.5rem] cursor-pointer group active:scale-[0.98] transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-center">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-sm bg-white/5 border border-white/10"
                        style={{ color: a.color }}>
                        {a.bank.slice(0, 2).toUpperCase()}
                      </div>
                      <Badge variant={a.type === 'credito' ? 'danger' : 'success'} className="!rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest">
                        {a.type}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">{a.name}</h4>
                      <p className="text-[10px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest opacity-60 mt-1">{a.bank}</p>
                    </div>
                    <p className="text-3xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter tabular-nums">{formatMXNShort(a.balance)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* INVERSIONES */}
        {groupedAssets.investments.items.length > 0 && (
          <div className="space-y-8 pt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Portafolios de Capital</h3>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest tabular-nums">{formatMXNShort(groupedAssets.investments.total)}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {groupedAssets.investments.items.map(a => (
                <Card key={a.id} onClick={() => setSelectedAcc(a.id)} padding={false} 
                  className="p-8 hover:!depth-2 !rounded-[2.5rem] cursor-pointer group active:scale-[0.98] transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-center">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-sm bg-white/5 border border-white/10"
                        style={{ color: a.color }}>
                        {a.bank.slice(0, 2).toUpperCase()}
                      </div>
                      <Badge variant="success" className="!rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest">
                        inversion
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">{a.name}</h4>
                      <p className="text-[10px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest opacity-60 mt-1">{a.bank}</p>
                    </div>
                    <p className="text-3xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter tabular-nums">{formatMXNShort(a.balance)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drawer: Detalles Editorial */}
      <Drawer isOpen={!!selectedAcc} onClose={() => setSelectedAcc(null)} title="Detalle de Cartera" width={480}>
        {acc && (
          <div className="space-y-12 pb-12">
             <div className="relative p-12 rounded-[3rem] overflow-hidden text-center depth-2"
                style={{ backgroundColor: acc.color }}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 text-white space-y-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">{acc.bank}</p>
                  <h2 className="text-3xl font-black tracking-tight">{acc.name}</h2>
                  <div className="h-px w-12 bg-white/20 mx-auto" />
                  <p className="text-5xl font-black tabular-nums tracking-tighter">{formatMXN(acc.balance)}</p>
                </div>
             </div>

             <div className="flex gap-4">
               <Button variant="secondary" className="flex-1 justify-center py-4 !rounded-full !text-[10px] uppercase font-black tracking-widest">Gestionar Activo</Button>
               <button 
                 onClick={async () => {
                   if (confirm(`¿Estás seguro de que deseas eliminar la cuenta ${acc.name}? Se eliminarán todas sus transacciones asociadas.`)) {
                     await deleteAccount(acc.id)
                     setSelectedAcc(null)
                     if (refreshData) await refreshData()
                   }
                 }}
                 className="flex-1 text-[10px] font-black uppercase tracking-widest text-danger hover:opacity-100 opacity-60 transition-opacity"
               >
                 Dar de Baja
               </button>
             </div>

             <div className="space-y-8">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Registro de Auditoría</h3>
               <div className="space-y-1">
                 {accTx.map(tx => (
                   <div key={tx.id} className="flex items-center gap-6 p-5 rounded-[2rem] hover:depth-1 transition-all group">
                     <div className="w-10 h-10 rounded-full depth-1 flex items-center justify-center flex-shrink-0 group-hover:depth-2 transition-all">
                       <span className="material-symbols-outlined text-xl font-light" style={{ color: CATEGORY_COLORS[tx.category] }}>{CATEGORY_ICONS[tx.category]}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark truncate tracking-tight">{tx.description}</p>
                       <p className="text-[10px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest opacity-40 mt-1">{new Date(tx.date).toLocaleDateString()}</p>
                     </div>
                     <p className={`text-base font-bold tabular-nums tracking-tighter ${tx.type === 'ingreso' ? 'text-success' : 'text-atelier-text-main-light dark:text-atelier-text-main-dark'}`}>
                        {tx.type === 'ingreso' ? '+' : '-'}{formatMXNShort(tx.amount)}
                     </p>
                   </div>
                 ))}
                 {accTx.length === 0 && (
                   <p className="text-center py-12 text-sm italic opacity-30">No hay movimientos recientes registrados.</p>
                 )}
               </div>
             </div>
          </div>
        )}
      </Drawer>

      {renderAddDrawer()}
    </div>
  )
}
