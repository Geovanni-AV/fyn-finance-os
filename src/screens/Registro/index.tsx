import React, { useState } from 'react'
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
  const { accounts, addTransaction } = useApp()
  const { success, error: toastError } = useToast()
  const [tab, setTab] = useState<Tab>('manual')

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
      
      if (result.success) {
        setDetectedBank(result.bank)
        setParsedTransactions(result.transactions)
        setSelectedTransactions(result.transactions.map((_: any, i: number) => i))
        setPdfStep(2)
        success(`Banco detectado: ${result.bank}`)
      } else {
        toastError(result.error || 'Error al procesar el PDF')
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
          {/* Technical Step Indicator */}
          <div className="flex items-center justify-between max-w-lg mx-auto mb-12">
            {['Origen', 'Análisis', 'Validación', 'Carga'].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-700 ${
                    i < pdfStep ? 'bg-success text-white' :
                    i === pdfStep ? 'bg-primary text-white shadow-luster' : 'depth-1 text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40'
                  }`}>{i < pdfStep ? '✓' : `0${i + 1}`}</div>
                  <p className={`text-[8px] font-black uppercase tracking-widest ${i === pdfStep ? 'text-primary' : 'opacity-40'}`}>{s}</p>
                </div>
                {i < 3 && <div className={`flex-1 h-px mx-2 mb-5 ${i < pdfStep ? 'bg-success' : 'bg-primary/10'}`} />}
              </React.Fragment>
            ))}
          </div>

          {pdfStep === 0 && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark ml-1">Institución Emisora</p>
                  <select value={detectedBank} onChange={e => setDetectedBank(e.target.value)}
                    className="w-full bg-transparent border-b border-primary/20 py-3 px-1 text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark focus:outline-none cursor-pointer">
                    <option value="bbva">BBVA</option>
                    <option value="nu">Nu México</option>
                    <option value="santander">Santander</option>
                    <option value="openbank">Openbank</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark ml-1">Cuenta de Destino</p>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-transparent border-b border-primary/20 py-3 px-1 text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark focus:outline-none cursor-pointer">
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <label className="block depth-1 !rounded-[3rem] p-16 text-center space-y-6 hover:depth-2 transition-all cursor-pointer group border border-transparent hover:border-primary/10">
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-700">
                  <span className="material-symbols-outlined text-4xl text-primary font-light">terminal</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">Cargar Archivo de Origen</p>
                  <p className="text-[11px] font-medium text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest opacity-60 mt-2">Solo protocolos PDF (BBVA, Nu, Santander...)</p>
                </div>
                <div className="inline-flex items-center gap-3 px-8 py-3 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-luster">
                  Seleccionar Documento
                </div>
              </label>
            </div>
          )}

          {pdfStep === 1 && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="font-bold text-lg text-light-text dark:text-dark-text">Analizando PDF...</p>
                <p className="text-sm text-light-text-2 dark:text-dark-text-2 mt-1">Extrayendo movimientos {selectedFile?.name}</p>
              </div>
            </div>
          )}

          {pdfStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-4">
                <div>
                  <h3 className="font-bold text-light-text dark:text-dark-text">Movimientos encontrados</h3>
                  <p className="text-xs text-light-text-2 dark:text-dark-text-2">Revisa y ajusta antes de importar</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">{selectedTransactions.length}</span>
                  <span className="text-xs font-bold text-light-text-2 dark:text-dark-text-2 ml-1 uppercase">Seleccionados</span>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {parsedTransactions.map((tx, i) => (
                  <div key={i} onClick={() => toggleTx(i)}
                    className={`flex items-center gap-4 p-4 rounded-card border transition-all cursor-pointer ${
                      selectedTransactions.includes(i) 
                        ? 'bg-primary/5 border-primary/30 shadow-sm' 
                        : 'bg-light-surface/30 dark:bg-dark-surface/30 border-transparent opacity-60'
                    }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'ingreso' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                    }`}>
                      <span className="material-symbols-outlined text-xl">
                        {tx.type === 'ingreso' ? 'south_west' : 'north_east'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-light-text dark:text-dark-text truncate">{tx.description}</p>
                      <p className="text-[10px] font-bold text-light-text-2 dark:text-dark-text-2 uppercase tracking-tighter">
                        {tx.date} · {detectedBank.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black tracking-tight ${tx.type === 'ingreso' ? 'text-success' : 'text-light-text dark:text-dark-text'}`}>
                        {tx.type === 'ingreso' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setPdfStep(0)}>Cancelar</Button>
                <Button className="flex-[2] justify-center" onClick={handleImportSelected}>
                  Importar {selectedTransactions.length} movimientos
                </Button>
              </div>
            </div>
          )}

          {pdfStep >= 3 && (
            <div className="text-center space-y-6 py-8">
              <div className="relative inline-block">
                <div className="w-20 h-20 mx-auto bg-success/20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-5xl text-success">done_all</span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-dark-bg p-1 rounded-full border border-success">
                  <div className="bg-success w-4 h-4 rounded-full" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-light-text dark:text-dark-text uppercase tracking-tight">¡Importación Exitosa!</h3>
                <p className="text-sm text-light-text-2 dark:text-dark-text-2 mt-2 max-w-[280px] mx-auto">
                  Los {selectedTransactions.length} movimientos han sido procesados y guardados en tu historial.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="w-full justify-center" variant="primary" onClick={() => setPdfStep(0)}>Importar otro PDF</Button>
                <Button className="w-full justify-center" variant="secondary" onClick={() => setTab('manual')}>Ir al resumen</Button>
              </div>
            </div>
          )}
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
