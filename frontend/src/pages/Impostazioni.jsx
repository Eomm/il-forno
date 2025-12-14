import { useRef } from 'react'
import Navigation from '../components/Navigation'
import { db } from '../data/db'
import { exportToJsonString, importFromJsonString, clearDatabase } from 'indexeddb-export-import'
import { showToast } from '../utils/toast'

export default function Impostazioni() {
  const fileInputRef = useRef(null)

  async function handleExportDB() {
    try {
      const idbDatabase = db.backendDB()
      const jsonString = await new Promise((resolve, reject) => {
        exportToJsonString(idbDatabase, (err, json) => {
          if (err) return reject(err)
          resolve(json)
        })
      })

      const pad = (n) => String(n).padStart(2, '0')
      const now = new Date()
      const human = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`

      // Create a download link
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `il-forno-backup-${human}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showToast('Database esportato con successo', 'success')
    } catch (error) {
      showToast("Errore durante l'esportazione", 'error')
      console.error('Export error:', error)
    }
  }

  async function handleImportDB() {
    fileInputRef.current?.click()
  }

  async function handleFileSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const jsonString = await file.text()
      console.log({ jsonString })

      const idbDatabase = db.backendDB()

      // Clear existing data first
      await new Promise((resolve, reject) => {
        clearDatabase(idbDatabase, (err) => (err ? reject(err) : resolve()))
      })

      // Import new data
      await new Promise((resolve, reject) => {
        importFromJsonString(idbDatabase, jsonString, (err) => (err ? reject(err) : resolve()))
      })

      showToast('Database importato con successo', 'success')

      // Reload the page to refresh all data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      showToast("Errore durante l'importazione", 'error')
      console.error('Import error:', error)
    }

    // Reset file input
    event.target.value = ''
  }

  async function handleDropDB() {
    const confirmed = window.confirm(
      'Sei sicuro di voler cancellare tutti i dati? Questa operazione non può essere annullata.'
    )

    if (!confirmed) return

    try {
      const idbDatabase = db.backendDB()
      await clearDatabase(idbDatabase)

      showToast('Dati cancellati con successo', 'success')

      // Reload the page to refresh
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      showToast('Errore durante la cancellazione', 'error')
      console.error('Drop error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-bakery-cream">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-bakery-choco mb-8">Configurazione</h1>

        <p className="text-bakery-brown mb-8">
          Operazioni di configurazione e manutenzione locale. <strong>Nota:</strong> i dati sono
          salvati solo nel tuo browser. La cancellazione non influisce su eventuali backup esterni.
        </p>

        <div className="space-y-6">
          {/* Export Database */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-bakery-choco mb-4">Esporta database</h2>
            <p className="text-bakery-brown mb-4">
              Scarica un file JSON con tutti i dati per il backup.
            </p>
            <button
              type="button"
              onClick={handleExportDB}
              className="bg-bakery-accent hover:bg-bakery-brown text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Esporta
            </button>
          </div>

          {/* Import Database */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-bakery-choco mb-4">Importa database</h2>
            <p className="text-bakery-brown mb-4">
              Seleziona un file JSON esportato in precedenza per ripristinare.
            </p>
            <button
              type="button"
              onClick={handleImportDB}
              className="bg-bakery-pistachio hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Importa
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Clear Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-bakery-choco mb-4">Svuota dati locali</h2>
            <p className="text-bakery-brown mb-4">
              Rimuove tutto il contenuto salvato nel browser (IndexedDB).
            </p>
            <button
              type="button"
              onClick={handleDropDB}
              className="bg-bakery-berry hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancella dati
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
