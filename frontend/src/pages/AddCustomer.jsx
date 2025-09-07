import { useState } from 'react'

const DAYS = [
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
  'Domenica'
]

// Elenco tipi di pane disponibili
const BREAD_TYPES = [
  'Ciabatta',
  'Baguette',
  'Integrale',
  'Rosetta',
  'Filone',
  'Pane comune'
]

export default function AddCustomer () {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [schedule, setSchedule] = useState(() =>
    DAYS.reduce((acc, day) => {
      acc[day] = []
      return acc
    }, {})
  )
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [missingType, setMissingType] = useState(new Set())
  const makeKey = (day, id) => `${day}__${id}`

  function handleSubmit (e) {
    e.preventDefault()
    setSubmitAttempted(true)

    const newMissing = new Set()
    DAYS.forEach((day) => {
      // @ts-ignore schedule indicizzato per giorno
      ; (schedule[day] || []).forEach((row) => {
        if (!row.type || row.type.trim() === '') {
          newMissing.add(makeKey(day, row.id))
        }
      })
    })

    if (newMissing.size > 0) {
      setMissingType(newMissing)
      const firstKey = newMissing.values().next().value
      if (firstKey) {
        const [d, rid] = String(firstKey).split('__')
        const el = document.getElementById(`${d}-${rid}-type`)
        if (el) el.focus()
      }
      return
    }

    // Nessun errore: procedi
    setMissingType(new Set())
    alert('non implementato')
  }

  function addRow (day) {
    setSchedule(prev => ({
      ...prev,
      [day]: [
        ...prev[day],
        { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, quantity: 1, type: '' }
      ]
    }))
  }

  function updateRow (day, id, field, value) {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].map(row => (row.id === id ? { ...row, [field]: value } : row))
    }))

    if (field === 'type') {
      setMissingType(prev => {
        const next = new Set(prev)
        const key = makeKey(day, id)
        if (value && String(value).trim() !== '') {
          next.delete(key)
        } else if (submitAttempted) {
          next.add(key)
        }
        return next
      })
    }
  }

  function removeRow (day, id) {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter(row => row.id !== id)
    }))

    setMissingType(prev => {
      const next = new Set(prev)
      next.delete(makeKey(day, id))
      return next
    })
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-bakery-brown mb-6">Aggiungi cliente</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer info */}
        <section aria-labelledby="customer-info-heading" className="space-y-4">
          <h2 id="customer-info-heading" className="text-2xl font-semibold text-bakery-brown">Informazioni cliente</h2>
          <div className="grid gap-4">
            <div className="flex flex-col">
              <label htmlFor="name" className="mb-2 text-lg font-medium text-bakery-choco">Nome</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Maria Rossi"
                className="text-lg px-4 py-3 rounded-lg border-2 border-bakery-brown/30 focus:outline-none focus:ring-4 focus:ring-bakery-brown/30 bg-white text-bakery-brown"
                aria-describedby="name-help"
              />
              <p id="name-help" className="mt-1 text-bakery-choco/80">Inserisci il nome completo.</p>
            </div>

            <div className="flex flex-col">
              <label htmlFor="address" className="mb-2 text-lg font-medium text-bakery-choco">Indirizzo</label>
              <input
                id="address"
                name="address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="es. Via Roma 10, 00100 Roma"
                className="text-lg px-4 py-3 rounded-lg border-2 border-bakery-brown/30 focus:outline-none focus:ring-4 focus:ring-bakery-brown/30 bg-white text-bakery-brown"
                aria-describedby="address-help"
              />
              <p id="address-help" className="mt-1 text-bakery-choco/80">Via, numero civico, città (puoi aggiungere note facoltative).</p>
            </div>
          </div>
        </section>

        {/* Weekly schedule */}
        <section aria-labelledby="schedule-heading" className="space-y-4">
          <h2 id="schedule-heading" className="text-2xl font-semibold text-bakery-brown">Programma di consegna predefinito</h2>
          <p className="text-bakery-choco/80">Per ogni giorno, indica quanti pezzi e il tipo di pane. Puoi aggiungere più righe per lo stesso giorno.</p>

          <div className="space-y-6">
            {DAYS.map((day) => (
              <fieldset key={day} className="rounded-xl border-2 border-bakery-brown/20 bg-white">
                <legend className="px-3 py-2 text-xl font-semibold text-bakery-brown">{day}</legend>
                <div className="p-4 pt-2 space-y-3">
                  {schedule[day].length === 0 ? (
                    <p className="text-bakery-choco/80 text-lg" role="status">Nessuna consegna per questo giorno.</p>
                  ) : (
                    <ul className="space-y-3">
                      {schedule[day].map((row) => (
                        <li key={row.id} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] items-end gap-3 p-3 rounded-lg bg-bakery-brown/5">
                          <div className="flex flex-col">
                            <label className="mb-1 text-bakery-choco" htmlFor={`${day}-${row.id}-qty`}>Pezzi</label>
                            <input
                              id={`${day}-${row.id}-qty`}
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={99}
                              step={1}
                              value={row.quantity}
                              onChange={(e) => updateRow(day, row.id, 'quantity', Math.min(99, Math.max(1, Number(e.target.value))))}
                              onWheel={(e) => e.currentTarget.blur()}
                              className="text-lg px-4 py-3 rounded-lg border-2 border-bakery-brown/30 focus:outline-none focus:ring-4 focus:ring-bakery-brown/30 bg-white text-bakery-brown"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="mb-1 text-bakery-choco" htmlFor={`${day}-${row.id}-type`}>Tipo di pane</label>
                            <select
                              id={`${day}-${row.id}-type`}
                              value={row.type}
                              onChange={(e) => updateRow(day, row.id, 'type', e.target.value)}
                              className="text-lg px-4 py-3 rounded-lg border-2 border-bakery-brown/30 focus:outline-none focus:ring-4 focus:ring-bakery-brown/30 bg-white text-bakery-brown"
                              required
                              aria-invalid={submitAttempted && missingType.has(makeKey(day, row.id))}
                              aria-describedby={submitAttempted && missingType.has(makeKey(day, row.id)) ? `${day}-${row.id}-type-error` : undefined}
                            >
                              <option value="" disabled>Seleziona tipo di pane</option>
                              {BREAD_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            {submitAttempted && missingType.has(makeKey(day, row.id)) && (
                              <p id={`${day}-${row.id}-type-error`} className="mt-1 text-base text-red-700">Seleziona un tipo di pane.</p>
                            )}
                          </div>

                          <div className="flex sm:justify-end">
                            <button
                              type="button"
                              className="mt-6 sm:mt-0 inline-flex items-center justify-center px-4 py-3 text-lg font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 rounded-lg"
                              onClick={() => removeRow(day, row.id)}
                              aria-label={`Rimuovi riga di consegna per ${day}`}
                            >
                              Rimuovi
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-4 py-3 text-lg font-semibold text-white bg-bakery-brown hover:bg-bakery-brown/90 focus:outline-none focus:ring-4 focus:ring-bakery-brown/30 rounded-lg"
                      onClick={() => addRow(day)}
                      aria-label={`Aggiungi riga di consegna per ${day}`}
                    >
                      + Aggiungi pane
                    </button>
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 text-xl font-bold text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 rounded-xl"
          >
            Crea
          </button>
        </div>
      </form>
    </div>
  )
}
