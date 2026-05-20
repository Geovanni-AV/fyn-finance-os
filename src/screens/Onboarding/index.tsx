import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui'
import { formatMXN, BankName, BANKS, CATEGORY_BUDGET, CATEGORY_ICONS } from '../../types'

export default function Onboarding() {
  const navigate = useNavigate()
  const { createProfile, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [selectedBank, setSelectedBank] = useState<BankName | null>(null)
  const [balance, setBalance] = useState('')
  const [income, setIncome] = useState(50000)

  const handleComplete = async () => {
    if (name) {
      // 1. Crear el perfil inicial en SQLite
      const userId = await createProfile({ name, onboardingDone: true })
      
      // 2. Si seleccionó banco y saldo inicial, creamos la primera cuenta real
      if (userId && selectedBank && balance) {
        const bankData = BANKS.find(b => b.name === selectedBank)
        const electron = (window as any).electronAPI
        if (electron) {
          await electron.invoke('add-account', userId, {
            name: `Cuenta ${selectedBank}`,
            bank: selectedBank,
            type: 'debito',
            balance: parseFloat(balance),
            currency: 'MXN',
            color: bankData?.color || '#2563EB',
            isActive: true
          })
        }
      }
    }
    
    // Refrescamos el estado de auth para que detecte el nuevo perfil en SQLite
    await refreshProfile()
    navigate('/', { replace: true })
  }

  const progressPct = (step / 4) * 100

  return (
    <div className="min-h-screen bg-atelier-bg-alt-light dark:bg-atelier-bg-alt-dark flex items-center justify-center p-8 animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-atelier-bg-1-dark depth-1 rounded-[4rem] p-12 md:p-20 border border-primary/5 shadow-luster ring-1 ring-primary/5 relative overflow-hidden">
        {/* Background Texture Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col min-h-[500px]">
          {/* Technical Header */}
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 transition-transform hover:scale-110">
                <span className="material-symbols-outlined text-primary text-xl font-light">terminal宣</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-atelier-text-main-light dark:text-atelier-text-main-dark opacity-40 italic">Fyn Initialize 1.0</p>
            </div>
            {step > 1 && (
              <button 
                onClick={() => setStep(s => s - 1)}
                className="w-10 h-10 rounded-full depth-1 flex items-center justify-center text-atelier-text-muted-light dark:text-atelier-text-muted-dark hover:text-primary transition-all active:scale-90 border border-primary/5">
                <span className="material-symbols-outlined text-xl">arrow_back宣</span>
              </button>
            )}
          </div>

          {/* Precision Progress Bar */}
          <div className="mb-20 space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Secuencia de Configuración</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black italic tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark leading-none">{progressPct}宣</span>
                <span className="text-[10px] font-black uppercase text-primary/40 leading-none">%</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-primary/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(37,99,235,0.3)]" 
                style={{ width: `${progressPct}%` }} 
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {/* Step 1: Editorial Splash */}
            {step === 1 && (
              <div className="space-y-12 animate-fade-in-up">
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Bienvenido al Futuro Digital</p>
                  <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark italic leading-[0.8] tracking-[-0.04em]">
                    Atelier<br />
                    <span className="text-primary/40 not-italic">Finance.宣</span>
                  </h1>
                  <p className="text-sm font-medium text-atelier-text-muted-light dark:text-atelier-text-muted-dark leading-relaxed opacity-60 max-w-sm">
                    Sincronización avanzada, inteligencia analítica y control absoluto. Su nueva arquitectura patrimonial comienza ahora.宣
                  </p>
                </div>
                <div className="space-y-4 pt-10">
                  <button 
                    onClick={() => setStep(2)}
                    className="group w-full md:w-auto px-12 py-6 rounded-full bg-primary text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                    Inicializar Sistema
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-2 transition-transform">arrow_forward宣</span>
                  </button>
                  <p className="text-[10px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest opacity-20 italic">Acceso Seguro mediante Encriptación 256-bit宣</p>
                </div>
              </div>
            )}

            {/* Step 2: Perfil */}
            {step === 2 && (
              <div className="space-y-12 animate-fade-in-up">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Identidad Técnica</p>
                  <h2 className="text-5xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter leading-none italic">
                    ¿Cuál es su nombre?宣
                  </h2>
                </div>
                
                <div className="space-y-10">
                  <div className="relative group">
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Identificador del Usuario"
                      className="w-full bg-primary/[0.03] border border-primary/5 rounded-[2rem] py-8 px-10 text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark placeholder:text-atelier-text-muted-light dark:placeholder:text-atelier-text-muted-dark placeholder:opacity-20 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white dark:focus:bg-atelier-bg-2-dark transition-all duration-500 shadow-inner"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full depth-1 flex items-center justify-center text-primary/40 group-focus-within:text-primary transition-colors border border-primary/5">
                      <span className="material-symbols-outlined text-2xl font-light">fingerprint宣</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-[0.3em] opacity-40">Prefijo Monetario del Sistema</h3>
                    <div className="flex gap-4">
                      {['MXN', 'USD'].map(cur => (
                        <button key={cur} className={`flex-1 flex items-center justify-center gap-4 py-5 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 border border-primary/5 ${cur === 'MXN' ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'depth-1 text-atelier-text-main-light dark:text-atelier-text-main-dark opacity-40 hover:opacity-100 hover:scale-[1.02]'}`}>
                          <span className="material-symbols-outlined text-lg font-light">{cur === 'MXN' ? 'payments' : 'monetization_on'}</span>
                          {cur}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(3)}
                  disabled={!name.trim()}
                  className="w-full py-6 rounded-full bg-primary text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 disabled:shadow-none mt-4">
                  Confirmar Identidad
                </button>
              </div>
            )}

            {/* Step 3: Primera cuenta */}
            {step === 3 && (
              <div className="space-y-12 animate-fade-in-up">
                <div className="space-y-4 text-center">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Sincronización de Fondos</p>
                  <h2 className="text-5xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter leading-none italic">
                    Conectar Entidad.宣
                  </h2>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {BANKS.slice(0, 8).map((bank, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedBank(bank.name)}
                      className={`relative aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all duration-500 border border-primary/5 ${
                        selectedBank === bank.name
                          ? 'depth-2 ring-2 ring-primary bg-primary/5 scale-105'
                          : 'depth-1 opacity-60 hover:opacity-100 hover:scale-105 hover:bg-white dark:hover:bg-atelier-bg-2-dark'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[10px] font-black shadow-lg"
                        style={{ backgroundColor: bank.color }}>
                        {bank.name.slice(0, 2)}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-atelier-text-main-light dark:text-atelier-text-main-dark">{bank.name === 'Otra' ? (i === 6 ? 'Efectivo' : 'Otro') : bank.name}</span>
                    </button>
                  ))}
                </div>

                {selectedBank && (
                  <div className="space-y-4 animate-fade-in-up">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Capital Inicial Sincronizado</h3>
                    <div className="relative group">
                      <input
                        type="number"
                        value={balance}
                        onChange={e => setBalance(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-primary/[0.03] border border-primary/5 rounded-[2rem] py-8 px-10 text-4xl font-black tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark placeholder:opacity-10 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white dark:focus:bg-atelier-bg-2-dark transition-all duration-500 shadow-inner"
                      />
                      <span className="absolute right-10 top-1/2 -translate-y-1/2 text-2xl font-black text-primary opacity-40 italic">MXN</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button onClick={() => setStep(4)} className="flex-1 py-6 rounded-full depth-1 text-atelier-text-muted-light dark:text-atelier-text-muted-dark text-[11px] font-black uppercase tracking-[0.2em] hover:text-primary transition-all active:scale-95 border border-primary/5">
                    Omitir Paso
                  </button>
                  <button 
                    disabled={!selectedBank || !balance}
                    onClick={() => setStep(4)} 
                    className="flex-[2] py-6 rounded-full bg-primary text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:scale-100">
                    Establecer Conexión
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Presupuesto */}
            {step === 4 && (
              <div className="space-y-12 animate-fade-in-up pb-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Engine de Proyección</p>
                  <h2 className="text-5xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter leading-none italic">
                    Capacidad Mensual.
                  </h2>
                </div>

                <div className="depth-1 p-10 rounded-[3rem] border border-primary/5 space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-20">Analyst View</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest opacity-40 italic">Expectativa de Ingresos Brutos</p>
                    <p className="text-5xl font-black tabular-nums tracking-tighter text-atelier-text-main-light dark:text-atelier-text-main-dark">
                      ${income.toLocaleString('es-MX')}<span className="text-primary/40 text-[0.4em] ml-2 font-black uppercase not-italic tracking-widest">MXN</span>
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="range" min={0} max={100000} step={1000} value={income}
                      onChange={e => setIncome(Number(e.target.value))}
                      className="w-full accent-primary h-2 bg-primary/5 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-[0.3em] opacity-30 italic">
                      <span>Baseline $0</span>
                      <span>Target $100K+</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {CATEGORY_BUDGET.map(cat => (
                    <div key={cat.label}
                      className="depth-1 p-5 rounded-[2rem] border border-primary/5 flex items-center gap-5 hover:depth-2 transition-all duration-500 group">
                      <div className="w-12 h-12 bg-primary/[0.03] rounded-2xl flex items-center justify-center border border-primary/5 text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-xl font-light">{CATEGORY_ICONS[cat.id]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">{cat.label}</p>
                        <p className="text-lg font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tabular-nums">{Math.round((cat.limit / income || 1) * 100)}<span className="text-primary text-[0.6em] ml-1 opacity-40">%</span></p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleComplete}
                  className="w-full py-6 rounded-full bg-primary text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                  Finalizar Parametrización y Entrar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
