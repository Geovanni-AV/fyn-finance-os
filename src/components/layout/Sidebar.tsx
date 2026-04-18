import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { path: '/', label: 'Dashboard', icon: 'dashboard' },
      { path: '/analisis', label: 'Análisis', icon: 'analytics' },
      { path: '/registro', label: 'Registro', icon: 'add_circle' },
    ]
  },
  {
    label: 'Finanzas',
    items: [
      { path: '/cuentas', label: 'Cuentas', icon: 'account_balance' },
      { path: '/presupuestos', label: 'Presupuestos', icon: 'payments' },
      { path: '/deudas', label: 'Deudas', icon: 'credit_card' },
    ]
  },
  {
    label: 'Herramientas',
    items: [
      { path: '/calendario', label: 'Calendario', icon: 'calendar_month' },
      { path: '/metas', label: 'Metas', icon: 'stars' },
      { path: '/simulador', label: 'Simulador', icon: 'calculate' },
    ]
  },
  {
    label: 'Sistema',
    items: [
      { path: '/alertas', label: 'Alertas', icon: 'notifications' },
      { path: '/terminal', label: 'Terminal', icon: 'terminal' },
      { path: '/perfil', label: 'Mi Perfil', icon: 'person' },
    ]
  }
]

export default function Sidebar() {
  const { alerts } = useApp()
  const unreadCount = alerts?.filter(a => !a.isRead).length || 0

  return (
    <aside className="w-[260px] depth-1 flex flex-col fixed h-full z-30 hidden lg:flex">
      {/* Logo */}
      <div className="p-8 flex items-center gap-4">
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-luster">
          <span className="material-symbols-outlined text-white text-2xl font-light">account_balance_wallet</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-atelier-text-main-light dark:text-atelier-text-main-dark leading-none tracking-tight">FYN FINANCE</span>
          <span className="text-[9px] font-bold text-primary tracking-[0.25em] uppercase mt-1">Operating System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="space-y-2">
            <p className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.2em] px-2">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `group flex items-center gap-4 px-4 py-3 rounded-full text-sm transition-all duration-300 relative ${
                      isActive
                        ? 'depth-2 text-primary font-bold shadow-sm'
                        : 'text-atelier-text-muted-light dark:text-atelier-text-muted-dark hover:text-atelier-text-main-light dark:hover:text-atelier-text-main-dark hover:depth-2'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-1 top-3 bottom-3 w-1 bg-primary rounded-full shadow-[0_0_15px_rgba(0,88,188,0.5)]" />
                      )}
                      <span className={`material-symbols-outlined text-[24px] ${isActive ? 'text-primary' : 'opacity-60 group-hover:opacity-100'}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.path === '/alertas' && unreadCount > 0 && (
                        <span className="bg-danger text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-6">
        <div className="depth-2 p-5 rounded-3xl relative overflow-hidden group shadow-sm transition-all hover:shadow-luster">
          <div className="absolute -top-2 -right-2 p-2 opacity-5 group-hover:opacity-15 transition-opacity">
            <span className="material-symbols-outlined text-6xl">workspace_premium</span>
          </div>
          <div className="flex items-center gap-2 mb-2 font-black text-primary text-[9px] uppercase tracking-widest">
            <span className="material-symbols-outlined text-xs">verified</span>
            Fyn Pro Active
          </div>
          <p className="text-[10px] text-atelier-text-muted-light dark:text-atelier-text-muted-dark leading-relaxed font-semibold">
            Sincronización bancaria y análisis con IA habilitado.
          </p>
        </div>
      </div>
    </aside>
  )
}

