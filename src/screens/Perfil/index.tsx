import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Card, Toggle, Button, Skeleton } from '../../components/ui'

export default function Perfil() {
  const { profile, updateProfile } = useApp()
  const { refreshProfile } = useAuth()
  const { success, error } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(profile.name)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto animate-fade-in">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 h-64 rounded-card" />
          <div className="lg:col-span-8 space-y-5">
            <Skeleton className="h-40 rounded-card" />
            <Skeleton className="h-40 rounded-card" />
          </div>
        </div>
      </div>
    )
  }

  const toggleTheme = () => {
    const next = profile.theme === 'dark' ? 'light' : 'dark'
    updateProfile({ theme: next })
    document.documentElement.classList.toggle('dark', next === 'dark')
    success(`Modo ${next === 'dark' ? 'oscuro' : 'claro'} activado`)
  }

  const handleSaveName = async () => {
    if (!editedName.trim()) return
    await updateProfile({ name: editedName })
    setIsEditing(false)
    success('Perfil actualizado correctamente')
    // Refrescamos auth para que el sidebar muestre el nuevo nombre
    await refreshProfile()
  }

  const handleReset = async () => {
    const confirmed = window.confirm('¿ESTÁS SEGURO? Esta acción eliminará permanentemente todos tus datos financieros y perfiles de este equipo. No se puede deshacer.')
    if (confirmed) {
      const electron = (window as any).electronAPI
      if (electron) {
        await electron.invoke('reset-database')
        success('Base de datos depurada. Reiniciando...')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        error('Solo disponible en la versión de escritorio')
      }
    }
  }

  const handleExport = () => {
    success('Datos exportados correctamente (Simulado)')
  }

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Identidad y Preferencias</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark leading-[0.9]">
            Perfil de <br />
            <span className="text-primary/40 text-[0.8em]">Seguridad.</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left col - Identity Editorial */}
        <div className="lg:col-span-4 space-y-8">
          <div className="depth-1 p-8 rounded-[3rem] text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-[2rem] depth-2 flex items-center justify-center mx-auto border border-primary/10 bg-primary/5">
                <span className="text-3xl font-black text-primary tracking-tighter">{profile.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="absolute -bottom-2 right-0 bg-primary shadow-luster text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">Atelier Pro</div>
            </div>
            
            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-3">
                  <input 
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 text-center text-lg font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)} variant="secondary" className="flex-1 py-2 text-[9px] uppercase font-black tracking-widest !rounded-xl">Cancelar</Button>
                    <Button onClick={handleSaveName} className="flex-1 py-2 text-[9px] uppercase font-black tracking-widest !rounded-xl">Guardar</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">{profile.name}</h3>
                  <p className="text-xs font-medium text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Inversionista Individual</p>
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="w-full justify-center !rounded-full py-4 text-[10px] uppercase font-black tracking-widest mt-4" 
                    variant="secondary"
                  >
                    Editar Identidad
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="depth-1 p-8 rounded-[3rem] space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Ambiente Visual</h4>
            <div className="flex gap-2 bg-atelier-bg-3-light dark:bg-atelier-bg-3-dark rounded-full p-1.5">
              <button onClick={() => { if (profile.theme !== 'light') toggleTheme() }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${profile.theme === 'light' ? 'bg-white dark:bg-atelier-bg-3-dark shadow-luster text-primary' : 'text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 hover:opacity-100'}`}>
                <span className="material-symbols-outlined text-base font-light">light_mode</span> Claro
              </button>
              <button onClick={() => { if (profile.theme !== 'dark') toggleTheme() }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${profile.theme === 'dark' ? 'bg-black dark:bg-atelier-bg-2-dark shadow-luster text-primary' : 'text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 hover:opacity-100'}`}>
                <span className="material-symbols-outlined text-base font-light">dark_mode</span> Oscuro
              </button>
            </div>
            <div className="space-y-4 pt-4 border-t border-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Ubicación</span>
                <span className="text-xs font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark">México (CDMX)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Moneda Base</span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full tabular-nums">MXN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right col - Security Editorial */}
        <div className="lg:col-span-8 space-y-8">
          <div className="depth-1 p-10 rounded-[3rem] space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-primary/5">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined font-light text-2xl">shield_lock</span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">Capa de Seguridad</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Protección de Datos Nivel Atómico</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {[
                { icon: 'dialpad', label: 'Código PIN de Acceso', sub: 'Requerido para la apertura de cuentas', action: 'Actualizar' },
                { icon: 'fingerprint', label: 'Biometría Avanzada', sub: 'Integración completa con FaceID / TouchID', toggle: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-6 depth-1 rounded-[2rem] hover:depth-2 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-xl bg-atelier-bg-3-light dark:bg-atelier-bg-3-dark flex items-center justify-center opacity-60">
                      <span className="material-symbols-outlined font-light text-xl">{item.icon}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">{item.label}</p>
                      <p className="text-[10px] font-medium text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic leading-none">{item.sub}</p>
                    </div>
                  </div>
                  {item.toggle
                    ? <Toggle checked onChange={() => {}} />
                    : <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline px-4 py-2 bg-primary/5 rounded-full">{item.action}</button>
                  }
                </div>
              ))}
            </div>
          </div>

          <div className="depth-1 p-10 rounded-[3rem] space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-primary/5">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined font-light text-2xl">database</span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">Gobernanza de Datos</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Portabilidad y Ciclo de Vida</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <button onClick={handleExport}
                className="flex flex-col gap-6 p-8 rounded-[2.5rem] depth-1 hover:depth-2 transition-all group text-left border border-transparent hover:border-primary/10">
                <div className="w-12 h-12 rounded-[1.25rem] bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined font-light text-primary">upload_file</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">Exportar Todo</p>
                  <p className="text-[10px] font-medium text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Formato CSV-Z (Contable)</p>
                </div>
              </button>
              <button className="flex flex-col gap-6 p-8 rounded-[2.5rem] depth-1 hover:depth-2 transition-all group text-left border border-transparent hover:border-primary/10">
                <div className="w-12 h-12 rounded-[1.25rem] bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined font-light text-primary">file_download</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">Importación</p>
                  <p className="text-[10px] font-medium text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Migración desde Archivos</p>
                </div>
              </button>
            </div>

            <div className="pt-8 border-t border-primary/5">
              <div className="p-8 rounded-[2.5rem] bg-danger/[0.03] border border-danger/10 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-danger tracking-tight">Depuración de Cuenta</p>
                  <p className="text-[10px] font-medium text-danger/60 italic">Eliminación permanente de todos los registros</p>
                </div>
                <Button 
                  variant="danger" 
                  onClick={handleReset}
                  className="!rounded-full px-8 py-3 !text-[9px] font-black uppercase tracking-widest shadow-lg shadow-danger/10"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>

          {/* About Editorial */}
          <div className="depth-1 p-8 rounded-[3rem] flex items-center justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary shadow-luster flex items-center justify-center text-white">
                <span className="material-symbols-outlined font-light text-3xl">terminal</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-lg font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Fyn Atelier OS</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 italic">Desktop Build v1.5.0</p>
              </div>
            </div>
            <div className="flex gap-6 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 cursor-pointer hover:text-primary transition-colors">Privacidad</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 cursor-pointer hover:text-primary transition-colors">Local-Storage Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
