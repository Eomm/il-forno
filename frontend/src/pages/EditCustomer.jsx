import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomerDataController } from '../data/useCustomerDataController'
import { CustomerPlanTable } from '../components/CustomerPlanTable'

export default function EditCustomer() {
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
  const [rows, setRows] = useState([newEmptyRow(customerId)])
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
        const mapped = data.plan.map((r) => ({
          id: nid++,
          breadTypeId: r.breadTypeId,
          breadType: r.breadTypeName || '',
          quantity: r.quantity,
          days: r.days,
        }))
        setRows(mapped.length ? mapped : [newEmptyRow(1)])
        setNextId(mapped.length ? mapped.length + 1 : 2)
        setCustomer({
          name: data.customer.name,
          address: data.customer.address || '',
          tier: data.customer.tier,
        })
      } catch (e) {
        if (!cancelled) setError(e.message || 'Errore di caricamento')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (Number.isFinite(customerId)) loader()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  const isAnyRowMissingDays = useMemo(
    () => rows.some((r) => !Object.values(r.days).some(Boolean)),
    [rows]
  )

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, newEmptyRow(nextId)])
    setNextId((n) => n + 1)
  }, [nextId])

  const removeRow = useCallback((rowId) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId))
  }, [])

  const updateRowField = useCallback((rowId, field, value) => {
    console.log({ rowId, field, value })
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)))
  }, [])

  const updateRowDay = useCallback((rowId, dayKey, checked) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, days: { ...r.days, [dayKey]: checked } } : r))
    )
  }, [])

  // Table adapters (Edit page: allow any input, final validation occurs on submit)
  const onChangeBreadType = useCallback(
    (rowId, value) => {
      updateRowField(rowId, 'breadType', value)
    },
    [updateRowField]
  )
  const onBlurBreadType = useCallback(
    (rowId, value) => {
      const v = value.trim()
      if (!v) return
      const exact = breadTypes.find((t) => t.toLowerCase() === v.toLowerCase())
      if (exact) updateRowField(rowId, 'breadType', exact)
    },
    [breadTypes, updateRowField]
  )
  const onChangeQuantity = useCallback(
    (rowId, value) => {
      updateRowField(rowId, 'quantity', Number(value))
    },
    [updateRowField]
  )
  const onToggleDay = useCallback(
    (rowId, dayKey, checked) => {
      updateRowDay(rowId, dayKey, checked)
    },
    [updateRowDay]
  )

  const onSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    const form = formRef.current
    if (form && !form.checkValidity()) {
      form.reportValidity()
      return
    }
    // Validate that each breadType matches one of the available breadTypes (case-insensitive)
    const invalidRow = rows.find(
      (r) =>
        r.breadType.trim() &&
        !breadTypes.some((t) => t.toLowerCase() === r.breadType.trim().toLowerCase())
    )
    if (invalidRow) {
      alert('Seleziona un tipo di pane valido per ogni riga. (Riga #' + invalidRow.id + ')')
      return
    }
    // Canonicalize breadType casing before sending (match the original list value)
    const normalizedRows = rows.map((r) => {
      const match = breadTypes.find((t) => t.toLowerCase() === r.breadType.trim().toLowerCase())
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
      // Instead of navigating to the homepage, reload the current page as requested
      window.location.reload()
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
        <p className="text-bakery-choco/80">
          Aggiorna i dati del cliente e il piano di consegna predefinito.
        </p>
      </header>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <section className="bg-bakery-cream rounded-lg p-5 md:p-6 border border-bakery-wheat">
          <p className="text-sm text-bakery-choco/80 mb-4">Il nome non può essere modificato.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-bakery-choco">
                Nome
              </label>
              <input
                id="name"
                name="name"
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
                onChange={(e) => setCustomer((c) => ({ ...c, tier: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-bakery-dough bg-white px-4 py-3 text-lg text-bakery-choco focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
              >
                <option value="" disabled>
                  Seleziona un giro…
                </option>
                {tiers.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="address" className="block text-lg font-medium text-bakery-choco">
                Indirizzo
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={customer.address}
                onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
                placeholder="Via Roma 1, Milano"
                className="mt-2 w-full rounded-lg border border-bakery-dough bg-white px-4 py-3 text-lg text-bakery-choco placeholder:text-bakery-choco/50 focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
              />
            </div>
          </div>
        </section>
        <CustomerPlanTable
          rows={rows}
          breadTypes={breadTypes}
          datalistId="bread-types-edit"
          onAddRow={addRow}
          onRemoveRow={removeRow}
          onChangeBreadType={onChangeBreadType}
          onBlurBreadType={onBlurBreadType}
          onChangeQuantity={onChangeQuantity}
          onToggleDay={onToggleDay}
          showMissingDaysWarning={isAnyRowMissingDays}
        />
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
