import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const ITEMS = [
  { path: '/',            label: 'Inicio',    icon: 'dashboard' },
  { path: '/analisis',    label: 'Análisis',  icon: 'bar_chart' },
  { path: '/registro',    label: 'Registrar', icon: 'add_circle', fab: true },
  { path: '/cuentas',     label: 'Cuentas',   icon: 'account_balance_wallet' },
  { path: '/perfil',      label: 'Perfil',    icon: 'person' },
]

export default function BottomNav() {
  const { alerts } = useApp()
  const unread = alerts.filter(a => !a.isRead).length

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-light-card dark:bg-dark-card border-t border-light-border dark:border-dark-border px-2 pb-safe">
      <div className="flex items-center justify-around h-16">
        {ITEMS.map(item => (
          item.fab ? (
            <NavLink key={item.path} to={item.path}
              className="flex flex-col items-center justify-center -mt-6">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-white text-2xl">{item.icon}</span>
              </div>
            </NavLink>
          ) : (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 relative ${isActive ? 'text-primary' : 'text-light-muted dark:text-dark-muted'}`
              }
            >
              <div className="relative">
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                {item.path === '/' && unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-danger rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          )
        ))}
      </div>
    </nav>
  )
}
