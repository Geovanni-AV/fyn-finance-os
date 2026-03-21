import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { Card, Button, Badge, CalendarGrid, type CalendarEvent } from '../../components/ui'
import { formatMXN, CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_LABELS } from '../../types'

export default function Calendario() {
  const { transactions, debts, goals } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate())

  const curMonth = currentDate.getMonth()
  const curYear = currentDate.getFullYear()

  const handlePrevMonth = () => setCurrentDate(new Date(curYear, curMonth - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(curYear, curMonth + 1, 1))
  const handleToday = () => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDay(now.getDate())
  }

  // Calculate events for the current month
  const events: CalendarEvent[] = useMemo(() => {
    const evs: CalendarEvent[] = []

    // 1. Transactions (filtering for current month/year)
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
        evs.push({
          id: `tx-${t.id}`,
          day: d.getDate(),
          title: t.description,
          type: t.type === 'ingreso' ? 'success' : 'info',
          color: CATEGORY_COLORS[t.category],
          amount: t.amount,
          icon: CATEGORY_ICONS[t.category]
        })
      }
    })

    // 2. Debts (assuming they occur every month on dueDay)
    debts.forEach(debt => {
      evs.push({
        id: `debt-${debt.id}`,
        day: debt.dueDay,
        title: `Pago: ${debt.name}`,
        type: 'danger',
        color: '#EF4444',
        amount: debt.minimumPayment,
        icon: 'payments'
      })
    })

    // 3. Goals (if targetDate is in this month)
    goals.forEach(goal => {
      const d = new Date(goal.targetDate)
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
        evs.push({
          id: `goal-${goal.id}`,
          day: d.getDate(),
          title: `Meta: ${goal.name}`,
          type: 'success',
          color: goal.color,
          amount: goal.targetAmount,
          icon: goal.icon
        })
      }
    })

    return evs
  }, [transactions, debts, goals, curMonth, curYear])

  const selectedDayEvents = events.filter(e => e.day === selectedDay)

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">Calendario Financiero</h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 italic">
            <span className="capitalize">{currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
          </p>
        </div>
        <div className="flex items-center bg-light-surface dark:bg-dark-surface p-1 rounded-2xl border border-light-border/30 dark:border-dark-border/30 shadow-sm">
          <Button variant="ghost" size="sm" iconOnly onClick={handlePrevMonth}>
             <span className="material-symbols-outlined">chevron_left</span>
          </Button>
          <Button variant="ghost" size="sm" className="px-4 font-bold text-xs uppercase tracking-widest" onClick={handleToday}>
            Hoy
          </Button>
          <Button variant="ghost" size="sm" iconOnly onClick={handleNextMonth}>
             <span className="material-symbols-outlined">chevron_right</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Calendar Grid (7/10) */}
        <Card className="lg:col-span-7 p-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />
          <div className="relative z-10">
            <CalendarGrid 
              year={curYear}
              month={curMonth}
              events={events}
              onDayClick={setSelectedDay}
              className="min-h-[500px]" 
            />
          </div>
        </Card>

        {/* Selected Day Details (3/10) */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="h-full flex flex-col min-h-[500px] bg-primary/5 border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/60 to-primary/20" />
            
            <div className="p-6 border-b border-primary/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted mb-1">Detalles del día</p>
              <h2 className="text-2xl font-black text-light-text dark:text-dark-text">
                {selectedDay} de {currentDate.toLocaleDateString('es-MX', { month: 'long' })}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map(e => (
                  <div key={e.id} className="p-4 bg-white/40 dark:bg-black/40 rounded-2xl border border-white/60 dark:border-white/5 backdrop-blur-md shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"
                        style={{ backgroundColor: e.color }}>
                        <span className="material-symbols-outlined text-xl">{e.icon || 'event'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-light-text dark:text-dark-text truncate">{e.title}</p>
                        <Badge variant={e.type === 'success' ? 'success' : e.type === 'danger' ? 'danger' : 'info'} className="mt-1 scale-90 origin-left opacity-80">
                          {e.type === 'success' ? 'Ingreso/Meta' : e.type === 'danger' ? 'Pago' : 'Gasto'}
                        </Badge>
                      </div>
                    </div>
                    {e.amount !== undefined && (
                      <div className="mt-4 pt-3 border-t border-light-border/20 dark:border-dark-border/20 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">Monto</span>
                        <span className={`text-sm font-black tabular-nums ${e.type === 'success' ? 'text-success' : 'text-danger'}`}>
                          {e.type === 'success' ? '+' : '-'}{formatMXN(e.amount)}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <span className="material-symbols-outlined text-6xl mb-4">coffee</span>
                  <p className="text-sm font-bold text-light-text dark:text-dark-text">Sin compromisos para hoy</p>
                  <p className="text-xs mt-1">¡Un día de descanso financiero!</p>
                </div>
              )}
            </div>

            {selectedDayEvents.length > 0 && (
              <div className="p-6 bg-primary/10 border-t border-primary/5">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-black uppercase text-primary/70">Balance del día</p>
                  <p className="text-lg font-black text-primary">
                    {formatMXN(selectedDayEvents.reduce((acc, e) => acc + (e.type === 'success' ? (e.amount || 0) : -(e.amount || 0)), 0))}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
