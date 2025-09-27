import { useState } from 'react'
import { useCustomerDataController } from '../data/useCustomerDataController'

export default function Setup () {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const { resetLocalData, exportLocalData, importLocalDataFromFile } = useCustomerDataController()
  const [fileInputKey, setFileInputKey] = useState(0)

  const handleResetClick = async () => {
    if (!window.confirm('Sei sicuro di voler cancellare tutti i dati locali? Questa operazione non è reversibile.')) return
    setBusy(true)
    setMessage('')
    try {
      await resetLocalData()
      setMessage('Dati locali cancellati. Puoi iniziare da zero.')
    } catch (e) {
      console.error('Reset failed', e)
      setMessage('Errore durante la cancellazione dei dati locali.')
    } finally {
      setBusy(false)
    }
  }

  const handleExportClick = async () => {
    setBusy(true)
    setMessage('')
    try {
      const { filename } = await exportLocalData()
      setMessage(`Database esportato: ${filename}`)
    } catch (e) {
      console.error('Export failed', e)
      setMessage('Errore durante l\'esportazione del database.')
    } finally {
      setBusy(false)
    }
  }

  const handleImportClick = () => {
    const input = document.getElementById('import-file-input')
    if (input) input.click()
  }

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      await importLocalDataFromFile(file)
      setMessage('Database importato correttamente.')
    } catch (err) {
      console.error('Import failed', err)
      setMessage('Errore durante l\'importazione del database.')
    } finally {
      setBusy(false)
      // reset input so same file can be chosen again later
      setFileInputKey(prev => prev + 1)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold text-bakery-brown">Setup</h1>
        <p className="text-bakery-choco/80">Operazioni di configurazione e manutenzione locale.</p>
      </header>

      <section className="bg-white rounded-xl border border-bakery-wheat p-5 space-y-3">
        <h2 className="text-xl font-semibold text-bakery-brown">Azioni</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <button
            type="button"
            onClick={handleResetClick}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg bg-bakery-berry px-4 py-2 text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Svuota dati locali (IndexedDB)
          </button>
          <button
            type="button"
            onClick={handleExportClick}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg bg-bakery-brown px-4 py-2 text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Esporta database
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg bg-bakery-choco px-4 py-2 text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Importa database
          </button>
          <input
            key={fileInputKey}
            id="import-file-input"
            type="file"
            accept="application/json,.json"
            onChange={handleFileSelected}
            className="hidden"
          />
          {busy && <span className="text-sm text-bakery-choco/80">Elaborazione…</span>}
        </div>
        {message && (
          <div role="status" className="text-sm text-bakery-brown bg-bakery-wheat/50 border border-bakery-dough rounded-md px-3 py-2">
            {message}
          </div>
        )}
        <p className="text-bakery-choco/70 text-sm">
          Nota: i dati sono salvati solo nel tuo browser. La cancellazione non influisce su eventuali backup esterni.
        </p>
      </section>
    </div>
  )
}
