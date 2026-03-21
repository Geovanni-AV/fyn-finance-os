import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { useNetWorth } from '../../hooks/useFinance'
import { Card, Button, Drawer } from '../../components/ui'
import { formatMXN, formatMXNShort, CATEGORY_ICONS, CATEGORY_COLORS } from '../../types'

export default function Cuentas() {
  const { accounts, transactions } = useApp()
  const nw = useNetWorth()
  const [selectedAcc, setSelectedAcc] = useState<string | null>(null)

  const acc = useMemo(() => accounts.find(a => a.id === selectedAcc), [accounts, selectedAcc])
  const accTx = useMemo(() =>
    selectedAcc ? transactions.filter(t => t.accountId === selectedAcc).slice(0, 10) : [],
    [transactions, selectedAcc]
  )

  const chartData = useMemo(() => {
    return accounts.filter(a => a.isActive && a.balance > 0).map(a => ({
      name: a.bank,
      value: a.balance,
      color: a.color,
    })).sort((a, b) => b.value - a.value)
  }, [accounts])

  const formatCardNumber = (num?: string) => {
    if (!num) return '••••  ••••  ••••  ••••'
    return `••••  ••••  ••••  ${num}`
  }

  return (
    <div className="p-4 lg:p-6 lg:max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Cuentas y Patrimonio</h1>
        <Button variant="secondary" size="sm">
          <span className="material-symbols-outlined text-lg">add</span>
          Nueva cuenta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Worth Resumen */}
        <Card className="lg:col-span-1 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-xl" />
          <p className="text-sm font-medium text-light-text-2 dark:text-dark-text-2 uppercase tracking-wide mb-1">Patrimonio Neto</p>
          <p className="text-4xl font-bold tabular-nums text-light-text dark:text-dark-text tracking-tight mb-6">
            {formatMXN(nw.netWorth)}
          </p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-light-text dark:text-dark-text">Activos (Cuentas)</span>
                <span className="font-semibold text-success tabular-nums">{formatMXNShort(nw.assets)}</span>
              </div>
              <div className="h-1.5 w-full bg-light-surface dark:bg-dark-surface rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${(nw.assets / (nw.assets + nw.liabilities || 1)) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-light-text dark:text-dark-text">Pasivos (Deudas)</span>
                <span className="font-semibold text-danger tabular-nums">{formatMXNShort(nw.liabilities)}</span>
              </div>
              <div className="h-1.5 w-full bg-light-surface dark:bg-dark-surface rounded-full overflow-hidden">
                <div className="h-full bg-danger rounded-full" style={{ width: `${(nw.liabilities / (nw.assets + nw.liabilities || 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Distribución chart */}
        <Card className="lg:col-span-2 flex items-center">
          <div className="w-1/2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                  paddingAngle={5} dataKey="value" stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number) => formatMXNShort(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 pl-6 space-y-3">
            <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mb-4">Distribución de liquidez</h3>
            {chartData.slice(0, 4).map(d => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-light-text-2 dark:text-dark-text-2">{d.name}</span>
                </div>
                <span className="font-semibold tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(d.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.filter(a => a.isActive).map(a => (
          <div key={a.id} onClick={() => setSelectedAcc(a.id)}
            className="rounded-xl p-5 cursor-pointer relative overflow-hidden shadow-lg transition-transform hover:-translate-y-1 active:scale-95 group"
            style={{
              background: `linear-gradient(135deg, ${a.color} 0%, ${a.color}dd 100%)`,
              color: 'white'
            }}>
            {/* Elementos decorativos glassmorphism */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 p-4 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-8xl transform rotate-12">{
                a.type === 'credito' ? 'credit_card' : a.type === 'efectivo' ? 'payments' : 'account_balance'
              }</span>
            </div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <p className="font-bold text-lg tracking-wide shadow-sm">{a.bank}</p>
                <p className="text-white/70 text-xs uppercase tracking-widest">{a.type}</p>
              </div>
              <span className="material-symbols-outlined opacity-80">{a.type === 'efectivo' ? 'payments' : 'contactless'}</span>
            </div>

            <div className="space-y-4 relative z-10">
              <p className="font-mono text-sm tracking-[0.2em] opacity-80">{formatCardNumber(a.lastFour)}</p>
              <div>
                <p className="text-xs text-white/70 uppercase tracking-wider mb-0.5">{a.type === 'credito' ? 'Deuda actual' : 'Saldo disponible'}</p>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                  {formatMXN(a.balance)}
                </p>
                {a.type === 'credito' && a.creditLimit && (
                  <p className="text-xs text-white/70 mt-1">Límite: {formatMXNShort(a.creditLimit)}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer de detalle de cuenta */}
      <Drawer isOpen={!!selectedAcc} onClose={() => setSelectedAcc(null)} title="Detalle de cuenta" width={400}>
        {acc && (
          <div className="space-y-6">
            {/* Header Drawer */}
            <div className="text-center pb-6 border-b border-light-border dark:border-dark-border">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-3 shadow-lg"
                style={{ backgroundColor: acc.color }}>
                {acc.bank.slice(0, 2)}
              </div>
              <h2 className="text-xl font-bold text-light-text dark:text-dark-text">{acc.name}</h2>
              <p className="text-sm text-light-text-2 dark:text-dark-text-2 capitalize mb-4">{acc.type} · {acc.bank}</p>
              <p className={`text-4xl font-bold tabular-nums tracking-tight ${acc.balance < 0 ? 'text-danger' : 'text-light-text dark:text-dark-text'}`}>
                {formatMXN(acc.balance)}
              </p>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <Button className="flex-1 justify-center" variant="secondary">
                <span className="material-symbols-outlined text-lg">edit</span> Editar
              </Button>
              <Button className="flex-1 justify-center" variant="secondary">
                <span className="material-symbols-outlined text-lg">sync</span> Sync
              </Button>
            </div>

            {/* Info addicional */}
            {acc.type === 'credito' && acc.creditLimit && (
              <div className="bg-light-surface dark:bg-dark-surface rounded-card p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-2 dark:text-dark-text-2">Límite de crédito</span>
                  <span className="font-semibold text-light-text dark:text-dark-text">{formatMXN(acc.creditLimit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-2 dark:text-dark-text-2">Crédito disponible</span>
                  <span className="font-semibold text-success tabular-nums">{formatMXN(acc.creditLimit + acc.balance)}</span>
                </div>
                <div className="w-full h-1.5 bg-light-border dark:bg-dark-border rounded-full overflow-hidden">
                  <div className="h-full bg-danger rounded-full" style={{ width: `${(Math.abs(acc.balance) / acc.creditLimit) * 100}%` }} />
                </div>
              </div>
            )}

            {/* Movimientos de la cuenta */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-light-text dark:text-dark-text">Últimos movimientos</h3>
              </div>
              {accTx.length > 0 ? (
                <div className="space-y-3">
                  {accTx.map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 p-3 bg-light-surface dark:bg-dark-surface rounded-btn">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${CATEGORY_COLORS[tx.category]}20` }}>
                        <span className="material-symbols-outlined text-base" style={{ color: CATEGORY_COLORS[tx.category] }}>
                          {CATEGORY_ICONS[tx.category]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-light-text dark:text-dark-text truncate">{tx.description}</p>
                        <p className="text-[10px] text-light-text-2 dark:text-dark-text-2">
                          {new Date(tx.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <p className={`text-sm font-semibold tabular-nums flex-shrink-0 ${tx.type === 'ingreso' ? 'text-success' : 'text-danger'}`}>
                        {tx.type === 'ingreso' ? '+' : '-'}{formatMXNShort(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-light-text-2 dark:text-dark-text-2 py-8">No hay movimientos recientes.</p>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
