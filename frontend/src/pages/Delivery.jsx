import { useEffect, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { useCustomerDataController } from '../data/useCustomerDataController'

export default function Delivery() {
  const { getDeliverySummaryByMonth } = useCustomerDataController()
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const monthLabel = useMemo(
    () =>
      monthDate.toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric',
      }),
    [monthDate]
  )

  useEffect(() => {
    let alive = true
    setLoading(true)
    getDeliverySummaryByMonth(monthDate)
      .then((data) => {
        if (!alive) return
        setRows(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error('Errore caricando le consegne del mese', err)
        if (!alive) return
        setRows([])
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [monthDate, getDeliverySummaryByMonth])

  const uniqueCustomers = useMemo(() => new Set(rows.map((r) => r.customerId)).size, [rows])
  const totalPieces = useMemo(
    () => rows.reduce((acc, r) => acc + (Number(r.totalQuantity) || 0), 0),
    [rows]
  )

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-3xl md:text-4xl font-bold text-bakery-brown">Consegne effettuate</h2>
        <p className="text-bakery-choco/80">
          Seleziona un mese per vedere il riepilogo delle consegne effettuate per cliente e tipo di
          pane.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Mese */}
        <section className="lg:col-span-5 bg-white rounded-xl border border-bakery-wheat p-3 md:p-4">
          <h2 className="text-lg font-medium text-bakery-choco mb-2">Seleziona mese</h2>
          <div className="rounded-lg border border-bakery-choco/20 p-2 inline-block bg-white">
            <DayPicker
              mode="single"
              selected={monthDate}
              onSelect={(d) => d && setMonthDate(new Date(d.getFullYear(), d.getMonth(), 1))}
              month={monthDate}
              onMonthChange={(m) => setMonthDate(new Date(m.getFullYear(), m.getMonth(), 1))}
              showOutsideDays
              weekStartsOn={1}
            />
          </div>
          <p className="mt-2 text-bakery-choco/90">Mese corrente: {monthLabel}</p>
        </section>

        {/* Riepilogo */}
        <section className="lg:col-span-7 bg-white rounded-xl border border-bakery-wheat p-4 md:p-5">
          <h2 className="text-lg font-medium text-bakery-choco mb-2">Riepilogo mese</h2>
          <div className="text-bakery-choco/90 flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <span className="text-bakery-choco/70">Clienti:</span> {uniqueCustomers}
            </div>
            <div>
              <span className="text-bakery-choco/70">Righe:</span> {rows.length}
            </div>
            <div>
              <span className="text-bakery-choco/70">Pezzi totali:</span> {totalPieces}
            </div>
          </div>
        </section>

        {/* Tabella risultati */}
        <section className="lg:col-span-12 bg-bakery-cream rounded-xl border border-bakery-wheat p-5">
          <h2 className="text-xl font-semibold text-bakery-brown mb-1">Consegne del mese</h2>
          {loading ? (
            <div className="text-bakery-choco/80">Caricamento…</div>
          ) : rows.length === 0 ? (
            <div className="text-bakery-choco/80">Nessuna consegna registrata in {monthLabel}.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '40%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                  <tr className="text-bakery-choco/70">
                    <th className="text-left py-2 px-2">Cliente</th>
                    <th className="text-left py-2 px-2"># consegne</th>
                    <th className="text-left py-2 px-2">Pane</th>
                    <th className="text-left py-2 px-2">Quantità totale</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={`${r.customerId}-${r.breadTypeId}`}
                      className="border-t border-bakery-wheat/60"
                    >
                      <td className="py-2 px-2 text-left text-bakery-choco">{r.customerName}</td>
                      <td className="py-2 px-2 text-left text-bakery-choco">
                        {r.customerDeliveryCount}
                      </td>
                      <td className="py-2 px-2 text-left text-bakery-choco">{r.breadTypeName}</td>
                      <td className="py-2 px-2 text-left text-bakery-choco font-medium">
                        {r.totalQuantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
