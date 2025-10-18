import { useEffect, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { useCustomerDataController } from '../data/useCustomerDataController'

export default function Planner() {
  const [selectedDay, setDaySelected] = useState(new Date())
  const { getPlanByDate, tiers, saveDelivery } = useCustomerDataController()
  const [selectedTier, setSelectedTier] = useState('0') // '0' means all
  const [results, setResults] = useState([]) // Add results state
  const [deliveredRows, setDeliveredRows] = useState(() => new Set())
  const [deliveredPlanIds, setDeliveredPlanIds] = useState(() => [])
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const formattedDate = useMemo(
    () =>
      selectedDay
        ? selectedDay.toLocaleDateString('it-IT', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : '-',
    [selectedDay]
  )

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

  // Keep delivered selections in sync with current results list
  useEffect(() => {
    const validIds = new Set(results.map((r) => String(r.planId)))
    setDeliveredRows((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(String(id))))
      return next
    })
    setDeliveredPlanIds((prev) => prev.filter((id) => validIds.has(id)))
  }, [results])

  // Toggle delivered state for a given row id
  const toggleDelivered = (planId) => {
    setDeliveredRows((prev) => {
      const next = new Set(prev)
      if (next.has(planId)) next.delete(planId)
      else next.add(planId)
      return next
    })

    // Also keep an ordered array of dark (delivered) planIds
    setDeliveredPlanIds((prev) => {
      const id = String(planId)
      const exists = prev.includes(id)
      if (exists) {
        return prev.filter((p) => p !== id)
      }
      return [...prev, id]
    })
  }

  // Handle delivery click from button (uses data-* attributes)
  /**
   * @param {React.MouseEvent<HTMLButtonElement>} e
   */
  const handleDeliveryClick = (e) => {
    const btn = e.currentTarget
    const planId = String(btn.dataset.planId)

    toggleDelivered(planId)
  }

  // Save button handler: persist selected deliveries into the delivery table
  const handleSaveDeliveries = async () => {
    if (deliveredPlanIds.length === 0) return
    setSaving(true)
    setSaveMsg('')
    try {
      // Build items from results filtered by selected ids
      const selectedSet = new Set(deliveredPlanIds.map(String))
      const items = results
        .filter((r) => selectedSet.has(String(r.planId)))
        .map((r) => ({
          planId: r.planId,
          quantity: r.quantity,
          customerId: r.customerId,
          breadTypeId: r.breadTypeId,
        }))
      const res = await saveDelivery({ items })
      setSaveMsg(`Salvate ${res.saved} consegne`)
      // Optional: clear local selection after save
      setDeliveredRows(new Set())
      setDeliveredPlanIds([])
    } catch (err) {
      console.error(err)
      setSaveMsg(err?.message || 'Errore durante il salvataggio delle consegne')
    } finally {
      setSaving(false)
    }
  }

  // Aggregate results by breadTypeName
  const summaryRows = useMemo(() => {
    const map = new Map()
    for (const r of results) {
      const key = r.breadTypeName || '—'
      const qty = Number(r.quantity) || 0
      map.set(key, (map.get(key) || 0) + qty)
    }
    const arr = Array.from(map.entries()).map(([breadTypeName, totalQuantity]) => ({
      breadTypeName,
      totalQuantity,
    }))
    arr.sort((a, b) =>
      a.breadTypeName.localeCompare(b.breadTypeName, 'it', { sensitivity: 'base' })
    )
    return arr
  }, [results])

  const totalPieces = useMemo(
    () => summaryRows.reduce((acc, r) => acc + r.totalQuantity, 0),
    [summaryRows]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold text-bakery-brown">Calendario</h1>
        <p className="text-bakery-choco/80">
          Seleziona una data e un giro per visualizzare le consegne.
        </p>
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
              <label htmlFor="tierSelect" className="block text-bakery-choco font-medium mb-2">
                Giorno selezionato
              </label>
              <p className="text-bakery-choco/90">{formattedDate}</p>
            </div>

            <div className="min-w-[220px]">
              <label htmlFor="tierSelect" className="block text-bakery-choco font-medium mb-2">
                Giro
              </label>
              <select
                id="tierSelect"
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full rounded-md border border-bakery-dough bg-white px-3 py-2 text-bakery-choco focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
              >
                <option key="all" value="0">
                  Tutti
                </option>
                {Array.isArray(tiers) &&
                  tiers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
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
                <svg
                  className="chevron h-4 w-4 text-bakery-choco/70"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xl font-semibold text-bakery-brown">Riepilogo per pane</span>
                <span className="text-bakery-choco/60 text-xs">(clicca per aprire/chiudere)</span>
              </span>
              <span className="text-bakery-choco/80 text-sm">
                {summaryRows.length} tipi • {totalPieces} pezzi
              </span>
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
                        <td className="py-2 px-2 text-left text-bakery-choco ">
                          {row.breadTypeName}
                        </td>
                        <td className="py-2 px-2 text-left text-bakery-choco font-medium">
                          {row.totalQuantity}
                        </td>
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
          <h2 className="text-xl font-semibold text-bakery-brown mb-1">Consegne</h2>
          {results.length === 0 ? (
            <div className="text-bakery-choco/80">Nessuna consegna per la selezione corrente.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <colgroup>
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '40%' }} />
                  <col style={{ width: '5%' }} />
                </colgroup>
                <thead>
                  <tr className="text-bakery-choco/70">
                    <th className="text-left py-2 px-2">Giro</th>
                    <th className="text-left py-2 px-2">Cliente</th>
                    <th className="text-left py-2 px-2">Quantità</th>
                    <th className="text-left py-2 px-2">Pane</th>
                    <th className="text-left py-2 px-2">Consegna</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    // Build a stable row id similar to the React key
                    <tr
                      key={r.planId}
                      className={`border-t border-bakery-wheat/60 ${deliveredRows.has(String(r.planId)) ? 'bg-bakery-wheat/50' : ''}`}
                    >
                      <td className="py-2 px-2 text-left">
                        <span className="inline-flex items-center rounded-full bg-bakery-wheat/50 text-bakery-brown px-2 py-0.5 text-xs font-medium">
                          {r.tier}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-left text-bakery-choco">{r.customerName}</td>
                      <td className="py-2 px-2 text-left text-bakery-choco font-medium">
                        {r.quantity}
                      </td>
                      <td className="py-2 px-2 text-left text-bakery-choco">{r.breadTypeName}</td>
                      <td className="py-2 px-2 text-left">
                        <button
                          type="button"
                          className="text-lg leading-none hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-bakery-accent/40 rounded"
                          aria-label={`Segna consegna per ${r.customerName}`}
                          data-plan-id={r.planId}
                          onClick={handleDeliveryClick}
                        >
                          ✅
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Store delivers */}
        <section className="lg:col-span-12 bg-white rounded-xl border border-bakery-wheat p-5">
          <h2 className="text-lg font-medium text-bakery-choco mb-3">Piani consegna effettuati</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-bakery-choco/90">
              {deliveredPlanIds.length === 0
                ? 'Nessuna consegna segnata come effettuata.'
                : `Consegne segnate come effettuate: ${deliveredPlanIds.length}`}
            </div>
            <div className="flex items-center gap-3">
              {saveMsg && <span className="text-sm text-bakery-choco/80">{saveMsg}</span>}
              <button
                type="button"
                onClick={handleSaveDeliveries}
                disabled={saving || deliveredPlanIds.length === 0}
                className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-bakery-accent/30 disabled:opacity-40 disabled:cursor-not-allowed ${deliveredPlanIds.length > 0
                    ? 'bg-bakery-accent text-white hover:opacity-90'
                    : 'bg-bakery-wheat text-bakery-choco'
                  }`}
                aria-disabled={saving || deliveredPlanIds.length === 0}
              >
                {saving ? 'Salvataggio…' : 'Salva consegne'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
