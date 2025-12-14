import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { db } from '../data/db'
import { showToast } from '../utils/toast'

const BASE_URL = import.meta.env.BASE_URL

const VILLAGES = ['Este', 'Villa', 'Deserto', "Sant'Elena"]

export default function GestioneClienti() {
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [villageFilter, setVillageFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [customers, villageFilter, nameFilter])

  async function loadCustomers() {
    try {
      const customerList = await db.customer.toArray()
      const sortedCustomers = customerList.sort((a, b) => a.name.localeCompare(b.name, 'it'))
      setCustomers(sortedCustomers)
    } catch (error) {
      showToast('Errore nel caricamento dei clienti', 'error')
      console.error(error)
    }
  }

  function applyFilters() {
    let filtered = customers

    // Filter by village
    if (villageFilter) {
      filtered = filtered.filter((customer) => customer.village === villageFilter)
    }

    // Filter by name
    if (nameFilter.trim()) {
      const searchTerm = nameFilter.toLowerCase()
      filtered = filtered.filter((customer) => customer.name.toLowerCase().includes(searchTerm))
    }

    setFilteredCustomers(filtered)
  }

  function handleVillageFilterChange(e) {
    setVillageFilter(e.target.value)
  }

  function handleNameFilterChange(e) {
    setNameFilter(e.target.value)
  }

  function clearFilters() {
    setVillageFilter('')
    setNameFilter('')
  }

  return (
    <div className="min-h-screen bg-bakery-cream">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-bakery-choco">Gestione Clienti</h1>
          <Link
            to={`${BASE_URL}gestione-clienti/nuovo`}
            className="bg-bakery-accent hover:bg-bakery-brown text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Aggiungi Nuovo Cliente
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-bakery-choco font-semibold mb-2">Filtra per Giro</label>
              <select
                value={villageFilter}
                onChange={handleVillageFilterChange}
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

            <div>
              <label className="block text-bakery-choco font-semibold mb-2">Cerca per Nome</label>
              <input
                type="text"
                value={nameFilter}
                onChange={handleNameFilterChange}
                placeholder="Cerca cliente..."
                className="w-full px-4 py-2 border border-bakery-dough rounded-lg focus:outline-none focus:ring-2 focus:ring-bakery-accent"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-bakery-brown text-bakery-brown rounded-lg hover:bg-bakery-cream transition-colors"
              >
                Cancella Filtri
              </button>
            </div>
          </div>
        </div>

        {/* Customer List */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-bakery-brown text-lg">
              {customers.length === 0
                ? 'Nessun cliente presente nel database'
                : 'Nessun cliente trovato con i filtri applicati'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-bakery-dough">
                <tr>
                  <th className="px-6 py-3 text-left text-bakery-choco font-semibold">Nome</th>
                  <th className="px-6 py-3 text-left text-bakery-choco font-semibold">Giro</th>
                  <th className="px-6 py-3 text-left text-bakery-choco font-semibold">Indirizzo</th>
                  <th className="px-6 py-3 text-right text-bakery-choco font-semibold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bakery-wheat">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-bakery-cream transition-colors">
                    <td className="px-6 py-4 text-bakery-choco font-medium">{customer.name}</td>
                    <td className="px-6 py-4 text-bakery-choco">{customer.village}</td>
                    <td className="px-6 py-4 text-bakery-choco">
                      {customer.address || (
                        <span className="text-gray-400 italic">Non specificato</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`${BASE_URL}gestione-clienti/edit/${customer.id}`}
                        className="bg-bakery-brown hover:bg-bakery-choco text-white px-4 py-2 rounded transition-colors"
                      >
                        Modifica
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
