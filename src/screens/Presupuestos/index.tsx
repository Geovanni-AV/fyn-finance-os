import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { Button, Card, ProgressBar } from '../../components/ui'
import { formatMXN, CATEGORY_ICONS, CATEGORY_LABELS, getBudgetStatus } from '../../types'

export default function Presupuestos() {
  const { budgets } = useApp()

  const { totalLimit, totalSpent } = useMemo(() => {
    return budgets.reduce((acc, b) => ({
      totalLimit: acc.totalLimit + b.monthlyLimit,
      totalSpent: acc.totalSpent + b.spent,
    }), { totalLimit: 0, totalSpent: 0 })
  }, [budgets])

  const globalPct = totalLimit > 0 ? totalSpent / totalLimit : 0
  const globalColor = globalPct > 0.9 ? '#EF4444' : globalPct > 0.7 ? '#F59E0B' : '#10B981'

  // Proyección simple lineal (asumiendo gasto constante)
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const currentDay = today.getDate()
  const projectedSpent = currentDay > 0 ? (totalSpent / currentDay) * daysInMonth : totalSpent

  return (
    <div className="p-4 lg:p-6 lg:max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Presupuestos</h1>
        <Button variant="secondary" size="sm">
          <span className="material-symbols-outlined text-lg">add</span>
          Nuevo
        </Button>
      </div>

      {/* Resumen Global */}
      <Card className="bg-light-surface dark:bg-dark-surface border-none" padding={false}>
        <div className="p-6">
          <p className="text-sm font-semibold text-light-text-2 dark:text-dark-text-2 mb-4">Resumen de Octubre</p>
          <div className="flex flex-col md:flex-row gap-6 md:items-end mb-6">
            <div className="flex-1">
              <p className="text-xs text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide mb-1">Gastado</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums tracking-tight text-light-text dark:text-dark-text">{formatMXN(totalSpent)}</span>
                <span className="text-sm font-medium text-light-text-2 dark:text-dark-text-2">/ {formatMXN(totalLimit)}</span>
              </div>
            </div>
            <div className="md:w-48 bg-light-card dark:bg-dark-card rounded-btn p-3 border border-light-border dark:border-dark-border">
              <p className="text-[10px] text-light-text-2 dark:text-dark-text-2 uppercase tracking-wider mb-1">Proyección fin de mes</p>
              <p className={`text-lg font-bold tabular-nums ${projectedSpent > totalLimit ? 'text-danger' : 'text-light-text dark:text-dark-text'}`}>
                {formatMXN(projectedSpent)}
              </p>
            </div>
          </div>
          <ProgressBar value={totalSpent} max={totalLimit} color={globalColor} ghost={projectedSpent} />
        </div>
      </Card>

      {/* Lista de presupuestos por categoría */}
      <h2 className="text-lg font-semibold text-light-text dark:text-dark-text pt-2">Por categoría</h2>
      <div className="grid gap-4">
        {budgets.map(b => {
          const status = getBudgetStatus(b)
          const color = status === 'ok' ? '#10B981' : status === 'warning' ? '#F59E0B' : '#EF4444'
          const pct = Math.min((b.spent / b.monthlyLimit) * 100, 100)

          return (
            <Card key={b.id} className="transition-all hover:border-primary/30">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}15`, color }}>
                  <span className="material-symbols-outlined">{CATEGORY_ICONS[b.category]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-light-text dark:text-dark-text">{CATEGORY_LABELS[b.category]}</h3>
                  <p className="text-xs text-light-text-2 dark:text-dark-text-2 mt-0.5">
                    {formatMXN(b.monthlyLimit - b.spent)} disponibles
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums text-light-text dark:text-dark-text">{formatMXN(b.spent)}</p>
                  <p className="text-xs text-light-text-2 dark:text-dark-text-2 mt-0.5">de {formatMXN(b.monthlyLimit)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <ProgressBar value={b.spent} max={b.monthlyLimit} color={color} />
                </div>
                <span className="text-xs font-bold tabular-nums w-9 text-right" style={{ color }}>
                  {Math.round(pct)}%
                </span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
