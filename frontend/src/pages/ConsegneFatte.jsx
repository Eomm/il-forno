import { useState, useEffect, useCallback } from 'react'
import { DayPicker } from 'react-day-picker'
import { it } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import Navigation from '../components/Navigation'
import { db } from '../data/db'
import { VILLAGES } from '../data/constants'
import { toISODate } from '../utils/date'

export default function ConsegneFatte() {
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined })
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(false)
  const [villageFilter, setVillageFilter] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const loadDeliveries = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) {
      setDeliveries([])
      return
    }

    setLoading(true)
    try {
      const fromDateStr = toISODate(dateRange.from)
      const toDateStr = toISODate(dateRange.to)

      // Fetch all deliveries in the date range
      const delivered = await db.delivered
        .filter((d) => {
          const matchesDate = d.deliveredAt >= fromDateStr && d.deliveredAt <= toDateStr
          const matchesVillage = !villageFilter || d.village === villageFilter
          return matchesDate && matchesVillage
        })
        .toArray()

      // Fetch customer names
      const customerIds = [...new Set(delivered.map((d) => d.customerId))]
      const customers = await db.customer.bulkGet(customerIds)
      const customerMap = Object.fromEntries(customers.map((c) => [c.id, c.name]))

      // Add customer names to deliveries
      const deliveriesWithNames = delivered.map((d) => ({
        ...d,
        customerName: customerMap[d.customerId] || `Cliente #${d.customerId}`,
      }))

      // Group deliveries by village, then by customer
      const groupedByVillage = {}
      for (const delivery of deliveriesWithNames) {
        if (!groupedByVillage[delivery.village]) {
          groupedByVillage[delivery.village] = {}
        }

        const customerKey = delivery.customerId
        if (!groupedByVillage[delivery.village][customerKey]) {
          groupedByVillage[delivery.village][customerKey] = {
            customerId: delivery.customerId,
            customerName: delivery.customerName,
            deliveries: [],
            totalQuantity: 0,
            totalAmount: 0,
          }
        }

        const customerGroup = groupedByVillage[delivery.village][customerKey]
        customerGroup.deliveries.push(delivery)
        customerGroup.totalQuantity += delivery.quantity
        customerGroup.totalAmount += (delivery.quantity * delivery.breadPriceCent) / 100
      }

      // Sort villages and convert customer groups to arrays
      const sortedVillages = VILLAGES.filter((v) => groupedByVillage[v])
      const result = sortedVillages.map((village) => ({
        village,
        customers: Object.values(groupedByVillage[village]),
      }))

      setDeliveries(result)
    } catch (error) {
      console.error('Error loading deliveries:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange, villageFilter])

  useEffect(() => {
    loadDeliveries()
  }, [loadDeliveries])

  function calculateTotal(delivery) {
    return (delivery.quantity * delivery.breadPriceCent) / 100
  }

  function calculateVillageTotal(customers) {
    return customers.reduce((sum, customer) => sum + customer.totalAmount, 0)
  }

  function calculateGrandTotal() {
    return deliveries.reduce((sum, group) => sum + calculateVillageTotal(group.customers), 0)
  }

  return (
    <div className="min-h-screen bg-bakery-cream">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-bakery-choco mb-8">Consegne Fatte</h1>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-bakery-choco font-semibold mb-2">
                Seleziona Periodo
              </label>
              <DayPicker
                mode="range"
                timeZone="Europe/Rome"
                selected={dateRange}
                onSelect={setDateRange}
                locale={it}
                weekStartsOn={1}
              />
              {dateRange?.from && dateRange?.to && (
                <p className="text-center mt-4 text-bakery-brown">
                  Dal <strong>{toISODate(dateRange.from)}</strong> al{' '}
                  <strong>{toISODate(dateRange.to)}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-bakery-choco font-semibold mb-2">Filtra per Giro</label>
              <select
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                className="w-full px-4 py-2 border border-bakery-dough rounded-lg focus:outline-none focus:ring-2 focus:ring-bakery-accent"
              >
                <option value="">Tutti i Giri</option>
                {VILLAGES.map((village) => (
                  <option key={village} value={village}>
                    {village}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && <div className="text-center text-bakery-brown text-xl">Caricamento...</div>}

        {!loading && dateRange?.from && dateRange?.to && deliveries.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-bakery-brown text-lg">
              Nessuna consegna trovata per il periodo selezionato
            </p>
          </div>
        )}

        {!loading && deliveries.length > 0 && (
          <div className="space-y-6">
            {deliveries.map((group) => (
              <div key={group.village} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-bold text-bakery-brown mb-4">{group.village}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-bakery-dough">
                        <th className="text-left py-3 px-4 text-bakery-brown font-semibold">
                          Cliente
                        </th>
                        <th className="text-right py-3 px-4 text-bakery-brown font-semibold">
                          Totale Pane
                        </th>
                        <th className="text-right py-3 px-4 text-bakery-brown font-semibold">
                          Totale €
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.customers.map((customer) => (
                        <tr
                          key={customer.customerId}
                          onClick={() => setSelectedCustomer(customer)}
                          className="border-b border-bakery-wheat hover:bg-bakery-cream transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 text-bakery-choco">{customer.customerName}</td>
                          <td className="py-3 px-4 text-bakery-choco text-right">
                            {customer.totalQuantity}
                          </td>
                          <td className="py-3 px-4 text-bakery-choco text-right font-semibold">
                            €{customer.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-bakery-wheat font-bold">
                        <td className="py-3 px-4 text-bakery-brown text-right">
                          Totale {group.village}:
                        </td>
                        <td className="py-3 px-4 text-bakery-brown text-right">
                          {group.customers.reduce((sum, c) => sum + c.totalQuantity, 0)}
                        </td>
                        <td className="py-3 px-4 text-bakery-brown text-right">
                          €{calculateVillageTotal(group.customers).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <div className="bg-bakery-brown rounded-lg shadow-md p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Totale Generale</h3>
                <p className="text-3xl font-bold">€{calculateGrandTotal().toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Details Modal */}
        {selectedCustomer && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCustomer(null)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-bakery-brown text-white p-6 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{selectedCustomer.customerName}</h2>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-white hover:text-bakery-cream text-3xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-bakery-dough">
                      <th className="text-left py-3 px-4 text-bakery-brown font-semibold">Data</th>
                      <th className="text-left py-3 px-4 text-bakery-brown font-semibold">Pane</th>
                      <th className="text-right py-3 px-4 text-bakery-brown font-semibold">
                        Quantità
                      </th>
                      <th className="text-right py-3 px-4 text-bakery-brown font-semibold">
                        Prezzo Applicato €
                      </th>
                      <th className="text-right py-3 px-4 text-bakery-brown font-semibold">
                        Totale €
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomer.deliveries
                      .sort((a, b) => {
                        if (a.deliveredAt !== b.deliveredAt) {
                          return a.deliveredAt.localeCompare(b.deliveredAt)
                        }
                        return a.breadName.localeCompare(b.breadName, 'it')
                      })
                      .map((delivery) => (
                        <tr
                          key={delivery.id}
                          className="border-b border-bakery-wheat transition-colors"
                        >
                          <td className="py-3 px-4 text-bakery-choco">{delivery.deliveredAt}</td>
                          <td className="py-3 px-4 text-bakery-choco">{delivery.breadName}</td>
                          <td className="py-3 px-4 text-bakery-choco text-right">
                            {delivery.quantity}
                          </td>
                          <td className="py-3 px-4 text-bakery-choco text-right">
                            {(delivery.breadPriceCent / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-bakery-choco text-right font-semibold">
                            €{calculateTotal(delivery).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    <tr className="bg-bakery-wheat font-bold">
                      <td colSpan="2" className="py-3 px-4 text-bakery-brown text-right">
                        Totale:
                      </td>
                      <td className="py-3 px-4 text-bakery-brown text-right">
                        {selectedCustomer.totalQuantity}
                      </td>
                      <td className="py-3 px-4"> </td>
                      <td className="py-3 px-4 text-bakery-brown text-right">
                        €{selectedCustomer.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
