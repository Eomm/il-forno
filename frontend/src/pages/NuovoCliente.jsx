import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { db } from '../data/db'
import { useBreadList } from '../data/useBreadList'
import { showToast } from '../utils/toast'
import { VILLAGES } from '../data/constants'

const BASE_URL = import.meta.env.BASE_URL

const WEEKDAYS = [
  { key: 'monday', label: 'Lunedì' },
  { key: 'tuesday', label: 'Martedì' },
  { key: 'wednesday', label: 'Mercoledì' },
  { key: 'thursday', label: 'Giovedì' },
  { key: 'friday', label: 'Venerdì' },
  { key: 'saturday', label: 'Sabato' },
  { key: 'sunday', label: 'Domenica' },
]

const EMPTY_PLAN_ROW = {
  id: null,
  breadId: '',
  quantity: 1,
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
}

export default function NuovoCliente() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!customerId

  const { breadList: breadTypes } = useBreadList()
  const [formData, setFormData] = useState({
    name: '',
    village: '',
    address: '',
    priorityOrder: 1,
  })
  const [deliveryPlan, setDeliveryPlan] = useState([])

  useEffect(() => {
    if (isEditMode) {
      loadCustomer()
    } else {
      // Add empty plan row for new customers
      setDeliveryPlan([{ ...EMPTY_PLAN_ROW }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  async function loadCustomer() {
    try {
      const customer = await db.customer.get(parseInt(customerId))
      if (!customer) {
        showToast('Cliente non trovato', 'error')
        navigate(`${BASE_URL}gestione-clienti`)
        return
      }

      setFormData({
        name: customer.name,
        village: customer.village,
        address: customer.address || '',
        priorityOrder: customer.priorityOrder,
      })

      // Load delivery plans for this customer
      const plans = await db.plan.where('customerId').equals(customer.id).toArray()
      const planRows = plans.map((plan) => ({
        id: plan.id,
        breadId: plan.breadId,
        quantity: plan.quantity,
        monday: plan.monday,
        tuesday: plan.tuesday,
        wednesday: plan.wednesday,
        thursday: plan.thursday,
        friday: plan.friday,
        saturday: plan.saturday,
        sunday: plan.sunday,
      }))
      setDeliveryPlan(planRows)
    } catch (error) {
      showToast('Errore nel caricamento del cliente', 'error')
      console.error(error)
    }
  }

  function addPlanRow() {
    setDeliveryPlan([...deliveryPlan, { ...EMPTY_PLAN_ROW }])
  }

  function removePlanRow(index) {
    const newPlan = deliveryPlan.filter((_, i) => i !== index)
    setDeliveryPlan(newPlan)
  }

  function updatePlanRow(index, field, value) {
    const newPlan = [...deliveryPlan]
    newPlan[index] = { ...newPlan[index], [field]: value }
    setDeliveryPlan(newPlan)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      showToast('Il nome è obbligatorio', 'error')
      return
    }

    if (!formData.village) {
      showToast('Il giro è obbligatorio', 'error')
      return
    }

    if (deliveryPlan.length === 0) {
      showToast('Aggiungi almeno un piano di consegna', 'error')
      return
    }

    // Validate delivery plan rows
    for (let i = 0; i < deliveryPlan.length; i++) {
      const plan = deliveryPlan[i]

      if (!plan.breadId) {
        showToast(`Riga ${i + 1}: Seleziona un tipo di pane`, 'error')
        return
      }

      const quantity = parseInt(plan.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        showToast(`Riga ${i + 1}: La quantità deve essere maggiore di zero`, 'error')
        return
      }

      // Check if at least one day is selected
      const hasDay =
        plan.monday ||
        plan.tuesday ||
        plan.wednesday ||
        plan.thursday ||
        plan.friday ||
        plan.saturday ||
        plan.sunday
      if (!hasDay) {
        showToast(`Riga ${i + 1}: Seleziona almeno un giorno della settimana`, 'error')
        return
      }
    }

    try {
      let customerIdToUse = customerId

      if (isEditMode) {
        // Update existing customer
        await db.customer.update(parseInt(customerId), {
          name: formData.name.trim(),
          village: formData.village,
          address: formData.address.trim() || null,
          priorityOrder: parseInt(formData.priorityOrder),
        })

        // Delete existing plans
        await db.plan.where('customerId').equals(parseInt(customerId)).delete()
      } else {
        // Add new customer
        customerIdToUse = await db.customer.add({
          name: formData.name.trim(),
          village: formData.village,
          address: formData.address.trim() || null,
          priorityOrder: parseInt(formData.priorityOrder),
          createdAt: new Date().toISOString(),
        })
      }

      // Add delivery plans
      const plansToAdd = deliveryPlan.map((plan) => ({
        customerId: parseInt(customerIdToUse),
        breadId: parseInt(plan.breadId),
        quantity: parseInt(plan.quantity),
        deliveryDate: null,
        monday: plan.monday,
        tuesday: plan.tuesday,
        wednesday: plan.wednesday,
        thursday: plan.thursday,
        friday: plan.friday,
        saturday: plan.saturday,
        sunday: plan.sunday,
      }))

      await db.plan.bulkAdd(plansToAdd)

      showToast(
        isEditMode ? 'Cliente aggiornato con successo' : 'Cliente aggiunto con successo',
        'success'
      )
      navigate(`${BASE_URL}gestione-clienti`)
    } catch (error) {
      showToast('Errore nel salvataggio', 'error')
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-bakery-cream">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            to={`${BASE_URL}gestione-clienti`}
            className="text-bakery-brown hover:text-bakery-berry transition-colors font-medium"
          >
            ← Torna alla lista clienti
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-bakery-choco mb-8">
          {isEditMode ? 'Modifica Cliente' : 'Nuovo Cliente'}
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Customer Details */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-bakery-choco mb-6">Dettagli Cliente</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-bakery-choco font-semibold mb-2">
                  Nome <span className="text-bakery-berry">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-bakery-dough rounded-lg focus:outline-none focus:ring-2 focus:ring-bakery-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-bakery-choco font-semibold mb-2">
                  Giro <span className="text-bakery-berry">*</span>
                </label>
                <select
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full px-4 py-2 border border-bakery-dough rounded-lg focus:outline-none focus:ring-2 focus:ring-bakery-accent"
                  required
                >
                  <option value="">Seleziona Giro</option>
                  {VILLAGES.map((village) => (
                    <option key={village} value={village}>
                      {village}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-bakery-choco font-semibold mb-2">Indirizzo</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-bakery-dough rounded-lg focus:outline-none focus:ring-2 focus:ring-bakery-accent"
                />
              </div>

              <div>
                <label className="block text-bakery-choco font-semibold mb-2">
                  Ordine di consegna <span className="text-bakery-berry">*</span>
                </label>
                <input
                  type="number"
                  value={formData.priorityOrder}
                  onChange={(e) => setFormData({ ...formData, priorityOrder: e.target.value })}
                  className="w-full px-4 py-2 border border-bakery-dough rounded-lg focus:outline-none focus:ring-2 focus:ring-bakery-accent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Plan */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-bakery-choco">
                Piano di consegna <span className="text-bakery-berry">*</span>
              </h2>
              <button
                type="button"
                onClick={addPlanRow}
                className="bg-bakery-pistachio hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                + Aggiungi riga
              </button>
            </div>

            {deliveryPlan.length === 0 ? (
              <p className="text-bakery-brown text-center py-8">
                Nessun piano di consegna. Clicca "Aggiungi riga" per iniziare.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-bakery-dough">
                    <tr>
                      <th className="px-4 py-3 text-left text-bakery-choco font-semibold">Pane</th>
                      <th className="px-4 py-3 text-left text-bakery-choco font-semibold">
                        Quantità
                      </th>
                      {WEEKDAYS.map((day) => (
                        <th
                          key={day.key}
                          className="px-2 py-3 text-center text-bakery-choco font-semibold text-sm"
                        >
                          {day.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-bakery-choco font-semibold">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bakery-wheat">
                    {deliveryPlan.map((plan, index) => (
                      <tr
                        key={plan.id || `new-${index}`}
                        className="hover:bg-bakery-cream transition-colors"
                      >
                        <td className="px-4 py-3">
                          <select
                            value={plan.breadId}
                            onChange={(e) => updatePlanRow(index, 'breadId', e.target.value)}
                            className="w-full px-3 py-2 border border-bakery-dough rounded focus:outline-none focus:ring-2 focus:ring-bakery-accent"
                            required
                          >
                            <option value="">Seleziona pane</option>
                            {breadTypes.map((bread) => (
                              <option key={bread.id} value={bread.id}>
                                {bread.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={plan.quantity}
                            onChange={(e) => updatePlanRow(index, 'quantity', e.target.value)}
                            className="w-20 px-3 py-2 border border-bakery-dough rounded focus:outline-none focus:ring-2 focus:ring-bakery-accent"
                            min="1"
                            required
                          />
                        </td>
                        {WEEKDAYS.map((day) => (
                          <td key={day.key} className="px-2 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={plan[day.key]}
                              onChange={(e) => updatePlanRow(index, day.key, e.target.checked)}
                              className="w-5 h-5 text-bakery-accent focus:ring-bakery-accent border-bakery-dough rounded cursor-pointer"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removePlanRow(index)}
                            className="bg-bakery-berry hover:bg-red-700 text-white px-3 py-1 rounded transition-colors text-sm"
                          >
                            Rimuovi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              to={`${BASE_URL}gestione-clienti`}
              className="px-8 py-3 border border-bakery-brown text-bakery-brown rounded-lg hover:bg-bakery-cream transition-colors font-semibold"
            >
              Annulla
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-bakery-accent hover:bg-bakery-brown text-white rounded-lg transition-colors font-semibold"
            >
              {isEditMode ? 'Salva Modifiche' : 'Crea Cliente'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
