import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Button } from '../../components/ui'
import type { BankName } from '../../types'

const BANKS: { name: BankName; color: string; abbr: string }[] = [
  { name: 'BBVA',     color: '#004A9F', abbr: 'BBVA' },
  { name: 'Klar',     color: '#00C4B3', abbr: 'Klar' },
  { name: 'Nu',       color: '#820AD1', abbr: 'Nu'   },
  { name: 'Openbank', color: '#E3000F', abbr: 'Open' },
  { name: 'Santander',color: '#CC0000', abbr: 'SAN'  },
  { name: 'HSBC',     color: '#DB0011', abbr: 'HSBC' },
  { name: 'Otra',     color: '#10B981', abbr: '💵'   },
  { name: 'Otra',     color: '#6B7280', abbr: '···'  },
]

const CATEGORY_BUDGET = [
  { label: 'Comida',       icon: 'restaurant',     pct: 30 },
  { label: 'Transporte',   icon: 'directions_car', pct: 15 },
  { label: 'Hogar',        icon: 'home',           pct: 35 },
  { label: 'Entretenim.',  icon: 'movie',          pct: 10 },
  { label: 'Salud',        icon: 'favorite',       pct: 5  },
  { label: 'Varios',       icon: 'category',       pct: 5  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { updateProfile } = useApp()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [selectedBank, setSelectedBank] = useState<BankName | null>(null)
  const [balance, setBalance] = useState('')
  const [income, setIncome] = useState(50000)

  const handleComplete = () => {
    if (name) updateProfile({ name })
    localStorage.setItem('fyn-onboarding-done', '1')
    navigate('/')
  }

  const progressPct = (step / 4) * 100

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-btn flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-base">account_balance_wallet</span>
            </div>
            <span className="text-white font-bold text-sm">Fyn Finance OS</span>
          </div>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="text-dark-text-2 hover:text-dark-text transition-colors cursor-pointer">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="mb-10 space-y-2">
          <div className="flex justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Paso {step} de 4</span>
            <span className="text-xs font-bold text-primary">{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full bg-dark-surface rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Step 1: Splash */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-primary text-5xl">bar_chart</span>
            </div>
            <h1 className="text-5xl font-bold text-dark-text tracking-tight mb-3">Fyn</h1>
            <p className="text-dark-text-2 text-lg leading-relaxed max-w-xs">Tu dinero, claro y bajo control</p>
            <div className="mt-16 w-full space-y-3">
              <Button className="w-full justify-center py-4 text-base" onClick={() => setStep(2)}>
                Comenzar
              </Button>
              <p className="text-dark-muted text-xs text-center">Ya tengo cuenta — <span className="text-primary cursor-pointer">Iniciar sesión</span></p>
            </div>
          </div>
        )}

        {/* Step 2: Perfil */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-dark-text tracking-tight mb-2">¿Cómo te llamamos?</h1>
              <p className="text-dark-text-2">Configura tu perfil en segundos</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dark-text-2">Tu nombre</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted text-xl">person</span>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Escribe tu nombre"
                  className="w-full bg-dark-surface border border-dark-border rounded-btn py-4 pl-11 pr-4 text-dark-text placeholder:text-dark-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-dark-text-2">Moneda preferida</label>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-btn font-semibold text-sm">
                  <span className="material-symbols-outlined text-lg">payments</span> MXN
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-dark-surface border border-dark-border rounded-btn text-dark-muted font-semibold text-sm cursor-pointer hover:border-dark-text-2 transition-colors">
                  <span className="material-symbols-outlined text-lg">monetization_on</span> USD
                </div>
              </div>
            </div>
            <Button className="w-full justify-center py-4 text-base mt-4" onClick={() => setStep(3)} disabled={!name.trim()}>
              Continuar
            </Button>
          </div>
        )}

        {/* Step 3: Primera cuenta */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-text tracking-tight mb-2">Agrega tu primera cuenta</h1>
              <p className="text-dark-text-2">Selecciona tu banco principal</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {BANKS.map((bank, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedBank(bank.name)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-card border-2 transition-all cursor-pointer ${
                    selectedBank === bank.name
                      ? 'border-primary bg-primary/10'
                      : 'border-dark-border bg-dark-surface hover:border-dark-text-2'
                  }`}
                >
                  <div className="w-10 h-10 rounded-btn flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: bank.color }}>
                    {bank.abbr}
                  </div>
                  <span className="text-xs font-medium text-dark-text">{bank.name === 'Otra' && i === 7 ? 'Otro' : bank.name}</span>
                </button>
              ))}
            </div>
            {selectedBank && (
              <div className="space-y-1.5 animate-fade-in-up">
                <label className="block text-sm font-medium text-dark-text-2">Saldo actual</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted text-xl">attach_money</span>
                  <input
                    type="number"
                    value={balance}
                    onChange={e => setBalance(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="w-full bg-dark-surface border border-dark-border rounded-btn py-4 pl-11 pr-4 text-dark-text text-xl font-bold tabular-nums placeholder:text-dark-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="flex-1 py-3 text-dark-muted font-medium hover:text-dark-text transition-colors text-sm cursor-pointer">
                Omitir por ahora
              </button>
              <Button className="flex-1 justify-center py-4" onClick={() => setStep(4)} disabled={!selectedBank}>
                Agregar cuenta
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Presupuesto */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-text tracking-tight mb-2">¿Cuánto ganas al mes?</h1>
              <div className="inline-block py-3 px-6 bg-primary/10 rounded-card border border-primary/20 mt-3">
                <span className="text-primary text-3xl font-black tabular-nums tracking-tight">
                  ${income.toLocaleString('es-MX')} MXN
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-3 text-xs text-dark-muted font-bold">
                <span>$0</span><span>$100,000 MXN</span>
              </div>
              <input
                type="range" min={0} max={100000} step={1000} value={income}
                onChange={e => setIncome(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-center text-dark-text-2 text-sm mt-2">Desliza para ajustar tu ingreso</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORY_BUDGET.map(cat => (
                <div key={cat.label}
                  className="flex items-center gap-3 p-3 rounded-card border border-dark-border bg-dark-surface">
                  <div className="w-9 h-9 bg-dark-bg rounded-btn flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-lg text-dark-text-2">{cat.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs text-dark-text-2 font-medium">{cat.label}</p>
                    <p className="text-sm font-bold text-dark-text tabular-nums">{cat.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full justify-center py-4 text-base" onClick={handleComplete}>
              Entrar al Dashboard
            </Button>
            <p className="text-center text-dark-muted text-xs">Al continuar, confirmas que esta es tu estimación inicial.</p>
          </div>
        )}
      </div>
    </div>
  )
}
