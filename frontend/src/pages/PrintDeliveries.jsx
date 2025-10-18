import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useCustomerDataController } from '../data/useCustomerDataController'
import { comparePlans } from '../utils/comparePlans'

export default function PrintDeliveries() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const dateParam = params.get('date') // expected: YYYY-MM-DD
  const tierParam = params.get('tier') || '0'
  const idsParam = params.get('ids') || ''

  const ids = useMemo(
    () =>
      idsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [idsParam]
  )

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { getPlanByDate } = useCustomerDataController()

  // Date parsing
  const date = useMemo(() => {
    if (!dateParam) return null
    const [y, m, d] = dateParam.split('-').map((v) => parseInt(v, 10))
    if (!y || !m || !d) return null
    return new Date(Date.UTC(y, m - 1, d))
  }, [dateParam])

  // Sorting is handled by shared utils/comparePlans

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!date) {
        setError('Data non valida')
        setLoading(false)
        return
      }
      if (ids.length === 0) {
        setRows([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const all = await getPlanByDate(date, tierParam)
        if (cancelled) return
        const idSet = new Set(ids.map(String))
        const sel = all.filter((r) => idSet.has(String(r.planId)))
        sel.sort(comparePlans)
        setRows(sel)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Errore durante il caricamento')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [date, tierParam, ids, getPlanByDate])

  const formattedDate = useMemo(() => {
    return date
      ? new Date(date).toLocaleDateString('it-IT', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '-'
  }, [date])

  return (
    <div className="text-left">
      {/* Print overrides to hide app layout and polish table for printing */}
      <style>{`
        @page { size: A4; margin: 16mm; }
        @media print {
          /* Hide application chrome */
          h1 { display: none !important; }
          header.sticky.top-0 { display: none !important; }
          .max-w-screen-lg.mx-auto.px-6 > main { border: 0 !important; box-shadow: none !important; padding: 0 !important; }
          /* Avoid breaking table rows */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bakery-brown">Consegne</h1>
          <div className="text-sm text-bakery-choco/80">
            {formattedDate} • Giro: {tierParam === '0' ? 'Tutti' : tierParam}
          </div>
        </div>
        <div className="print:hidden flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium shadow-sm bg-bakery-brown text-white hover:opacity-90"
          >
            Stampa
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium shadow-sm border border-bakery-dough bg-white hover:bg-bakery-cream"
          >
            Chiudi
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-bakery-choco/80">Caricamento…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : rows.length === 0 ? (
        <div className="text-bakery-choco/80">Nessuna consegna selezionata.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-bakery-choco/70">
                <th className="text-left py-2 px-2">Cliente</th>
                <th className="text-left py-2 px-2">Pane</th>
                <th className="text-left py-2 px-2">Quantità</th>
                <th className="text-left py-2 px-2">Giro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.planId} className="border-t border-bakery-wheat/60">
                  <td className="py-2 px-2 text-left text-bakery-choco">{r.customerName}</td>
                  <td className="py-2 px-2 text-left text-bakery-choco">{r.breadTypeName}</td>
                  <td className="py-2 px-2 text-left text-bakery-choco font-medium">
                    {r.quantity}
                  </td>
                  <td className="py-2 px-2 text-left text-bakery-choco">{r.tier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
