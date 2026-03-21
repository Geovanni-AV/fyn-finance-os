import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { Card, Toggle, Button } from '../../components/ui'

export default function Perfil() {
  const { profile, updateProfile } = useApp()
  const { success } = useToast()

  const toggleTheme = () => {
    const next = profile.theme === 'dark' ? 'light' : 'dark'
    updateProfile({ theme: next })
    document.documentElement.classList.toggle('dark', next === 'dark')
    success(`Modo ${next === 'dark' ? 'oscuro' : 'claro'} activado`)
  }

  const handleExport = () => {
    success('Datos exportados correctamente')
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Perfil y configuración</h1>
        <p className="text-sm text-light-text-2 dark:text-dark-text-2 mt-0.5">Gestiona tu cuenta y preferencias</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left col */}
        <div className="lg:col-span-4 space-y-5">
          {/* Avatar + info */}
          <Card className="text-center">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">{profile.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">Free</div>
            </div>
            <h3 className="text-lg font-bold text-light-text dark:text-dark-text">{profile.name}</h3>
            <p className="text-sm text-light-text-2 dark:text-dark-text-2">{profile.email}</p>
            <Button className="w-full justify-center mt-4" size="sm">Editar perfil</Button>
          </Card>

          {/* Tema */}
          <Card>
            <h4 className="text-xs font-bold uppercase tracking-wider text-light-text-2 dark:text-dark-text-2 mb-4">Preferencias visuales</h4>
            <div className="flex gap-1 bg-light-surface dark:bg-dark-surface rounded-btn p-1">
              <button onClick={() => { if (profile.theme !== 'light') toggleTheme() }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-btn text-sm font-medium transition-all cursor-pointer ${profile.theme === 'light' ? 'bg-light-card dark:bg-dark-card text-primary shadow-sm' : 'text-light-text-2 dark:text-dark-text-2'}`}>
                <span className="material-symbols-outlined text-sm">light_mode</span> Claro
              </button>
              <button onClick={() => { if (profile.theme !== 'dark') toggleTheme() }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-btn text-sm font-medium transition-all cursor-pointer ${profile.theme === 'dark' ? 'bg-light-card dark:bg-dark-card text-primary shadow-sm' : 'text-light-text-2 dark:text-dark-text-2'}`}>
                <span className="material-symbols-outlined text-sm">dark_mode</span> Oscuro
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-light-text dark:text-dark-text">Región</span>
                <span className="text-sm font-semibold text-primary">México</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-light-text dark:text-dark-text">Moneda</span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-badge">MXN</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right col */}
        <div className="lg:col-span-8 space-y-5">
          {/* Security */}
          <Card>
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-light-border dark:border-dark-border">
              <span className="material-symbols-outlined text-primary">security</span>
              <h3 className="font-semibold text-light-text dark:text-dark-text">Seguridad</h3>
            </div>
            <div className="space-y-4">
              {[
                { icon: 'dialpad', label: 'Código PIN', sub: 'Requerido para transacciones', action: 'Configurar' },
                { icon: 'fingerprint', label: 'Biometría', sub: 'FaceID o huella dactilar', toggle: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-btn bg-light-surface dark:bg-dark-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-light-text-2 dark:text-dark-text-2">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-light-text dark:text-dark-text">{item.label}</p>
                      <p className="text-xs text-light-text-2 dark:text-dark-text-2">{item.sub}</p>
                    </div>
                  </div>
                  {item.toggle
                    ? <Toggle checked onChange={() => {}} />
                    : <button className="text-primary text-sm font-bold cursor-pointer hover:underline">{item.action}</button>
                  }
                </div>
              ))}
            </div>
          </Card>

          {/* Data */}
          <Card>
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-light-border dark:border-dark-border">
              <span className="material-symbols-outlined text-primary">database</span>
              <h3 className="font-semibold text-light-text dark:text-dark-text">Gestión de datos</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleExport}
                className="flex items-center gap-3 p-4 rounded-card border border-light-border dark:border-dark-border hover:bg-light-surface dark:hover:bg-dark-surface transition-colors cursor-pointer group">
                <span className="material-symbols-outlined text-light-text-2 dark:text-dark-text-2 group-hover:text-primary transition-colors">upload_file</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-light-text dark:text-dark-text">Exportar datos</p>
                  <p className="text-xs text-light-text-2 dark:text-dark-text-2">CSV, JSON o PDF</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 rounded-card border border-light-border dark:border-dark-border hover:bg-light-surface dark:hover:bg-dark-surface transition-colors cursor-pointer group">
                <span className="material-symbols-outlined text-light-text-2 dark:text-dark-text-2 group-hover:text-primary transition-colors">file_download</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-light-text dark:text-dark-text">Importar datos</p>
                  <p className="text-xs text-light-text-2 dark:text-dark-text-2">Desde otras apps</p>
                </div>
              </button>
            </div>
            <div className="mt-5 p-4 bg-danger/5 border border-danger/20 rounded-card flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-danger">Eliminar cuenta</p>
                <p className="text-xs text-danger/70">Esta acción es permanente e irreversible</p>
              </div>
              <Button variant="danger" size="sm">Eliminar</Button>
            </div>
          </Card>

          {/* About */}
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">info</span>
              </div>
              <div>
                <p className="font-bold text-light-text dark:text-dark-text">Fyn Finance OS</p>
                <p className="text-xs text-light-text-2 dark:text-dark-text-2">Versión 1.0.0</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-xs text-light-text-2 dark:text-dark-text-2 cursor-pointer hover:text-primary transition-colors">Privacidad</span>
              <span className="text-xs text-light-text-2 dark:text-dark-text-2 cursor-pointer hover:text-primary transition-colors">Términos</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
