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
      { path: '/perfil', label: 'Mi Perfil', icon: 'person' },
    ]
  }
]

export default function Sidebar() {
  const { alerts } = useApp()
  const unreadCount = alerts?.filter(a => !a.isRead).length || 0

  return (
    <aside className="w-[240px] bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border flex flex-col fixed h-full z-30 hidden lg:flex">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-light-border dark:border-dark-border">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-white text-xl">account_balance_wallet</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-light-text dark:text-dark-text leading-none tracking-tight">FYN FINANCE</span>
          <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Operating System</span>
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
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative ${
                      isActive
                        ? 'bg-primary/10 text-primary font-bold shadow-sm'
                        : 'text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface dark:hover:bg-dark-surface hover:text-light-text dark:hover:text-dark-text'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-primary rounded-r-full shadow-[0_0_12px_rgba(37,99,235,0.6)]" />
                      )}
                      <span className={`material-symbols-outlined text-[22px] transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.path === '/alertas' && unreadCount > 0 && (
                        <span className="bg-danger text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-danger/20 animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                      {!isActive && (
                        <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-30 transition-opacity">chevron_right</span>
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
      <div className="p-4 border-t border-light-border dark:border-dark-border">
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden group border-primary/10">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-4xl">workspace_premium</span>
          </div>
          <div className="flex items-center gap-2 mb-2 font-black text-primary text-[10px] uppercase tracking-widest">
            <span className="material-symbols-outlined text-xs">verified</span>
            Fyn Pro Active
          </div>
          <p className="text-[10px] text-light-muted dark:text-dark-muted leading-relaxed font-medium">
            Sincronización bancaria y análisis con IA habilitado.
          </p>
        </div>
      </div>
    </aside>
  )
}

