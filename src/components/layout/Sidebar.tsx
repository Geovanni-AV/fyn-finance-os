import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const NAV_GROUPS = [
  {
    label: 'Operación diaria',
    items: [
      { path: '/',             label: 'Dashboard',    icon: 'dashboard' },
      { path: '/registro',     label: 'Registrar',    icon: 'add_circle' },
      { path: '/cuentas',      label: 'Cuentas',      icon: 'account_balance_wallet' },
      { path: '/alertas',      label: 'Alertas',      icon: 'notifications' },
    ],
  },
  {
    label: 'Planificación',
    items: [
      { path: '/presupuestos', label: 'Presupuestos', icon: 'pie_chart' },
      { path: '/deudas',       label: 'Deudas',       icon: 'credit_card' },
      { path: '/metas',        label: 'Metas',        icon: 'savings' },
      { path: '/calendario',   label: 'Calendario',   icon: 'calendar_month' },
    ],
  },
  {
    label: 'Estrategia',
    items: [
      { path: '/net-worth',  label: 'Net Worth',  icon: 'account_balance' },
      { path: '/simulador',  label: 'Simulador',  icon: 'calculate' },
      { path: '/analisis',   label: 'Análisis',   icon: 'bar_chart' },
      { path: '/perfil',     label: 'Perfil',     icon: 'person' },
    ],
  },
]

export default function Sidebar() {
  const { alerts, profile } = useApp()
  const unread = alerts.filter(a => !a.isRead).length

  return (
    <aside className="w-[220px] bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border flex flex-col fixed h-full z-30 hidden lg:flex">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-light-border dark:border-dark-border">
        <div className="w-8 h-8 bg-primary rounded-btn flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-white text-lg">account_balance_wallet</span>
        </div>
        <span className="text-sm font-bold text-light-text dark:text-dark-text leading-tight">Fyn Finance OS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 no-scrollbar">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider px-2 mb-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-btn text-sm transition-colors duration-150 relative ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface dark:hover:bg-dark-surface hover:text-light-text dark:hover:text-dark-text'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.path === '/alertas' && unread > 0 && (
                    <span className="ml-auto bg-danger text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-light-border dark:border-dark-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-btn bg-light-surface dark:bg-dark-surface">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
            {profile.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-light-text dark:text-dark-text truncate">{profile.name}</p>
            <p className="text-[10px] text-light-muted dark:text-dark-muted">Plan Básico</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
