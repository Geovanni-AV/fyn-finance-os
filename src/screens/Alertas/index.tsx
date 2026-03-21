import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { Button, Card, Toggle } from '../../components/ui'

const SEVERITY_ICONS: Record<string, string> = {
  info: 'info', warning: 'warning', danger: 'error', success: 'check_circle'
}
const SEVERITY_COLORS: Record<string, string> = {
  info: 'text-primary bg-primary/10', warning: 'text-warning bg-warning/10',
  danger: 'text-danger bg-danger/10', success: 'text-success bg-success/10'
}

export default function Alertas() {
  const { alerts, markAlertRead, markAllAlertsRead, alertSettings, updateAlertSettings } = useApp()

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
    <div className="p-4 lg:p-6 lg:max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Centro de Alertas</h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 mt-1">
            {unreadCount > 0 ? `Tienes ${unreadCount} alertas sin leer` : 'Todo al día'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllAlertsRead}>
              <span className="material-symbols-outlined text-lg">done_all</span> Marcar leídas
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de alertas */}
        <div className="lg:col-span-2 space-y-6">
          {todayAlerts.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide mb-3">Hoy</h2>
              <div className="space-y-2">
                {todayAlerts.map(a => (
                  <AlertItem key={a.id} alert={a} onRead={() => markAlertRead(a.id)} />
                ))}
              </div>
            </section>
          )}

          {previousAlerts.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide mb-3">Anteriores</h2>
              <div className="space-y-2">
                {previousAlerts.map(a => (
                  <AlertItem key={a.id} alert={a} onRead={() => markAlertRead(a.id)} />
                ))}
              </div>
            </section>
          )}

          {alerts.length === 0 && (
            <div className="text-center py-20 bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border">
              <span className="material-symbols-outlined text-4xl text-light-muted dark:text-dark-muted mb-3">notifications_paused</span>
              <p className="text-light-text dark:text-dark-text font-medium">No hay alertas</p>
              <p className="text-sm text-light-text-2 dark:text-dark-text-2 mt-1">Te avisaremos cuando haya algo importante.</p>
            </div>
          )}
        </div>

        {/* Configuración */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-light-border dark:border-dark-border">
              <span className="material-symbols-outlined text-light-text dark:text-dark-text">settings</span>
              <h3 className="font-semibold text-light-text dark:text-dark-text">Configuración</h3>
            </div>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-light-text-2 dark:text-dark-text-2 uppercase tracking-wider mb-3">Presupuestos</p>
                <div className="space-y-3">
                  <Toggle label="Alerta al 80%" checked={alertSettings.presupuestoAlerta}
                    onChange={v => updateAlertSettings({ presupuestoAlerta: v })} />
                  <Toggle label="Presupuesto excedido" checked={alertSettings.presupuestoExcedido}
                    onChange={v => updateAlertSettings({ presupuestoExcedido: v })} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-light-text-2 dark:text-dark-text-2 uppercase tracking-wider mb-3">Pagos y cuentas</p>
                <div className="space-y-3">
                  <Toggle label="Recordatorio pago próximo" checked={alertSettings.pagoProximo}
                    onChange={v => updateAlertSettings({ pagoProximo: v })} />
                  <Toggle label="Saldo de cuenta bajo" checked={alertSettings.saldoBajo}
                    onChange={v => updateAlertSettings({ saldoBajo: v })} />
                  <Toggle label="Gasto inusual detectado" checked={alertSettings.gastoInusual}
                    onChange={v => updateAlertSettings({ gastoInusual: v })} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-light-text-2 dark:text-dark-text-2 uppercase tracking-wider mb-3">Logros</p>
                <div className="space-y-3">
                  <Toggle label="Meta completada" checked={alertSettings.metaLograda}
                    onChange={v => updateAlertSettings({ metaLograda: v })} />
                  <Toggle label="Rachas de ahorro" checked={alertSettings.rachaAhorro}
                    onChange={v => updateAlertSettings({ rachaAhorro: v })} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AlertItem({ alert, onRead }: { alert: any; onRead: () => void }) {
  const time = new Date(alert.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`flex gap-4 p-4 rounded-card border transition-all ${
      alert.isRead
        ? 'bg-transparent border-light-border dark:border-dark-border opacity-70'
        : 'bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border shadow-sm shadow-primary/5'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${SEVERITY_COLORS[alert.severity]}`}>
        <span className="material-symbols-outlined text-xl">{SEVERITY_ICONS[alert.severity]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <p className={`text-sm font-semibold truncate pr-2 ${alert.isRead ? 'text-light-text-2 dark:text-dark-text-2' : 'text-light-text dark:text-dark-text'}`}>
            {alert.title}
          </p>
          <span className="text-[10px] text-light-muted dark:text-dark-muted flex-shrink-0 whitespace-nowrap">{time}</span>
        </div>
        <p className="text-sm text-light-text-2 dark:text-dark-text-2 leading-snug">{alert.message}</p>
        {!alert.isRead && (
          <button onClick={onRead} className="mt-3 text-xs font-medium text-primary hover:underline cursor-pointer">
            Marcar como leída
          </button>
        )}
      </div>
      {!alert.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
    </div>
  )
}
