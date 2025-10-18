import { useMemo, useRef, useState, useCallback } from 'react'
import { useCustomerDataController } from '../data/useCustomerDataController'
import { CustomerPlanTable } from '../components/CustomerPlanTable'

const newEmptyRow = (id) => ({
  id,
  breadType: '',
  quantity: 1,
  days: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
})

const DATALIST_BREAD_TYPES_ID = 'bread-types'

export default function AddCustomer() {
  const [rows, setRows] = useState([newEmptyRow(1)])
  // Aggiunta del campo obbligatorio "tier" nello stato del cliente
  const [customer, setCustomer] = useState({ name: '', address: '', tier: '' })
  const formRef = useRef(null)
  const [nextId, setNextId] = useState(2)

  // Usa il data controller per accedere ai dati e alla submit
  const { breadTypes, tiers, submitCustomer } = useCustomerDataController()

  // Ogni riga deve avere almeno un giorno selezionato
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
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)))
  }, [])

  const updateRowDay = useCallback((rowId, dayKey, checked) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, days: { ...r.days, [dayKey]: checked } } : r))
    )
  }, [])

  // Customer field handlers
  const handleCustomerNameChange = useCallback((e) => {
    setCustomer((c) => ({ ...c, name: e.target.value }))
  }, [])
  const handleCustomerTierChange = useCallback((e) => {
    setCustomer((c) => ({ ...c, tier: e.target.value }))
  }, [])
  const handleCustomerAddressChange = useCallback((e) => {
    setCustomer((c) => ({ ...c, address: e.target.value }))
  }, [])

  // Row handlers and normalization (same logic as earlier inline version)
  const handleBreadTypeChange = useCallback(
    (rowId) => (e) => {
      const v = e.target.value
      const q = v.toLowerCase().trim()
      const isPrefix = breadTypes.some((t) => t.toLowerCase().startsWith(q))
      if (v === '' || isPrefix) {
        updateRowField(rowId, 'breadType', v)
      }
    },
    [breadTypes, updateRowField]
  )

  const handleBreadTypeBlur = useCallback(
    (rowId) => (e) => {
      const v = e.target.value.trim()
      if (!v) return
      const exact = breadTypes.find((t) => t.toLowerCase() === v.toLowerCase())
      if (exact) {
        updateRowField(rowId, 'breadType', exact)
      } else {
        const suggestion = breadTypes.find((t) => t.toLowerCase().startsWith(v.toLowerCase()))
        updateRowField(rowId, 'breadType', suggestion || '')
      }
    },
    [breadTypes, updateRowField]
  )

  const handleQuantityChange = useCallback(
    (rowId) => (e) => {
      updateRowField(rowId, 'quantity', Number(e.target.value))
    },
    [updateRowField]
  )

  const handleDayChange = useCallback(
    (rowId, dayKey) => (e) => {
      updateRowDay(rowId, dayKey, e.target.checked)
    },
    [updateRowDay]
  )

  // Adapter callbacks for table (convert primitive to synthetic event expected by existing handlers)
  const onChangeBreadType = useCallback(
    (rowId, value) => {
      handleBreadTypeChange(rowId)({ target: { value } })
    },
    [handleBreadTypeChange]
  )
  const onBlurBreadType = useCallback(
    (rowId, value) => {
      handleBreadTypeBlur(rowId)({ target: { value } })
    },
    [handleBreadTypeBlur]
  )
  const onChangeQuantity = useCallback(
    (rowId, value) => {
      handleQuantityChange(rowId)({ target: { value } })
    },
    [handleQuantityChange]
  )
  const onToggleDay = useCallback(
    (rowId, dayKey, checked) => {
      handleDayChange(rowId, dayKey)({ target: { checked } })
    },
    [handleDayChange]
  )

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = formRef.current
    if (form && !form.checkValidity()) {
      form.reportValidity()
      return
    }
    try {
      await submitCustomer({ customer, rows })
      alert('Cliente creato!')
    } catch (err) {
      alert(err.message || 'Errore durante il salvataggio')
    }
  }
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-3xl md:text-4xl font-bold text-bakery-brown">Nuovo cliente</h2>
        <p className="text-bakery-choco/80">
          Compila i dati del cliente e il piano di consegna predefinito.
        </p>
      </header>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        {/* Dati cliente */}
        <section className="bg-bakery-cream rounded-lg p-5 md:p-6 border border-bakery-wheat">
          <p className="text-sm text-bakery-choco/80 mb-4">
            Tutti i campi contrassegnati con{' '}
            <span className="text-bakery-berry font-semibold">*</span> sono obbligatori.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-bakery-choco">
                Nome <span className="text-bakery-berry">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={customer.name}
                onChange={handleCustomerNameChange}
                placeholder="Mario Rossi"
                className="mt-2 w-full rounded-lg border border-bakery-dough bg-white px-4 py-3 text-lg text-bakery-choco placeholder:text-bakery-choco/50 focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
              />
            </div>
            {/* Campo Tier obbligatorio */}
            <div>
              <label htmlFor="tier" className="block text-lg font-medium text-bakery-choco">
                Giro <span className="text-bakery-berry">*</span>
              </label>
              <select
                id="tier"
                name="tier"
                required
                value={customer.tier}
                onChange={handleCustomerTierChange}
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
                onChange={handleCustomerAddressChange}
                placeholder="Via Roma 1, Milano"
                className="mt-2 w-full rounded-lg border border-bakery-dough bg-white px-4 py-3 text-lg text-bakery-choco placeholder:text-bakery-choco/50 focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
              />
            </div>
          </div>
        </section>

        <CustomerPlanTable
          rows={rows}
          breadTypes={breadTypes}
          datalistId={DATALIST_BREAD_TYPES_ID}
          onAddRow={addRow}
          onRemoveRow={removeRow}
          onChangeBreadType={onChangeBreadType}
          onBlurBreadType={onBlurBreadType}
          onChangeQuantity={onChangeQuantity}
          onToggleDay={onToggleDay}
          showMissingDaysWarning={isAnyRowMissingDays}
        />

        <div className="pt-2">
          <button
            type="submit"
            disabled={isAnyRowMissingDays}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-bakery-brown px-6 py-4 text-xl font-bold text-white hover:bg-bakery-choco focus:outline-none focus:ring-4 focus:ring-bakery-accent/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crea
          </button>
        </div>
      </form>
    </div>
  )
}
