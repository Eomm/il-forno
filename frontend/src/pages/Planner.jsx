import { useState, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import Navigation from '../components/Navigation'
import { db } from '../data/db'
import { VILLAGES } from '../data/constants'

const DAYS_MAP = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

export default function Planner() {
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [selectedVillage, setSelectedVillage] = useState('')
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDeliveries()
  }, [selectedDay, selectedVillage])

  const loadDeliveries = async () => {
    if (!selectedDay) {
      setDeliveries([])
      return
    }

    setLoading(true)
    try {
      const dayOfWeek = selectedDay.getDay()
      const dayName = DAYS_MAP[dayOfWeek]
      const selectedDateStr = selectedDay.toISOString().split('T')[0]

      // Fetch all plans that match the day of week OR specific delivery date
      const plans = await db.plan
        .filter((plan) => {
          return plan[dayName] === true || plan.deliveryDate === selectedDateStr
        })
        .toArray()

      // Get customer and bread details for each plan
      const deliveriesData = await Promise.all(
        plans.map(async (plan) => {
          const customer = await db.customer.get(plan.customerId)
          const bread = await db.bread.get(plan.breadId)

          // Apply village filter if selected
          if (selectedVillage && customer?.village !== selectedVillage) {
            return null
          }

          return {
            village: customer?.village || '',
            customerName: customer?.name || '',
            priorityOrder: customer?.priorityOrder || 0,
            quantity: plan.quantity,
            breadName: bread?.name || '',
          }
        })
      )

      // Filter out nulls (filtered by village) and sort
      const filteredDeliveries = deliveriesData
        .filter((delivery) => delivery !== null)
        .sort((a, b) => {
          // Sort by Village DESC, then priorityOrder ASC
          if (a.village !== b.village) {
            return b.village.localeCompare(a.village)
          }
          return a.priorityOrder - b.priorityOrder
        })

      setDeliveries(filteredDeliveries)
    } catch (error) {
      console.error('Error loading deliveries:', error)
      setDeliveries([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bakery-cream">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-bakery-choco mb-8">Planner</h1>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-bakery-choco font-semibold mb-2">Seleziona Data</label>
              <DayPicker
                mode="single"
                selected={selectedDay}
                onSelect={setSelectedDay}
                showOutsideDays
                weekStartsOn={1}
              />
            </div>

            <div>
              <label className="block text-bakery-choco font-semibold mb-2">Filtra per Giro</label>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="w-full px-4 py-2 border border-bakery-dough rounded-lg focus:outline-none focus:ring-2 focus:ring-bakery-accent"
              >
                <option value="">Tutti i giri</option>
                {VILLAGES.map((village) => (
                  <option key={village} value={village}>
                    {village}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Deliveries List Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-bakery-choco mb-4">
            Consegne per{' '}
            {selectedDay?.toLocaleDateString('it-IT', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-bakery-brown text-lg">Caricamento...</p>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-bakery-brown text-lg">
                Nessuna consegna prevista per questa data.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-bakery-dough">
                  <tr>
                    <th className="px-6 py-3 text-left text-bakery-choco font-semibold">Paese</th>
                    <th className="px-6 py-3 text-left text-bakery-choco font-semibold">Cliente</th>
                    <th className="px-6 py-3 text-left text-bakery-choco font-semibold">
                      Quantità
                    </th>
                    <th className="px-6 py-3 text-left text-bakery-choco font-semibold">
                      Tipo di Pane
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bakery-wheat">
                  {deliveries.map((delivery, index) => (
                    <tr key={index} className="hover:bg-bakery-cream transition-colors">
                      <td className="px-6 py-4 text-bakery-choco">{delivery.village}</td>
                      <td className="px-6 py-4 text-bakery-choco font-medium">
                        {delivery.customerName}
                      </td>
                      <td className="px-6 py-4 text-bakery-choco">{delivery.quantity}</td>
                      <td className="px-6 py-4 text-bakery-choco">{delivery.breadName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
