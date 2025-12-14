import { useState } from 'react'
import Navigation from '../components/Navigation'
import { db } from '../data/db'
import { useBreadList } from '../data/useBreadList'
import { showToast } from '../utils/toast'

function BreadEdit({ bread, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: bread?.name || '',
    price_cent: bread?.price_cent || '',
    visible: bread?.visible ?? true,
  })

  async function handleSubmit(e) {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      showToast('Il nome è obbligatorio', 'error')
      return
    }

    const priceCent = parseInt(formData.price_cent)
    if (isNaN(priceCent) || priceCent <= 0) {
      showToast('Il prezzo deve essere un numero maggiore di zero', 'error')
      return
    }

    try {
      // Check for duplicate name
      const existingBread = await db.bread
        .where('name')
        .equalsIgnoreCase(formData.name.trim())
        .first()

      if (existingBread && (!bread || existingBread.id !== bread.id)) {
        showToast('Esiste già un pane con questo nome', 'error')
        return
      }

      if (bread) {
        // Update existing bread
        await db.bread.update(bread.id, {
          name: formData.name.trim(),
          price_cent: priceCent,
          visible: formData.visible,
        })
        showToast('Pane aggiornato con successo', 'success')
      } else {
        // Add new bread
        await db.bread.add({
          name: formData.name.trim(),
          price_cent: priceCent,
          visible: formData.visible,
        })
        showToast('Pane aggiunto con successo', 'success')
      }

      onSave()
    } catch (error) {
      showToast('Errore nel salvataggio', 'error')
      console.error(error)
    }
  }

  function formatPrice(priceCent) {
    return `€ ${(priceCent / 100).toFixed(2)}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-bakery-choco mb-6">
          {bread ? 'Modifica Pane' : 'Aggiungi Nuovo Pane'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
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

          <div className="mb-4">
            <label className="block text-bakery-choco font-semibold mb-2">
              Prezzo (centesimi) <span className="text-bakery-berry">*</span>
            </label>
            <input
              type="number"
              value={formData.price_cent}
              onChange={(e) => setFormData({ ...formData, price_cent: e.target.value })}
              className="w-full px-4 py-2 border border-bakery-dough rounded-lg focus:outline-none focus:ring-2 focus:ring-bakery-accent"
              min="1"
              required
            />
            {formData.price_cent && (
              <p className="text-sm text-bakery-brown mt-1">
                Prezzo: {formatPrice(parseInt(formData.price_cent) || 0)}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="w-5 h-5 text-bakery-accent focus:ring-bakery-accent border-bakery-dough rounded"
              />
              <span className="ml-2 text-bakery-choco font-semibold">Visibile</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-bakery-brown text-bakery-brown rounded-lg hover:bg-bakery-cream transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-bakery-accent hover:bg-bakery-brown text-white rounded-lg transition-colors"
            >
              {bread ? 'Salva' : 'Aggiungi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GestionePane() {
  const { breadList, loadBreadList } = useBreadList()
  const [showModal, setShowModal] = useState(false)
  const [editingBread, setEditingBread] = useState(null)

  function openAddModal() {
    setEditingBread(null)
    setShowModal(true)
  }

  function openEditModal(bread) {
    setEditingBread(bread)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingBread(null)
  }

  function handleSave() {
    closeModal()
    loadBreadList()
  }

  async function handleDelete(bread) {
    const confirmDelete = confirm(`Sei sicuro di voler eliminare "${bread.name}"?`)
    if (!confirmDelete) return

    try {
      await db.bread.delete(bread.id)
      showToast('Pane eliminato con successo', 'success')
      loadBreadList()
    } catch (error) {
      showToast("Errore nell'eliminazione", 'error')
      console.error(error)
    }
  }

  function formatPrice(priceCent) {
    return `€ ${(priceCent / 100).toFixed(2)}`
  }

  return (
    <div className="min-h-screen bg-bakery-cream">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-bakery-choco">Gestione Pane</h1>
          <button
            type="button"
            onClick={openAddModal}
            className="bg-bakery-accent hover:bg-bakery-brown text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Aggiungi Nuovo Pane
          </button>
        </div>

        {breadList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-bakery-brown text-lg">Nessun tipo di pane presente nel database</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-bakery-dough">
                <tr>
                  <th className="px-6 py-3 text-left text-bakery-choco font-semibold">Nome</th>
                  <th className="px-6 py-3 text-left text-bakery-choco font-semibold">Prezzo</th>
                  <th className="px-6 py-3 text-left text-bakery-choco font-semibold">Visibile</th>
                  <th className="px-6 py-3 text-right text-bakery-choco font-semibold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bakery-wheat">
                {breadList.map((bread) => (
                  <tr key={bread.id} className="hover:bg-bakery-cream transition-colors">
                    <td className="px-6 py-4 text-bakery-choco">{bread.name}</td>
                    <td className="px-6 py-4 text-bakery-choco">{formatPrice(bread.price_cent)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-sm ${bread.visible ? 'bg-bakery-pistachio text-white' : 'bg-gray-400 text-white'}`}
                      >
                        {bread.visible ? 'Sì' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(bread)}
                        className="bg-bakery-brown hover:bg-bakery-choco text-white px-4 py-2 rounded transition-colors"
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(bread)}
                        className="bg-bakery-berry hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for Add/Edit */}
        {showModal && <BreadEdit bread={editingBread} onClose={closeModal} onSave={handleSave} />}
      </main>
    </div>
  )
}
