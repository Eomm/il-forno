import { useState, useEffect, useCallback } from 'react'
import { DayPicker } from 'react-day-picker'
import { it } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import Navigation from '../components/Navigation'
import { db } from '../data/db'
import { VILLAGES } from '../data/constants'
import { showToast } from '../utils/toast'
import { toISODate } from '../utils/date'

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
  const [isSaved, setIsSaved] = useState(false)

  const loadDeliveries = useCallback(async () => {
    if (!selectedDay) {
      setDeliveries([])
      return
    }

    setLoading(true)
    try {
      const dayOfWeek = selectedDay.getDay()
      const dayName = DAYS_MAP[dayOfWeek]
      const selectedDateStr = toISODate(selectedDay)

      // Fetch all plans that match the day of week OR specific delivery date
      // AND createdAt >= selectedDate
      const plans = await db.plan
        .filter((plan) => {
          const matchesDayOrDate = plan[dayName] === true || plan.deliveryDate === selectedDateStr
          const matchesCreatedAt = !plan.createdAt || plan.createdAt <= selectedDateStr
          return matchesDayOrDate && matchesCreatedAt
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
            village: customer.village,
            customerName: customer.name,
            priorityOrder: customer.priorityOrder,
            customerId: plan.customerId,
            breadId: plan.breadId,
            quantity: plan.quantity,
            breadName: bread.name,
            breadPriceCent: bread.price_cent,
          }
        })
      )

      // Filter out nulls (filtered by village) and sort
      const filteredDeliveries = deliveriesData
        .filter((delivery) => delivery !== null)
        .sort((a, b) => {
          // Sort by Village DESC, then priorityOrder ASC, then customerId ASC, then breadId ASC
          if (a.village !== b.village) {
            return b.village.localeCompare(a.village)
          }
          if (a.priorityOrder !== b.priorityOrder) {
            return a.priorityOrder - b.priorityOrder
          }
          if (a.customerId !== b.customerId) {
            return a.customerId - b.customerId
          }
          return a.breadId - b.breadId
        })

      setDeliveries(filteredDeliveries)
    } catch (error) {
      console.error('Error loading deliveries:', error)
      setDeliveries([])
    } finally {
      setLoading(false)
    }
  }, [selectedDay, selectedVillage])

  useEffect(() => {
    loadDeliveries()
    setIsSaved(false)
  }, [loadDeliveries])

  const handleSaveDeliveries = async () => {
    if (deliveries.length === 0) {
      showToast('Nessuna consegna da salvare', 'error')
      return
    }

    try {
      const selectedDateStr = selectedDay.toISOString().split('T')[0]

      // Use cached bread prices from deliveries
      const deliveredRecords = deliveries.map((delivery) => ({
        deliveredAt: selectedDateStr,
        village: delivery.village,
        customerId: delivery.customerId,
        breadName: delivery.breadName,
        breadPriceCent: delivery.breadPriceCent,
        quantity: delivery.quantity,
      }))

      await db.delivered.bulkAdd(deliveredRecords)

      setIsSaved(true)
      showToast(`${deliveries.length} consegne salvate`, 'success')
    } catch (error) {
      console.error('Error saving deliveries:', error)
      showToast('Errore nel salvataggio delle consegne', 'error')
    }
  }

  const handlePrint = () => {
    if (deliveries.length === 0) {
      showToast('Nessuna consegna da stampare', 'error')
      return
    }

    const params = new URLSearchParams()
    params.set(
      'date',
      selectedDay?.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    )
    if (selectedVillage) {
      params.set('village', selectedVillage)
    } else {
      params.set('village', 'Tutti i giri')
    }
    params.set('deliveries', JSON.stringify(deliveries))

    const BASE_URL = import.meta.env.BASE_URL
    const printUrl = `${BASE_URL}planner/print?${params.toString()}`
    window.open(printUrl, '_blank')
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
                timeZone="Europe/Rome"
                selected={selectedDay}
                onSelect={setSelectedDay}
                showOutsideDays
                locale={it}
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

        {/* Bread Summary Section */}
        {deliveries.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-xl font-semibold text-bakery-choco mb-3">Riepilogo Pane</h2>
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-bakery-dough">
                  <tr>
                    <th className="px-4 py-2 text-left text-bakery-choco font-semibold text-sm">
                      Tipo di Pane
                    </th>
                    <th className="px-4 py-2 text-left text-bakery-choco font-semibold text-sm">
                      Quantità Totale
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bakery-wheat">
                  {Object.entries(
                    deliveries.reduce((acc, delivery) => {
                      acc[delivery.breadName] = (acc[delivery.breadName] || 0) + delivery.quantity
                      return acc
                    }, {})
                  ).map(([breadName, totalQuantity]) => (
                    <tr key={breadName} className="hover:bg-bakery-cream transition-colors">
                      <td className="px-4 py-2 text-bakery-choco font-medium text-sm">
                        {breadName}
                      </td>
                      <td className="px-4 py-2 text-bakery-choco text-sm">{totalQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Deliveries List Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-bakery-choco">
              Consegne per{' '}
              {selectedDay?.toLocaleDateString('it-IT', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                disabled={deliveries.length === 0 || loading}
                className="bg-bakery-pistachio hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Stampa
              </button>
              <button
                type="button"
                onClick={handleSaveDeliveries}
                disabled={isSaved || deliveries.length === 0 || loading}
                className="bg-bakery-accent hover:bg-bakery-brown text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Salva consegne
              </button>
            </div>
          </div>

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
                    <th className="px-6 py-3 text-left text-bakery-choco font-semibold">Giro</th>
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
