import { useMemo, useRef, useState, useCallback } from 'react'
import { useCustomerDataController } from '../data/useCustomerDataController'

// Constants outside component to avoid re-creation
const DAYS = [
  { key: 'mon', label: 'Lun' },
  { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mer' },
  { key: 'thu', label: 'Gio' },
  { key: 'fri', label: 'Ven' },
  { key: 'sat', label: 'Sab' },
  { key: 'sun', label: 'Dom' },
]

const newEmptyRow = (id) => ({
  id,
  breadType: '',
  quantity: 1,
  days: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
})

const DATALIST_BREAD_TYPES_ID = 'bread-types'

export default function AddCustomer () {

  const [rows, setRows] = useState([newEmptyRow(1)])
  // Aggiunta del campo obbligatorio "tier" nello stato del cliente
  const [customer, setCustomer] = useState({ name: '', address: '', tier: '' })
  const formRef = useRef(null)
  const [nextId, setNextId] = useState(2)

  // Usa il data controller per accedere ai dati e alla submit
  const { breadTypes, tiers, submitCustomer } = useCustomerDataController()

  // Ogni riga deve avere almeno un giorno selezionato
  const isAnyRowMissingDays = useMemo(() => rows.some((r) => !Object.values(r.days).some(Boolean)), [rows])

  const addRow = useCallback(() => {
    setRows(prev => [...prev, newEmptyRow(nextId)])
    setNextId(n => n + 1)
  }, [nextId])

  // Remove row
  const removeRow = useCallback((rowId) => {
    setRows(prev => prev.filter(r => r.id !== rowId))
  }, [])

  const updateRowField = useCallback((rowId, field, value) => {
    setRows(prev => prev.map(r => (r.id === rowId ? { ...r, [field]: value } : r)))
  }, [])

  const updateRowDay = useCallback((rowId, dayKey, checked) => {
    setRows(prev => prev.map(r => (r.id === rowId ? { ...r, days: { ...r.days, [dayKey]: checked } } : r)))
  }, [])

  // Customer field handlers
  const handleCustomerNameChange = useCallback((e) => {
    const value = e.target.value
    setCustomer(c => ({ ...c, name: value }))
  }, [])

  const handleCustomerTierChange = useCallback((e) => {
    const value = e.target.value
    setCustomer(c => ({ ...c, tier: value }))
  }, [])

  const handleCustomerAddressChange = useCallback((e) => {
    const value = e.target.value
    setCustomer(c => ({ ...c, address: value }))
  }, [])

  // Row handlers
  const handleBreadTypeChange = useCallback((rowId) => (e) => {
    const v = e.target.value
    const q = v.toLowerCase().trim()
    const isPrefix = breadTypes.some(t => t.toLowerCase().startsWith(q))
    if (v === '' || isPrefix) {
      updateRowField(rowId, 'breadType', v)
    }
  }, [breadTypes, updateRowField])

  const handleBreadTypeBlur = useCallback((rowId) => (e) => {
    const v = e.target.value.trim()
    if (!v) return
    const exact = breadTypes.find(t => t.toLowerCase() === v.toLowerCase())
    if (exact) {
      updateRowField(rowId, 'breadType', exact)
    } else {
      const suggestion = breadTypes.find(t => t.toLowerCase().startsWith(v.toLowerCase()))
      updateRowField(rowId, 'breadType', suggestion || '')
    }
  }, [breadTypes, updateRowField])

  const handleQuantityChange = useCallback((rowId) => (e) => {
    updateRowField(rowId, 'quantity', Number(e.target.value))
  }, [updateRowField])

  const handleDayChange = useCallback((rowId, dayKey) => (e) => {
    updateRowDay(rowId, dayKey, e.target.checked)
  }, [updateRowDay])

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
        <h1 className="text-3xl md:text-4xl font-bold text-bakery-brown">Nuovo cliente</h1>
        <p className="text-bakery-choco/80">Compila i dati del cliente e il piano di consegna predefinito.</p>
      </header>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        {/* Dati cliente */}
        <section className="bg-bakery-cream rounded-lg p-5 md:p-6 border border-bakery-wheat">
          <p className="text-sm text-bakery-choco/80 mb-4">Tutti i campi contrassegnati con <span className="text-bakery-berry font-semibold">*</span> sono obbligatori.</p>
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
                <option value="" disabled>Seleziona un giro…</option>
                {tiers.map((t) => (
                  <option key={t} value={t}>{t}</option>
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

        {/* Piano di consegna */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-bakery-brown">Piano di consegna predefinito</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-bakery-wheat rounded-lg overflow-hidden text-base">
              <caption className="sr-only">Tabella per definire tipo di pane, quantità e giorni di consegna</caption>
              <thead className="bg-bakery-wheat/60">
                <tr className="text-bakery-choco">
                  <th scope="col" className="px-3 py-3 text-left font-semibold">Tipo di pane <span className="text-bakery-berry">*</span></th>
                  <th scope="col" className="px-3 py-3 text-left font-semibold">Quantità <span className="text-bakery-berry">*</span></th>
                  {DAYS.map((g) => (
                    <th key={g.key} scope="col" className="px-2 py-3 text-center font-semibold">
                      {g.label}
                    </th>
                  ))}
                  <th scope="col" className="px-2 py-3 text-center font-semibold"><span className="sr-only">Azioni</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-bakery-cream/60'}>
                    <td className="px-3 py-2 align-middle">
                      <label htmlFor={`breadType-${row.id}`} className="sr-only">Tipo di pane</label>
                      {/* Autocompletamento con datalist per gestire anche centinaia di tipi */}
                      <input
                        id={`breadType-${row.id}`}
                        name={`breadType-${row.id}`}
                        type="text"
                        required
                        value={row.breadType}
                        onChange={handleBreadTypeChange(row.id)}
                        onBlur={handleBreadTypeBlur(row.id)}
                        placeholder="Seleziona tipo di pane"
                        list={DATALIST_BREAD_TYPES_ID}
                        autoComplete="off"
                        className="w-full rounded-lg border border-bakery-dough bg-white px-3 py-2 text-lg text-bakery-choco focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <label htmlFor={`quantity-${row.id}`} className="sr-only">Quantità</label>
                      <input
                        id={`quantity-${row.id}`}
                        name={`quantity-${row.id}`}
                        type="number"
                        min={1}
                        max={99}
                        required
                        value={row.quantity}
                        onChange={handleQuantityChange(row.id)}
                        className="w-28 rounded-lg border border-bakery-dough bg-white px-3 py-2 text-lg text-bakery-choco focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
                      />
                    </td>
                    {DAYS.map((g) => (
                      <td key={`${row.id}-${g.key}`} className="px-2 py-2 text-center align-middle">
                        <div className="flex items-center justify-center">
                          <input
                            id={`day-${g.key}-${row.id}`}
                            name={`day-${g.key}-${row.id}`}
                            type="checkbox"
                            checked={row.days[g.key]}
                            onChange={handleDayChange(row.id, g.key)}
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

          {/* Datalist condiviso per i tipi di pane */}
          <datalist id={DATALIST_BREAD_TYPES_ID}>
            {breadTypes.map((t) => (
              <option key={t} value={t} />
            ))}
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
