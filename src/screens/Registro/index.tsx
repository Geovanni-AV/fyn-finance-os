import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { Button, Input, Card } from '../../components/ui'
import { CATEGORY_ICONS, CATEGORY_LABELS, type CategoryId, type TransactionType } from '../../types'

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
  const [pdfStep, setPdfStep] = useState<0|1|2|3|4>(0)

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
    <div className="p-4 lg:p-8 lg:max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">Registrar Movimiento</h1>
        <p className="text-sm text-light-text-2 dark:text-dark-text-2 italic">Añade transacciones manuales o estados de cuenta.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-md rounded-card p-1.5 shadow-inner border border-light-border/50 dark:border-dark-border/50">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-btn text-sm font-semibold transition-all duration-300 cursor-pointer ${
              tab === t.id
                ? 'glass shadow-md text-primary scale-[1.02]'
                : 'text-light-text-2 dark:text-dark-text-2 hover:text-light-text dark:hover:text-dark-text hover:bg-light-surface/50 dark:hover:bg-dark-surface/50'
            }`}>
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Manual */}
      {tab === 'manual' && (
        <Card className="space-y-6">
          {/* Type toggle */}
          <div className="flex gap-1 bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm rounded-btn p-1.5 border border-light-border/30 dark:border-dark-border/30">
            {(['gasto', 'ingreso', 'transferencia'] as TransactionType[]).map(t => (
              <button key={t} onClick={() => setTxType(t)}
                className={`flex-1 py-2.5 rounded-btn text-sm font-bold capitalize transition-all duration-300 cursor-pointer ${
                  txType === t ? `${TYPE_BG[t]} text-white shadow-md scale-[1.02]` : 'text-light-text-2 dark:text-dark-text-2 hover:bg-white/50 dark:hover:bg-black/20'
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="text-center py-6">
            <p className="text-xs font-semibold text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide mb-3">Monto de transacción</p>
            <div className="relative inline-flex items-center justify-center">
              <span className={`text-3xl font-bold mr-1 ${TYPE_COLORS[txType].split(' ')[0]}`}>$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className={`text-6xl font-extrabold tabular-nums w-48 bg-transparent border-b-2 text-center focus:outline-none transition-all ${TYPE_COLORS[txType]} placeholder:text-light-muted dark:placeholder:text-dark-muted shadow-sm`}
              />
              <span className="text-xl font-medium text-light-text-2 dark:text-dark-text-2 ml-2">MXN</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <p className="text-sm font-semibold text-light-text dark:text-dark-text mb-3">Categoría</p>
            <div className="grid grid-cols-4 gap-3">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-300 cursor-pointer text-center ${
                    category === cat
                      ? 'glass border-primary/40 text-primary shadow-md scale-105'
                      : 'bg-transparent border border-transparent hover:glass hover:border-light-border/50 text-light-text-2 dark:text-dark-text-2 hover:text-light-text dark:hover:text-dark-text'
                  }`}>
                  <span className="material-symbols-outlined text-2xl">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-[10px] font-semibold tracking-wider leading-tight uppercase">{CATEGORY_LABELS[cat].slice(0, 10)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <p className="text-sm font-medium text-light-text dark:text-dark-text mb-2">Cuenta</p>
            <select
              value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-btn px-3 py-2.5 text-sm text-light-text dark:text-dark-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
              {accounts.filter(a => a.isActive).map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <Input label="Descripción" placeholder="Ej: Despensa Walmart" value={description} onChange={e => setDescription(e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <div />
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-light-text dark:text-dark-text">¿Es recurrente?</p>
              <p className="text-xs text-light-text-2 dark:text-dark-text-2">Renta, suscripción, etc.</p>
            </div>
            <button onClick={() => setRecurring(r => !r)}
              className={`relative w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer ${recurring ? 'bg-primary' : 'bg-light-muted dark:bg-dark-surface'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${recurring ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          {recurring && (
            <div className="animate-fade-in-up">
              <p className="text-sm font-medium text-light-text dark:text-dark-text mb-2">Periodicidad</p>
              <div className="flex flex-wrap gap-2">
                {RECURRENCE.map(r => (
                  <button key={r} onClick={() => setPeriod(r)}
                    className={`px-3 py-1.5 rounded-btn text-xs font-medium capitalize cursor-pointer transition-all ${
                      period === r ? 'bg-primary text-white' : 'bg-light-surface dark:bg-dark-surface text-light-text-2 dark:text-dark-text-2 border border-light-border dark:border-dark-border'
                    }`}>{r}</button>
                ))}
              </div>
            </div>
          )}

          <Input label="Notas (opcional)" placeholder="Detalles adicionales..." value={notes} onChange={e => setNotes(e.target.value)} />

          <Button className="w-full justify-center py-3" onClick={handleSubmit}>
            <span className="material-symbols-outlined text-lg">check</span>
            Registrar movimiento
          </Button>
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
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {['Subir', 'Analizando', 'Revisar', 'Confirmar', 'Listo'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < pdfStep ? 'bg-success text-white' :
                  i === pdfStep ? 'bg-primary text-white' : 'bg-light-surface dark:bg-dark-surface text-light-muted dark:text-dark-muted'
                }`}>{i < pdfStep ? '✓' : i + 1}</div>
                {i < 4 && <div className={`w-8 h-0.5 ${i < pdfStep ? 'bg-success' : 'bg-light-border dark:border-dark-border'}`} />}
              </div>
            ))}
          </div>

          {pdfStep === 0 && (
            <div className="border-2 border-dashed border-light-border dark:border-dark-border rounded-card p-10 text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setPdfStep(1)}>
              <span className="material-symbols-outlined text-5xl text-light-muted dark:text-dark-muted">upload_file</span>
              <div>
                <p className="font-medium text-light-text dark:text-dark-text">Arrastra tu estado de cuenta</p>
                <p className="text-sm text-light-text-2 dark:text-dark-text-2">PDF de BBVA, Nu, Santander, HSBC...</p>
              </div>
              <Button variant="secondary" size="sm">Seleccionar archivo</Button>
            </div>
          )}
          {pdfStep === 1 && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="font-medium text-light-text dark:text-dark-text">Analizando tu estado de cuenta...</p>
              <Button size="sm" onClick={() => setPdfStep(2)}>Simular análisis completo</Button>
            </div>
          )}
          {pdfStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-light-text dark:text-dark-text">Se encontraron 12 transacciones. Selecciona cuáles importar:</p>
              {['Netflix - $299', 'Walmart - $580', 'Uber - $125', 'CFE - $450'].map(item => (
                <label key={item} className="flex items-center gap-3 p-3 bg-light-surface dark:bg-dark-surface rounded-btn cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                  <span className="text-sm text-light-text dark:text-dark-text">{item}</span>
                </label>
              ))}
              <Button className="w-full justify-center" onClick={() => setPdfStep(3)}>Importar seleccionadas</Button>
            </div>
          )}
          {pdfStep >= 3 && (
            <div className="text-center space-y-4 py-8">
              <div className="w-14 h-14 mx-auto bg-success/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-success">check_circle</span>
              </div>
              <div>
                <p className="font-semibold text-light-text dark:text-dark-text">¡Importación completada!</p>
                <p className="text-sm text-light-text-2 dark:text-dark-text-2 mt-1">4 transacciones importadas exitosamente</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setPdfStep(0)}>Importar otro PDF</Button>
            </div>
          )}
        </Card>
      )}

      {/* Sync */}
      {tab === 'sync' && (
        <Card className="space-y-4">
          <p className="text-sm text-light-text-2 dark:text-dark-text-2">Conecta tu banco para sincronización automática de movimientos.</p>
          {[
            { bank: 'BBVA', color: '#004A9F', connected: true },
            { bank: 'Nu', color: '#820AD1', connected: false },
            { bank: 'Klar', color: '#00C4B3', connected: false },
            { bank: 'Santander', color: '#CC0000', connected: false },
            { bank: 'HSBC', color: '#DB0011', connected: false },
            { bank: 'Openbank', color: '#E3000F', connected: false },
          ].map(item => (
            <div key={item.bank} className="flex items-center gap-4 p-4 bg-light-surface dark:bg-dark-surface rounded-btn">
              <div className="w-10 h-10 rounded-btn flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: item.color }}>{item.bank.slice(0, 2)}</div>
              <div className="flex-1">
                <p className="font-medium text-light-text dark:text-dark-text">{item.bank}</p>
                <p className="text-xs text-light-text-2 dark:text-dark-text-2">
                  {item.connected ? 'Conectado · Última sync: hace 5 min' : 'Sin conectar'}
                </p>
              </div>
              <Button size="sm" variant={item.connected ? 'secondary' : 'primary'}>
                {item.connected ? 'Sincronizar' : 'Conectar'}
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
