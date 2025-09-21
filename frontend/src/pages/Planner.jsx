import { useEffect, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { useCustomerDataController } from '../data/useCustomerDataController'

export default function Planner () {
  const [selectedDay, setDaySelected] = useState(new Date())
  const { getPlanByDate, tiers } = useCustomerDataController()
  const [selectedTier, setSelectedTier] = useState('0') // '0' means all

  const formattedDate = useMemo(() => (
    selectedDay
      ? selectedDay.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
      : ''
  ), [selectedDay])

  // Call when date or tier changes
  useEffect(() => {
    if (!selectedDay) return
    getPlanByDate(selectedDay, selectedTier).catch(console.error)
  }, [selectedDay, selectedTier, getPlanByDate])

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

        {/* Right column: filters + results */}
        <div className="lg:col-span-7 space-y-6">
          {/* Filters card */}
          <section className="bg-white rounded-xl border border-bakery-wheat p-4 md:p-5">
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

          {/* Results card (placeholder for now) */}
          <section className="bg-bakery-cream rounded-xl border border-bakery-wheat p-5">
            <h2 className="text-xl font-semibold text-bakery-brown mb-3">Consegne</h2>
            <div className="text-bakery-choco/80">
              Nessuna consegna per la selezione corrente.
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
