import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { Button, Card, Toggle, Drawer, EmptyState } from '../../components/ui'

const SEVERITY_ICONS: Record<string, string> = {
  info: 'info', warning: 'warning', danger: 'error', success: 'check_circle'
}
const SEVERITY_COLORS: Record<string, string> = {
  info: 'text-primary bg-primary/10 border-primary/20', 
  warning: 'text-warning bg-warning/10 border-warning/20',
  danger: 'text-danger bg-danger/10 border-danger/20', 
  success: 'text-success bg-success/10 border-success/20'
}

export default function Alertas() {
  const { alerts, markAlertRead, markAllAlertsRead, alertSettings, updateAlertSettings } = useApp()
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  const todayAlerts = useMemo(() =>
    alerts.filter(a => new Date(a.date).toDateString() === new Date().toDateString()),
    [alerts]
  )
  const previousAlerts = useMemo(() =>
    alerts.filter(a => new Date(a.date).toDateString() !== new Date().toDateString()),
    [alerts]
  )

  const unreadCount = alerts.filter(a => !a.isRead).length

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">Centro de Alertas</h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 italic">
            {unreadCount > 0 ? `Tienes ${unreadCount} alertas sin leer` : 'Todo al día'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={markAllAlertsRead}>
              <span className="material-symbols-outlined text-lg">done_all</span> Marcar todas
            </Button>
          )}
          <Button variant="ghost" className="lg:hidden" onClick={() => setIsConfigOpen(true)}>
            <span className="material-symbols-outlined text-lg">settings</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lista de alertas */}
        <div className="lg:col-span-8 space-y-6">
          {todayAlerts.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-light-text-2 dark:text-dark-text-2 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Hoy
              </h2>
              <div className="space-y-4">
                {todayAlerts.map(a => (
                  <AlertItem key={a.id} alert={a} onRead={() => markAlertRead(a.id)} />
                ))}
              </div>
            </section>
          )}

          {previousAlerts.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-light-text-2 dark:text-dark-text-2 uppercase tracking-[0.2em] mb-4">Anteriores</h2>
              <div className="space-y-4">
                {previousAlerts.map(a => (
                  <AlertItem key={a.id} alert={a} onRead={() => markAlertRead(a.id)} />
                ))}
              </div>
            </section>
          )}

          {alerts.length === 0 && (
            <EmptyState 
              icon="notifications_off" 
              title="Estás al día" 
              description="No tienes notificaciones pendientes. Te avisaremos cuando haya algo importante." 
            />
          )}
        </div>

        {/* Desktop Sidebar Settings */}
        <div className="hidden lg:block lg:col-span-4 self-start sticky top-24">
          <Card className="space-y-8 p-6 bg-light-surface/20 dark:bg-dark-surface/20 border-dashed border-2">
            <h3 className="font-black text-sm uppercase tracking-widest text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-4 mb-6">Configuración</h3>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-lg">account_balance_wallet</span>
                  <p className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-widest">Presupuestos</p>
                </div>
                <Toggle label="Alerta al 80% del límite" checked={alertSettings.presupuestoAlerta}
                  onChange={v => updateAlertSettings({ presupuestoAlerta: v })} />
                <Toggle label="Presupuesto excedido" checked={alertSettings.presupuestoExcedido}
                  onChange={v => updateAlertSettings({ presupuestoExcedido: v })} />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-lg">payments</span>
                  <p className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-widest">Pagos y Cuentas</p>
                </div>
                <Toggle label="Recordatorio pago próximo" checked={alertSettings.pagoProximo}
                  onChange={v => updateAlertSettings({ pagoProximo: v })} />
                <Toggle label="Saldo de cuenta bajo" checked={alertSettings.saldoBajo}
                  onChange={v => updateAlertSettings({ saldoBajo: v })} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-lg">flag</span>
                  <p className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-widest">Logros</p>
                </div>
                <Toggle label="Meta completada" checked={alertSettings.metaLograda}
                  onChange={v => updateAlertSettings({ metaLograda: v })} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Drawer isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} title="Configuración de Alertas" width={420}>
        <div className="space-y-8">
          <p className="text-sm text-light-text-2 dark:text-dark-text-2">Personaliza cómo y cuándo recibes notificaciones.</p>

          <div className="bg-light-surface/40 dark:bg-dark-surface/40 rounded-2xl p-4 border border-light-border/30 dark:border-dark-border/30 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
              <p className="text-xs font-bold text-light-text-2 dark:text-dark-text-2 uppercase tracking-widest">Presupuestos</p>
            </div>
            <div className="space-y-4">
              <Toggle label="Alerta al 80% del límite" checked={alertSettings.presupuestoAlerta}
                onChange={v => updateAlertSettings({ presupuestoAlerta: v })} />
              <Toggle label="Presupuesto excedido" checked={alertSettings.presupuestoExcedido}
                onChange={v => updateAlertSettings({ presupuestoExcedido: v })} />
            </div>
          </div>
          
          <div className="bg-light-surface/40 dark:bg-dark-surface/40 rounded-2xl p-4 border border-light-border/30 dark:border-dark-border/30 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">payments</span>
              <p className="text-xs font-bold text-light-text-2 dark:text-dark-text-2 uppercase tracking-widest">Pagos y Cuentas</p>
            </div>
            <div className="space-y-4">
              <Toggle label="Recordatorio pago próximo" checked={alertSettings.pagoProximo}
                onChange={v => updateAlertSettings({ pagoProximo: v })} />
              <Toggle label="Saldo de cuenta bajo" checked={alertSettings.saldoBajo}
                onChange={v => updateAlertSettings({ saldoBajo: v })} />
              <Toggle label="Gasto inusual detectado" checked={alertSettings.gastoInusual}
                onChange={v => updateAlertSettings({ gastoInusual: v })} />
            </div>
          </div>
          
          <div className="bg-light-surface/40 dark:bg-dark-surface/40 rounded-2xl p-4 border border-light-border/30 dark:border-dark-border/30 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">flag</span>
              <p className="text-xs font-bold text-light-text-2 dark:text-dark-text-2 uppercase tracking-widest">Logros</p>
            </div>
            <div className="space-y-4">
              <Toggle label="Meta completada" checked={alertSettings.metaLograda}
                onChange={v => updateAlertSettings({ metaLograda: v })} />
              <Toggle label="Rachas de ahorro" checked={alertSettings.rachaAhorro}
                onChange={v => updateAlertSettings({ rachaAhorro: v })} />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}

function AlertItem({ alert, onRead }: { alert: any; onRead: () => void }) {
  const time = new Date(alert.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return (
    <Card padding={false} className={`transition-all duration-300 relative group overflow-hidden ${
      alert.isRead
        ? 'opacity-60 hover:opacity-100 bg-transparent border-light-border/50 shadow-none'
        : 'bg-light-card dark:bg-dark-card border-l-4 shadow-md'
    }`} style={{ borderLeftColor: alert.isRead ? 'transparent' : 'var(--primary-color, #2563EB)' }}>
      
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-start group-hover:-translate-y-0.5 transition-transform">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all duration-300 group-hover:scale-110 ${SEVERITY_COLORS[alert.severity]}`}>
          <span className="material-symbols-outlined text-2xl">{SEVERITY_ICONS[alert.severity]}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1.5">
            <h3 className={`text-base font-bold truncate pr-2 ${alert.isRead ? 'text-light-text-2 dark:text-dark-text-2' : 'text-light-text dark:text-dark-text'}`}>
              {alert.title}
            </h3>
            <span className="text-[11px] font-medium text-light-muted dark:text-dark-muted flex-shrink-0 whitespace-nowrap bg-light-surface dark:bg-dark-surface px-2 py-0.5 rounded-full">{time}</span>
          </div>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 leading-relaxed mb-4 sm:mb-0 pr-4">{alert.message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex sm:flex-col gap-2 sm:mt-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {!alert.isRead && (
            <Button variant="ghost" size="sm" onClick={onRead} className="w-full sm:w-auto text-xs py-1.5 px-3 bg-primary/5 hover:bg-primary/15 text-primary">
              <span className="material-symbols-outlined text-sm">check</span>
              Leída
            </Button>
          )}
          <Button variant="ghost" size="sm" className="w-full sm:w-auto text-xs py-1.5 px-3 hover:bg-light-surface dark:hover:bg-dark-surface text-light-text-2 dark:text-dark-text-2">
            <span className="material-symbols-outlined text-sm">schedule</span>
            Posponer
          </Button>
        </div>
      </div>
    </Card>
  )
}
