import { useEffect, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { useCustomerDataController } from '../data/useCustomerDataController'

export default function Planner () {
  const [selectedDay, setDaySelected] = useState(new Date())
  const { getPlanByDate, tiers } = useCustomerDataController()
  const [selectedTier, setSelectedTier] = useState('0') // '0' means all
  const [results, setResults] = useState([]) // Add results state

  const formattedDate = useMemo(() => (
    selectedDay
      ? selectedDay.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
      : ''
  ), [selectedDay])

  // Compare by: tier (string) -> customerName -> breadTypeName -> quantity
  /**
   * Compare two PlanDelivery objects for sorting.
   * Sort by: tier (string, locale-aware) -> customerName -> breadTypeName -> quantity (number)
   * @param {import('../data/useCustomerDataController').PlanDelivery} a
   * @param {import('../data/useCustomerDataController').PlanDelivery} b
   */
  const comparePlans = (a, b) => {
    // tier (locale-aware string)
    const aTierStr = a.tier.toString()
    const bTierStr = b.tier.toString()
    const cmpTier = aTierStr.localeCompare(bTierStr, 'it', { numeric: true, sensitivity: 'base' })
    if (cmpTier !== 0) return cmpTier

    // customerName
    const aCust = a.customerName
    const bCust = b.customerName
    const cmpCust = aCust.localeCompare(bCust, 'it', { sensitivity: 'base' })
    if (cmpCust !== 0) return cmpCust

    // breadTypeName
    const aBread = a.breadTypeName
    const bBread = b.breadTypeName
    const cmpBread = aBread.localeCompare(bBread, 'it', { sensitivity: 'base' })
    if (cmpBread !== 0) return cmpBread

    // quantity (numeric)
    const aQty = Number(a.quantity)
    const bQty = Number(b.quantity)
    return aQty - bQty
  }

  // Call when date or tier changes
  useEffect(() => {
    if (!selectedDay) return
    getPlanByDate(selectedDay, selectedTier)
      .then((planData) => {
        const sorted = planData.sort(comparePlans)
        setResults(sorted)
      })
      .catch(console.error)
  }, [selectedDay, selectedTier, getPlanByDate])

  // Aggregate results by breadTypeName
  const summaryRows = useMemo(() => {
    const map = new Map()
    for (const r of results) {
      const key = r.breadTypeName || '—'
      const qty = Number(r.quantity) || 0
      map.set(key, (map.get(key) || 0) + qty)
    }
    const arr = Array.from(map.entries()).map(([breadTypeName, totalQuantity]) => ({ breadTypeName, totalQuantity }))
    arr.sort((a, b) => a.breadTypeName.localeCompare(b.breadTypeName, 'it', { sensitivity: 'base' }))
    return arr
  }, [results])

  const totalPieces = useMemo(() => summaryRows.reduce((acc, r) => acc + r.totalQuantity, 0), [summaryRows])

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold text-bakery-brown">Calendario</h1>
        <p className="text-bakery-choco/80">Seleziona una data e un giro per visualizzare le consegne.</p>
        {selectedDay && (
          <p className="text-bakery-choco/90"><span className="font-semibold">Giorno selezionato:</span> {formattedDate}</p>
        )}
      </header>

      {/* Local styles for the rotating chevron in the summary */}
      <style>{`
        details > summary .chevron { transition: transform 0.2s ease; }
        details[open] > summary .chevron { transform: rotate(90deg); }
      `}</style>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Calendar card */}
        <section className="lg:col-span-5 bg-white rounded-xl border border-bakery-wheat p-3 md:p-4">
          <h2 className="text-lg font-medium text-bakery-choco mb-2">Seleziona giorno</h2>
          <div className="rounded-lg border border-bakery-choco/20 p-2 inline-block bg-white">
            <DayPicker
              mode="single"
              selected={selectedDay}
              onSelect={setDaySelected}
              showOutsideDays
              weekStartsOn={1}
            />
          </div>
        </section>

        {/* Filters card */}
        <section className="lg:col-span-7 bg-white rounded-xl border border-bakery-wheat p-4 md:p-5">
          <h2 className="text-lg font-medium text-bakery-choco mb-3">Filtri</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="min-w-[220px]">
              <label htmlFor="tierSelect" className="block text-bakery-choco font-medium mb-2">Giro</label>
              <select
                id="tierSelect"
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full rounded-md border border-bakery-dough bg-white px-3 py-2 text-bakery-choco focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
              >
                <option key='all' value="0">Tutti</option>
                {Array.isArray(tiers) && tiers.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Summary card - full width below calendar and filters */}
        <section className="lg:col-span-12 bg-white rounded-xl border border-bakery-wheat p-5">
          <details>
            <summary className="flex items-center justify-between cursor-pointer select-none">
              <span className="inline-flex items-center gap-2">
                <svg className="chevron h-4 w-4 text-bakery-choco/70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xl font-semibold text-bakery-brown">Riepilogo per pane</span>
                <span className="text-bakery-choco/60 text-xs">(clicca per aprire/chiudere)</span>
              </span>
              <span className="text-bakery-choco/80 text-sm">{summaryRows.length} tipi • {totalPieces} pezzi</span>
            </summary>
            <div className="mt-3 overflow-x-auto">
              {summaryRows.length === 0 ? (
                <div className="text-bakery-choco/80">Nessun dato per il riepilogo.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-bakery-choco/70">
                      <th className="text-left py-2 px-2">Pane</th>
                      <th className="text-left py-2 px-2">Quantità totale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row) => (
                      <tr key={row.breadTypeName} className="border-t border-bakery-wheat/60">
                        <td className="py-2 px-2 text-left text-bakery-choco ">{row.breadTypeName}</td>
                        <td className="py-2 px-2 text-left text-bakery-choco font-medium">{row.totalQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </details>
        </section>

        {/* Results card - full width below calendar, filters and summary */}
        <section className="lg:col-span-12 bg-bakery-cream rounded-xl border border-bakery-wheat p-5">
          <h2 className="text-xl font-semibold text-bakery-brown mb-3">Consegne</h2>
          {results.length === 0 ? (
            <div className="text-bakery-choco/80">Nessuna consegna per la selezione corrente.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-bakery-choco/70">
                    <th className="text-left py-2 px-2">Giro</th>
                    <th className="text-left py-2 px-2">Cliente</th>
                    <th className="text-left py-2 px-2">Quantità</th>
                    <th className="text-left py-2 px-2">Pane</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={`${r.customerId}-${r.breadTypeId}-${r.deliveryDate || idx}`} className="border-t border-bakery-wheat/60">
                      <td className="py-2 px-2 text-left">
                        <span className="inline-flex items-center rounded-full bg-bakery-wheat/50 text-bakery-brown px-2 py-0.5 text-xs font-medium">{r.tier}</span>
                      </td>
                      <td className="py-2 px-2 text-left text-bakery-choco">{r.customerName}</td>
                      <td className="py-2 px-2 text-left text-bakery-choco">{r.breadTypeName}</td>
                      <td className="py-2 px-2 text-left text-bakery-choco font-medium">{r.quantity}</td>
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
