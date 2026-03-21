import { useApp } from '../../context/AppContext'
import { Card } from '../../components/ui'
import { formatMXN } from '../../types'

export default function Calendario() {
  const { transactions, debts } = useApp()

  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay()

  const paymentDays = debts.map(d => ({ day: d.dueDay, label: d.name, amount: d.minimumPayment, color: '#EF4444' }))
  const recurringTx = transactions.filter(t => t.isRecurring).map(t => ({
    day: parseInt(t.date.slice(-2)),
    label: t.description,
    amount: t.amount,
    color: t.type === 'ingreso' ? '#10B981' : '#F59E0B',
  }))
  const allEvents = [...paymentDays, ...recurringTx]

  const weeks: (number | null)[][] = []
  let week: (number | null)[] = Array(firstDay === 0 ? 6 : firstDay - 1).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) weeks.push([...week, ...Array(7 - week.length).fill(null)])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Calendario de pagos</h1>

      <Card>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-light-text dark:text-dark-text capitalize">
            {today.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-btn hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer">
              <span className="material-symbols-outlined text-lg text-light-text-2 dark:text-dark-text-2">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-btn hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer">
              <span className="material-symbols-outlined text-lg text-light-text-2 dark:text-dark-text-2">chevron_right</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
            <div key={d} className="text-center text-xs font-bold text-light-muted dark:text-dark-muted uppercase py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((day, i) => {
            if (!day) return <div key={i} />
            const isToday = day === today.getDate()
            const events = allEvents.filter(e => e.day === day)
            return (
              <div key={i} className={`relative h-10 flex flex-col items-center justify-center rounded-btn text-sm cursor-pointer transition-colors
                ${isToday ? 'bg-primary text-white font-bold' : 'hover:bg-light-surface dark:hover:bg-dark-surface text-light-text dark:text-dark-text'}`}>
                {day}
                {events.length > 0 && !isToday && (
                  <div className="flex gap-0.5 absolute bottom-1">
                    {events.slice(0, 3).map((e, j) => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Upcoming */}
      <div>
        <h3 className="font-semibold text-light-text dark:text-dark-text mb-3">Próximos compromisos</h3>
        <div className="space-y-3">
          {allEvents.slice(0, 6).map((e, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-light-surface dark:bg-dark-surface rounded-btn">
              <div className="w-10 h-10 rounded-btn flex flex-col items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: e.color }}>
                <span className="text-[9px] font-bold uppercase">{today.toLocaleDateString('es-MX', { month: 'short' })}</span>
                <span className="text-sm font-bold leading-none">{e.day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-light-text dark:text-dark-text truncate">{e.label}</p>
              </div>
              <p className="font-semibold tabular-nums text-sm text-light-text dark:text-dark-text">{formatMXN(e.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
