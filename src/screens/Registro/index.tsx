import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { Button, Input, Card, Checkbox } from '../../components/ui'
import { CATEGORY_ICONS, CATEGORY_LABELS, type CategoryId, type TransactionType } from '../../types'
import { useAuth } from '../../context/AuthContext'

const CATEGORIES: CategoryId[] = [
  'alimentacion', 'transporte', 'entretenimiento', 'salud',
  'educacion', 'ropa', 'hogar', 'servicios',
  'nomina', 'freelance', 'inversiones', 'otros',
]

const RECURRENCE = ['diario', 'semanal', 'quincenal', 'mensual', 'anual'] as const

type Tab = 'manual' | 'ocr' | 'pdf' | 'sync'

export default function Registro() {
  const { accounts, addTransaction, refreshData } = useApp()
  const { success, error: toastError } = useToast()
  const [tab, setTab] = useState<Tab>('manual')
  const navigate = useNavigate()

  // Manual form state
  const [txType, setTxType] = useState<TransactionType>('gasto')
  const [amount, setAmount]   = useState('')
  const [category, setCategory] = useState<CategoryId>('alimentacion')
  const [description, setDescription] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10))
  const [recurring, setRecurring] = useState(false)
  const [period, setPeriod]     = useState<typeof RECURRENCE[number]>('mensual')
  const [notes, setNotes]       = useState('')

  // PDF state
  const { user } = useAuth()
  const [pdfStep, setPdfStep]   = useState<0|1|2|3|4>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([])
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]) // Indices
  const [detectedBank, setDetectedBank] = useState('bbva')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as any).files?.[0]
    if (!file) return
    
    // En Electron, podemos obtener la ruta real del archivo
    const filePath = file.path
    if (!filePath) {
      toastError('No se pudo obtener la ruta del archivo. Intenta arrastrar el archivo.')
      return
    }

    setSelectedFile(file)
    setPdfStep(1)
    setIsUploading(true)

    try {
      const electron = (window as any).electronAPI
      if (!electron) throw new Error('Versión de escritorio no detectada')

      const result = await electron.invoke('parse-pdf', filePath)
      
      if (result && result.isError) {
        toastError(`${result.message} (Ref: ${result.ref})`)
        setPdfStep(0)
      } else if (result && result.success) {
        setDetectedBank(result.bank)
        setParsedTransactions(result.transactions)
        setSelectedTransactions(result.transactions.map((_: any, i: number) => i))
        setPdfStep(2)
        success(`Banco detectado: ${result.bank}`)
      } else {
        toastError(result?.error || 'Error al procesar el PDF')
        setPdfStep(0)
      }
    } catch (err: any) {
      console.error('PDF Error:', err)
      toastError(err.message || 'Error crítico al leer el archivo')
      setPdfStep(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleImportSelected = () => {
    selectedTransactions.forEach(idx => {
      const tx = parsedTransactions[idx]
      addTransaction({
        date: tx.date,
        amount: tx.amount,
        type: tx.type,
        category: 'otros',
        description: tx.description,
        accountId: accountId,
        source: 'pdf'
      })
    })
    success(`${selectedTransactions.length} movimientos importados`)
    setPdfStep(3)
  }

  const toggleTx = (idx: number) => {
    setSelectedTransactions(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const TYPE_COLORS: Record<TransactionType, string> = {
    gasto: 'text-danger border-danger',
    ingreso: 'text-success border-success',
    transferencia: 'text-primary border-primary',
  }
  const TYPE_BG: Record<TransactionType, string> = {
    gasto: 'bg-danger',
    ingreso: 'bg-success',
    transferencia: 'bg-primary',
  }

  const handleSubmit = () => {
    if (!amount || !accountId) {
      toastError('Completa todos los campos requeridos')
      return
    }
    addTransaction({
      date,
      amount: parseFloat(amount.replace(/,/g, '')),
      type: txType,
      category,
      description: description || CATEGORY_LABELS[category],
      accountId,
      source: 'manual',
      isRecurring: recurring,
      recurrencePeriod: recurring ? period : undefined,
      notes,
    })
    success('Movimiento registrado')
    setAmount(''); setDescription(''); setNotes('')
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'manual', label: 'Manual',     icon: 'edit_note'    },
    { id: 'ocr',    label: 'Foto/OCR',   icon: 'photo_camera' },
    { id: 'pdf',    label: 'PDF',        icon: 'description'  },
    { id: 'sync',   label: 'Banco',      icon: 'cloud_sync'   },
  ]

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Ingesta de Datos</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark">
            Registrar <br />
            <span className="text-primary/40">Movimiento.</span>
          </h1>
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-atelier-text-muted-light dark:text-atelier-text-muted-dark italic opacity-60 uppercase tracking-widest leading-none">Portal de Captura v1.0</p>
          <div className="h-px w-12 bg-primary/20 mt-2 ml-auto" />
        </div>
      </div>

      {/* Glass Tab System */}
      <div className="flex gap-2 p-1 lg:p-2 glass !rounded-full max-w-2xl mx-auto shadow-luster">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 cursor-pointer ${
              tab === t.id
                ? 'bg-primary text-white shadow-lg scale-[1.05] z-10'
                : 'text-atelier-text-muted-light dark:text-atelier-text-muted-dark hover:text-atelier-text-main-light dark:hover:text-atelier-text-main-dark hover:bg-black/5 dark:hover:bg-white/5'
            }`}>
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Manual */}
      {tab === 'manual' && (
        <Card className="space-y-6">
          {/* Type Toggle Editorial */}
          <div className="flex gap-2 p-1.5 depth-1 rounded-3xl max-w-md mx-auto">
            {(['gasto', 'ingreso', 'transferencia'] as TransactionType[]).map(t => (
              <button key={t} onClick={() => setTxType(t)}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-400 cursor-pointer ${
                  txType === t ? `${TYPE_BG[t]} text-white shadow-lg` : 'text-atelier-text-muted-light dark:text-atelier-text-muted-dark hover:bg-black/5 dark:hover:bg-white/5'
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* Amount: The Golden Input */}
          <div className="text-center py-12">
            <p className="text-[10px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-[0.4em] mb-6">Monto del Movimiento</p>
            <div className="relative inline-flex flex-col items-center">
              <div className="flex items-center justify-center">
                <span className={`text-2xl font-black mr-2 opacity-40 ${txType === 'ingreso' ? 'text-success' : 'text-atelier-text-main-light dark:text-atelier-text-main-dark'}`}>$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`text-6xl lg:text-8xl font-black tabular-nums w-64 bg-transparent border-none text-center focus:outline-none transition-all ${txType === 'ingreso' ? 'text-success' : 'text-atelier-text-main-light dark:text-atelier-text-main-dark'} placeholder:opacity-10 tracking-tighter`}
                />
              </div>
              <div className="h-0.5 w-16 bg-primary/20 mt-4" />
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mt-4">Pesos Mexicanos (MXN)</p>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Clasificación Editorial</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] transition-all duration-500 cursor-pointer group ${
                    category === cat
                      ? 'depth-2 ring-1 ring-primary/20 scale-105 bg-primary/5'
                      : 'depth-0 hover:depth-1 text-atelier-text-muted-light dark:text-atelier-text-muted-dark'
                  }`}>
                  <span className={`material-symbols-outlined text-3xl font-light transition-colors ${category === cat ? 'text-primary' : 'opacity-40'}`}>
                    {CATEGORY_ICONS[cat]}
                  </span>
                  <span className={`text-[9px] font-black tracking-widest uppercase transition-colors ${category === cat ? 'text-atelier-text-main-light dark:text-atelier-text-main-dark' : 'opacity-60'}`}>
                    {CATEGORY_LABELS[cat]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Details Editorial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Origen y Temporalidad</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark mb-2 ml-1">Cuenta de Cargo</p>
                  <select
                    value={accountId} onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-transparent border-b border-primary/20 py-3 px-1 text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark focus:outline-none cursor-pointer">
                    {accounts.filter(a => a.isActive).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <Input label="Descripción Técnica" placeholder="Concepto del movimiento..." value={description} onChange={e => setDescription(e.target.value)} />
                <Input label="Timestamp" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Configuración Avanzada</h3>
              <div className="space-y-6">
                <div className="p-6 depth-1 rounded-[2rem] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-main-light dark:text-atelier-text-main-dark mb-1">Recurrencia Automática</p>
                    <p className="text-[9px] font-bold text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest opacity-60">Programar como cargo fijo</p>
                  </div>
                  <button onClick={() => setRecurring(r => !r)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-400 cursor-pointer ${recurring ? 'bg-primary' : 'depth-2'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-400 ${recurring ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                {recurring && (
                  <div className="animate-fade-in-up space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark ml-1">Frecuencia del Ciclo</p>
                    <div className="flex flex-wrap gap-2">
                      {RECURRENCE.map(r => (
                        <button key={r} onClick={() => setPeriod(r)}
                          className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all ${
                            period === r ? 'bg-primary text-white shadow-md' : 'depth-1 text-atelier-text-muted-light dark:text-atelier-text-muted-dark'
                          }`}>{r}</button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-2">
                  <Input label="Anotaciones Privadas" placeholder="Detalles de auditoría..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12">
            <Button className="w-full justify-center py-5 !rounded-full text-xs font-black uppercase tracking-[0.3em] shadow-luster" onClick={handleSubmit}>
              Ejecutar Registro
            </Button>
          </div>
        </Card>
      )}

      {/* OCR */}
      {tab === 'ocr' && (
        <Card className="text-center space-y-6 py-8">
          <div className="mx-auto w-48 h-32 bg-dark-bg rounded-card border-2 border-dashed border-primary/40 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-x-0 h-0.5 bg-danger animate-bounce" style={{ top: '40%' }} />
            <span className="material-symbols-outlined text-primary text-5xl">qr_code_scanner</span>
          </div>
          <div>
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-1">Escanear recibo</h3>
            <p className="text-sm text-light-text-2 dark:text-dark-text-2">La IA detecta monto, fecha y categoría automáticamente</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary"><span className="material-symbols-outlined text-lg">photo_camera</span> Cámara</Button>
            <Button variant="secondary"><span className="material-symbols-outlined text-lg">image</span> Galería</Button>
          </div>
        </Card>
      )}

      {/* PDF */}
      {tab === 'pdf' && (
        <Card className="space-y-6">
          {/* Automation Flow */}
          <div className="flex flex-col items-center gap-8 py-12 text-center">
            {isUploading ? (
              <div className="space-y-6 animate-pulse">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border-2 border-primary/20 border-t-primary animate-spin" />
                <div>
                  <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark">Procesando Inteligencia Financiera.</h3>
                  <p className="text-sm text-atelier-text-muted-light dark:text-atelier-text-muted-dark mt-2 font-medium opacity-60 italic tracking-widest">Identificando banco, cuenta y transacciones...</p>
                </div>
              </div>
            ) : pdfStep === 3 ? (
              <div className="space-y-8 animate-fade-in">
                <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto scale-110 transition-transform duration-1000">
                  <span className="material-symbols-outlined text-5xl text-success">verified</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark uppercase tracking-tight">¡Sincronización Exitosa!</h3>
                  <div className="mt-4 p-6 depth-1 !rounded-[2rem] bg-success/5 border border-success/10 max-w-sm mx-auto">
                    <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark leading-relaxed">
                      {parsedTransactions[0]?.message || 'Datos importados correctamente'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Button variant="primary" className="!rounded-full px-8 py-3 text-[10px] font-black uppercase tracking-widest" onClick={() => setPdfStep(0)}>Importar Otro</Button>
                  <Button variant="secondary" className="!rounded-full px-8 py-3 text-[10px] font-black uppercase tracking-widest" onClick={() => navigate('/')}>Ir al Resumen</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="w-24 h-32 depth-1 rounded-2xl flex items-center justify-center mx-auto relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <span className="material-symbols-outlined text-6xl text-primary font-light opacity-60">post_add</span>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-primary/20" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">Ingesta Inteligente de PDF</h3>
                  <p className="text-sm text-atelier-text-muted-light dark:text-atelier-text-muted-dark mt-3 font-medium opacity-60 max-w-sm mx-auto leading-relaxed">
                    Soporte nativo para <span className="text-primary font-bold">BBVA, Nu, Openbank</span> y más. 
                    El sistema detectará automáticamente tu cuenta y categorizará cada transacción.
                  </p>
                </div>
                
                <Button 
                  className="!rounded-full px-12 py-5 text-[11px] font-black uppercase tracking-[0.3em] shadow-luster scale-105 active:scale-95 transition-all"
                  onClick={async () => {
                    const electron = (window as any).electronAPI
                    const filePath = await electron.showOpenDialog()
                    if (!filePath) return

                    setIsUploading(true)
                    try {
                      const result = await electron.parseAndSavePDF(filePath)
                      if (result && result.isError) {
                        toastError(`${result.message} (Ref: ${result.ref})`)
                      } else if (result && result.success) {
                        setParsedTransactions([{ message: `
                          ✓ Banco: ${result.bank}
                          ✓ Cuenta: ${result.accountName}
                          ✓ ${result.inserted} Importadas
                          ${result.duplicates > 0 ? `✓ ${result.duplicates} Duplicadas omitidas` : ''}
                        ` }])
                        setPdfStep(3)
                        success('Estado de cuenta procesado')
                        if (refreshData) refreshData()
                      } else {
                        toastError(result?.error || 'Error al procesar el archivo')
                      }
                    } catch (err: any) {
                      toastError(err.message || 'Error crítico')
                    } finally {
                      setIsUploading(false)
                    }
                  }}
                >
                  <span className="material-symbols-outlined mr-3 text-xl">upload_file</span>
                  Seleccionar Documento
                </Button>
                
                <div className="pt-4">
                  <p className="text-[9px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-[0.4em] opacity-40">Procesamiento Local Seguro · No se envían datos a la nube</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Financial Sync Network */}
      {tab === 'sync' && (
        <div className="space-y-8 animate-fade-in">
          <div className="p-8 glass !rounded-[2.5rem]">
            <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-4">Sincronización Bancaria</p>
            <p className="text-lg font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">Conexión con Instituciones Financieras</p>
            <p className="text-sm text-atelier-text-muted-light dark:text-atelier-text-muted-dark mt-2 font-medium opacity-60">Consolida tus activos conectando tus cuentas de forma segura mediante protocolos de encriptación bancaria.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { bank: 'BBVA', color: '#004A9F', connected: true },
              { bank: 'Nu México', color: '#820AD1', connected: false },
              { bank: 'Klar', color: '#00C4B3', connected: false },
              { bank: 'Santander', color: '#CC0000', connected: false },
              { bank: 'Inversiones GBM', color: '#000000', connected: false },
            ].map(item => (
              <Card key={item.bank} padding={false} className="p-6 hover:!depth-2 !rounded-[2rem]">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[10px] font-black shadow-luster"
                    style={{ backgroundColor: item.color }}>{item.bank.slice(0, 2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">{item.bank}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark mt-1 opacity-60">
                      {item.connected ? 'En Línea · Sync 5m' : 'Protocolo: Pendiente'}
                    </p>
                  </div>
                  <Button size="sm" variant={item.connected ? 'secondary' : 'primary'} className="!px-5 !py-2.5 !rounded-full !text-[9px] font-black uppercase tracking-widest">
                    {item.connected ? 'Refrescar' : 'Conectar'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
