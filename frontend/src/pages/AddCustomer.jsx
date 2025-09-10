import { useMemo, useRef, useState } from 'react'
import { useCustomerDataController } from '../data/useCustomerDataController'

// Costanti fuori dal componente per evitare ricreazioni ad ogni render

const DAYS = [
  { key: 'mon', label: 'Lunedì' },
  { key: 'tue', label: 'Martedì' },
  { key: 'wed', label: 'Mercoledì' },
  { key: 'thu', label: 'Giovedì' },
  { key: 'fri', label: 'Venerdì' },
  { key: 'sat', label: 'Sabato' },
  { key: 'sun', label: 'Domenica' },
]

export default function AddCustomer () {
  const newEmptyRow = (id) => ({
    id,
    breadType: '',
    quantity: 1,
    days: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
  })

  const [rows, setRows] = useState([newEmptyRow(1)])
  // Aggiunta del campo obbligatorio "tier" nello stato del cliente
  const [customer, setCustomer] = useState({ name: '', address: '', tier: '' })
  const formRef = useRef(null)
  const [nextId, setNextId] = useState(2)

  // Usa il data controller per accedere ai dati e alla submit
  const { breadTypes, tiers, submitCustomer } = useCustomerDataController()

  // Ogni riga deve avere almeno un giorno selezionato
  const isAnyRowMissingDays = useMemo(() => rows.some((r) => !Object.values(r.days).some(Boolean)), [rows])

  const addRow = () => {
    setRows((prev) => [...prev, newEmptyRow(nextId)])
    setNextId((n) => n + 1)
  }

  // Rimuovi riga
  const removeRow = (rowId) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId))
  }

  const updateRowField = (rowId, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)))
  }

  const updateRowDay = (rowId, dayKey, checked) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, days: { ...r.days, [dayKey]: checked } } : r)))
  }

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
      <h1 className="text-3xl md:text-4xl font-bold text-bakery-brown">Nuovo cliente</h1>
      <p className="text-bakery-choco/90 text-lg">Compila i dati del cliente e il piano di consegna predefinito.</p>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        {/* Dati cliente */}
        <section className="bg-bakery-cream rounded-lg p-5 md:p-6 border border-bakery-wheat">
          <p className="text-sm text-bakery-choco/80 mb-4">Tutti i campi contrassegnati con <span className="text-bakery-berry font-semibold">*</span> sono obbligatori.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="nome" className="block text-lg font-medium text-bakery-choco">
                Nome <span className="text-bakery-berry">*</span>
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                required
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
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
                onChange={(e) => setCustomer((c) => ({ ...c, tier: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-bakery-dough bg-white px-4 py-3 text-lg text-bakery-choco focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
              >
                <option value="" disabled>Seleziona un giro…</option>
                {tiers.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
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
                onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
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
                      <label htmlFor={`pane-${row.id}`} className="sr-only">Tipo di pane</label>
                      {/* Autocompletamento con datalist per gestire anche centinaia di tipi */}
                      <input
                        id={`pane-${row.id}`}
                        name={`pane-${row.id}`}
                        type="text"
                        required
                        value={row.breadType}
                        onChange={(e) => {
                          const v = e.target.value
                          const q = v.toLowerCase().trim()
                          // Consenti solo valori che sono prefissi di un tipo valido o stringa vuota
                          const isPrefix = breadTypes.some((t) => t.toLowerCase().startsWith(q))
                          if (v === '' || isPrefix) {
                            updateRowField(row.id, 'breadType', v)
                          }
                        }}
                        onBlur={(e) => {
                          const v = e.target.value.trim()
                          if (!v) return
                          const exact = breadTypes.find((t) => t.toLowerCase() === v.toLowerCase())
                          if (exact) {
                            // Normalizza il casing al valore della lista
                            updateRowField(row.id, 'breadType', exact)
                          } else {
                            const suggestion = breadTypes.find((t) => t.toLowerCase().startsWith(v.toLowerCase()))
                            updateRowField(row.id, 'breadType', suggestion || '')
                          }
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
                    {DAYS.map((g) => (
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

          {/* Datalist condiviso per i tipi di pane */}
          <datalist id="tipi-pane">
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
