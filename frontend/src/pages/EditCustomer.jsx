import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomerDataController } from '../data/useCustomerDataController'

const DAYS = [
  { key: 'mon', label: 'Lun' },
  { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mer' },
  { key: 'thu', label: 'Gio' },
  { key: 'fri', label: 'Ven' },
  { key: 'sat', label: 'Sab' },
  { key: 'sun', label: 'Dom' },
]

export default function EditCustomer () {
  const { id } = useParams()
  const navigate = useNavigate()
  const customerId = Number(id)
  const formRef = useRef(null)

  const { breadTypes, tiers, getCustomerWithPlan, updateCustomer } = useCustomerDataController()

  const newEmptyRow = (id) => ({
    id,
    breadType: '',
    breadTypeId: null,
    quantity: 1,
    days: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
  })

  const [customer, setCustomer] = useState({ name: '', address: '', tier: '' })
  const [rows, setRows] = useState([newEmptyRow(1)])
  const [nextId, setNextId] = useState(2)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Load customer + plan once per id. We intentionally avoid adding controller functions to deps to prevent re-runs.
  useEffect(() => {
    let cancelled = false
    const loader = async () => {
      setLoading(true)
      try {
        const data = await getCustomerWithPlan(customerId)
        if (!data) {
          if (!cancelled) setError('Cliente non trovato')
          return
        }
        if (cancelled) return
        let nid = 1
        const mapped = data.plan.map(r => ({
          id: nid++,
          breadTypeId: r.breadTypeId,
          breadType: r.breadTypeName || '',
          quantity: r.quantity,
          days: r.days,
        }))
        setRows(mapped.length ? mapped : [newEmptyRow(1)])
        setNextId(mapped.length ? mapped.length + 1 : 2)
        setCustomer({ name: data.customer.name, address: data.customer.address || '', tier: data.customer.tier })
      } catch (e) {
        if (!cancelled) setError(e.message || 'Errore di caricamento')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (Number.isFinite(customerId)) loader()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  const isAnyRowMissingDays = useMemo(() => rows.some((r) => !Object.values(r.days).some(Boolean)), [rows])

  const addRow = () => {
    setRows(prev => [...prev, newEmptyRow(nextId)])
    setNextId(n => n + 1)
  }

  const removeRow = (rowId) => {
    setRows(prev => prev.filter(r => r.id !== rowId))
  }

  const updateRowField = (rowId, field, value) => {
    setRows(prev => prev.map(r => (r.id === rowId ? { ...r, [field]: value } : r)))
  }

  const updateRowDay = (rowId, dayKey, checked) => {
    setRows(prev => prev.map(r => (r.id === rowId ? { ...r, days: { ...r.days, [dayKey]: checked } } : r)))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    const form = formRef.current
    if (form && !form.checkValidity()) {
      form.reportValidity()
      return
    }
    // Validate that each breadType matches one of the available breadTypes (case-insensitive)
    const invalidRow = rows.find(r => r.breadType.trim() && !breadTypes.some(t => t.toLowerCase() === r.breadType.trim().toLowerCase()))
    if (invalidRow) {
      alert('Seleziona un tipo di pane valido per ogni riga. (Riga #' + invalidRow.id + ')')
      return
    }
    // Canonicalize breadType casing before sending (match the original list value)
    const normalizedRows = rows.map(r => {
      const match = breadTypes.find(t => t.toLowerCase() === r.breadType.trim().toLowerCase())
      return { ...r, breadType: match || r.breadType }
    })
    try {
      setSaving(true)
      await updateCustomer({
        id: customerId,
        customer: { tier: customer.tier, address: customer.address },
        rows: normalizedRows,
      })
      alert('Cliente aggiornato!')
      navigate('/')
    } catch (err) {
      alert(err.message || 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  if (!Number.isFinite(customerId)) {
    return <div className="text-bakery-berry">ID cliente non valido.</div>
  }

  if (loading) return <div>Caricamento cliente…</div>
  if (error) return <div className="text-bakery-berry">{error}</div>

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold text-bakery-brown">Modifica cliente</h1>
        <p className="text-bakery-choco/80">Aggiorna i dati del cliente e il piano di consegna predefinito.</p>
      </header>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <section className="bg-bakery-cream rounded-lg p-5 md:p-6 border border-bakery-wheat">
          <p className="text-sm text-bakery-choco/80 mb-4">Il nome non può essere modificato.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="nome" className="block text-lg font-medium text-bakery-choco">
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                disabled
                value={customer.name}
                className="mt-2 w-full rounded-lg border border-bakery-dough bg-bakery-wheat/40 px-4 py-3 text-lg text-bakery-choco"
              />
            </div>
            <div>
              <label htmlFor="tier" className="block text-lg font-medium text-bakery-choco">
                Giro <span className="text-bakery-berry">*</span>
              </label>
              <select
                id="tier"
                name="tier"
                required
                value={customer.tier}
                onChange={(e) => setCustomer(c => ({ ...c, tier: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-bakery-dough bg-white px-4 py-3 text-lg text-bakery-choco focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
              >
                <option value="" disabled>Seleziona un giro…</option>
                {tiers.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="indirizzo" className="block text-lg font-medium text-bakery-choco">
                Indirizzo
              </label>
              <input
                id="indirizzo"
                name="indirizzo"
                type="text"
                value={customer.address}
                onChange={(e) => setCustomer(c => ({ ...c, address: e.target.value }))}
                placeholder="Via Roma 1, Milano"
                className="mt-2 w-full rounded-lg border border-bakery-dough bg-white px-4 py-3 text-lg text-bakery-choco placeholder:text-bakery-choco/50 focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-bakery-brown">Piano di consegna predefinito</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-bakery-wheat rounded-lg overflow-hidden text-base">
              <thead className="bg-bakery-wheat/60">
                <tr className="text-bakery-choco">
                  <th className="px-3 py-3 text-left font-semibold">Tipo di pane <span className="text-bakery-berry">*</span></th>
                  <th className="px-3 py-3 text-left font-semibold">Quantità <span className="text-bakery-berry">*</span></th>
                  {DAYS.map(g => <th key={g.key} className="px-2 py-3 text-center font-semibold">{g.label}</th>)}
                  <th className="px-2 py-3 text-center font-semibold"><span className="sr-only">Azioni</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-bakery-cream/60'}>
                    <td className="px-3 py-2 align-middle">
                      <label htmlFor={`pane-${row.id}`} className="sr-only">Tipo di pane</label>
                      <input
                        id={`pane-${row.id}`}
                        name={`pane-${row.id}`}
                        type="text"
                        required
                        value={row.breadType}
                        onChange={(e) => updateRowField(row.id, 'breadType', e.target.value)}
                        onBlur={(e) => {
                          const v = e.target.value.trim()
                          if (!v) return
                          const exact = breadTypes.find(t => t.toLowerCase() === v.toLowerCase())
                          if (exact) updateRowField(row.id, 'breadType', exact)
                          // If not exact, we keep what the user typed; final validation will catch invalid entries
                        }}
                        placeholder="Seleziona tipo di pane"
                        list="tipi-pane"
                        autoComplete="off"
                        className="w-full rounded-lg border border-bakery-dough bg-white px-3 py-2 text-lg text-bakery-choco focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <label htmlFor={`qta-${row.id}`} className="sr-only">Quantità</label>
                      <input
                        id={`qta-${row.id}`}
                        name={`qta-${row.id}`}
                        type="number"
                        min={1}
                        max={99}
                        required
                        value={row.quantity}
                        onChange={(e) => updateRowField(row.id, 'quantity', Number(e.target.value))}
                        className="w-28 rounded-lg border border-bakery-dough bg-white px-3 py-2 text-lg text-bakery-choco focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
                      />
                    </td>
                    {DAYS.map(g => (
                      <td key={`${row.id}-${g.key}`} className="px-2 py-2 text-center align-middle">
                        <div className="flex items-center justify-center">
                          <input
                            id={`chk-${g.key}-${row.id}`}
                            name={`chk-${g.key}-${row.id}`}
                            type="checkbox"
                            checked={row.days[g.key]}
                            onChange={(e) => updateRowDay(row.id, g.key, e.target.checked)}
                            aria-label={`Consegna ${g.label} per questa riga`}
                            className="h-6 w-6 accent-bakery-accent focus:ring-4 focus:ring-bakery-accent/30"
                          />
                        </div>
                      </td>
                    ))}
                    <td className="px-2 py-2 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        aria-label="Rimuovi riga"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-bakery-dough bg-white text-bakery-berry hover:bg-bakery-wheat/50 focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
                        title="Rimuovi riga"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <datalist id="tipi-pane">
            {breadTypes.map(t => <option key={t} value={t} />)}
          </datalist>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center justify-center rounded-lg bg-bakery-pistachio px-4 py-3 text-lg font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-bakery-pistachio/40"
            >
              Aggiungi riga
            </button>
            {isAnyRowMissingDays && (
              <div role="status" className="flex-1 min-w-[280px] md:min-w-[480px] text-bakery-berry bg-bakery-wheat/60 border border-bakery-dough rounded-lg px-4 py-3 text-base">
                Seleziona almeno un giorno di consegna per ogni riga della tabella.
              </div>
            )}
          </div>
        </section>
        <div className="pt-2 flex gap-4 flex-wrap">
          <button
            type="submit"
            disabled={isAnyRowMissingDays || saving}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-bakery-brown px-6 py-4 text-xl font-bold text-white hover:bg-bakery-choco focus:outline-none focus:ring-4 focus:ring-bakery-accent/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvataggio…' : 'Salva modifiche'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-bakery-dough px-6 py-4 text-xl font-bold text-bakery-brown hover:bg-bakery-wheat focus:outline-none focus:ring-4 focus:ring-bakery-accent/40"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  )
}
