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
        <h1 className="text-3xl md:text-4xl font-bold text-bakery-brown">Configurazione</h1>
        <p className="text-bakery-choco/80">Operazioni di configurazione e manutenzione locale.</p>
      </header>

      <section className="bg-white rounded-xl border border-bakery-wheat p-5 space-y-4">
        <div className="flex items-center justify-between">
          {busy && (
            <span className="inline-flex items-center gap-2 text-sm text-bakery-choco/80" aria-live="polite">
              <span className="h-3 w-3 rounded-full border-2 border-bakery-choco/30 border-t-bakery-choco animate-spin" />
              Elaborazione…
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Reset card */}
          <div className="flex flex-col rounded-xl border border-bakery-wheat bg-bakery-cream/40 hover:bg-white transition-colors p-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-bakery-berry/10 text-bakery-berry">
                {/* trash icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0h8m-9 0l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                </svg>
              </span>
              <div>
                <h3 className="font-semibold text-bakery-brown">Svuota dati locali</h3>
                <p className="text-sm text-bakery-choco/70">Rimuove tutto il contenuto salvato nel browser (IndexedDB).</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetClick}
              disabled={busy}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-bakery-berry px-4 py-2 text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bakery-berry/40"
            >
              <span>Cancella dati</span>
            </button>
          </div>

          {/* Export card */}
          <div className="flex flex-col rounded-xl border border-bakery-wheat bg-bakery-cream/40 hover:bg-white transition-colors p-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-bakery-brown/10 text-bakery-brown">
                {/* download icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
                </svg>
              </span>
              <div>
                <h3 className="font-semibold text-bakery-brown">Esporta database</h3>
                <p className="text-sm text-bakery-choco/70">Scarica un file JSON con tutti i dati per il backup.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportClick}
              disabled={busy}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-bakery-brown px-4 py-2 text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bakery-brown/40"
            >
              <span>Esporta</span>
            </button>
          </div>

          {/* Import card */}
          <div className="flex flex-col rounded-xl border border-bakery-wheat bg-bakery-cream/40 hover:bg-white transition-colors p-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-bakery-choco/10 text-bakery-choco">
                {/* upload icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V9m0 0l4 4m-4-4L8 13M4 3h16" />
                </svg>
              </span>
              <div>
                <h3 className="font-semibold text-bakery-brown">Importa database</h3>
                <p className="text-sm text-bakery-choco/70">Seleziona un file JSON esportato in precedenza per ripristinare.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleImportClick}
              disabled={busy}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-bakery-choco px-4 py-2 text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bakery-choco/40"
            >
              <span>Importa</span>
            </button>
            <input
              key={fileInputKey}
              id="import-file-input"
              type="file"
              accept="application/json,.json"
              onChange={handleFileSelected}
              className="hidden"
            />
          </div>
        </div>

        {message && (
          <div role="status" aria-live="polite" className="text-sm text-bakery-brown bg-bakery-wheat/50 border border-bakery-dough rounded-md px-3 py-2">
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
