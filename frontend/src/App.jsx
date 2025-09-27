import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import AddCustomer from './pages/AddCustomer'
import Planner from './pages/Planner'
import Setup from './pages/Setup'
import { useCustomerDataController } from './data/useCustomerDataController'

function Home () {
  const { tiers, loadCounts, searchCustomers } = useCustomerDataController()
  const [tierCounts, setTierCounts] = useState(() => Object.fromEntries((tiers || []).map(t => [t, 0])))
  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function refresh () {
      try {
        const counts = await loadCounts()
        if (cancelled) return
        const base = Object.fromEntries((tiers || []).map(t => [t, 0]))
        setTierCounts({ ...base, ...counts })
      } catch (e) {
        console.error('Failed to load tier counts', e)
      }
    }

    refresh()
    return () => { cancelled = true }
  }, [tiers, loadCounts])

  // Debounced customer search
  useEffect(() => {
    let cancelled = false
    const q = query.trim()
    if (q.length === 0) {
      setResults([])
      setSearching(false)
      return () => { cancelled = true }
    }

    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const rows = await searchCustomers(q)
        if (!cancelled) setResults(rows)
      } catch (e) {
        console.error('Search failed', e)
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 200)

    return () => { cancelled = true; clearTimeout(t) }
  }, [query, searchCustomers])

  return (
    <>
      <header className="space-y-1 mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-bakery-brown">Il Forno</h1>
        <p className="text-bakery-choco/80">
          Benvenuto su Il Forno! Questo sito ti aiuta a gestire i clienti e pianificare le attività del tuo panificio in modo semplice e veloce.
        </p>
      </header>

      {/* Tier counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {(tiers || []).map((t) => (
          <div key={t} className="rounded-xl border border-bakery-dough bg-white/70 backdrop-blur p-5 text-left shadow-sm">
            <div className="text-sm text-bakery-choco/70">Clienti</div>
            <div className="text-3xl font-extrabold text-bakery-brown">{tierCounts?.[t] ?? 0}</div>
            <div className="text-bakery-choco/80">{t}</div>
          </div>
        ))}
      </div>

      {/* Customer search */}
      <div className="mb-2 text-left">
        <label htmlFor="customer-search" className="block text-sm font-medium text-bakery-choco/80 mb-1">
          Cerca cliente
        </label>
        <div className="relative">
          <input
            id="customer-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digita il nome del cliente..."
            className="w-full rounded-lg border border-bakery-dough/70 bg-white/70 px-3 py-2 pr-20 text-bakery-brown placeholder-bakery-choco/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-bakery-berry/40"
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]) }}
                className="text-xs text-bakery-choco/70 hover:text-bakery-brown underline-offset-2 hover:underline"
              >
                Pulisci
              </button>
            )}
            {searching && <span className="text-xs text-bakery-choco/70">Ricerca…</span>}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {query.trim().length > 0 && !searching && results.length === 0 && (
          <div className="text-sm text-bakery-choco/70">Nessun cliente trovato.</div>
        )}
        {results.map((r) => (
          <div key={r.id}
            className="rounded-lg border border-bakery-dough bg-white/70 p-4 text-left shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-bakery-brown">{r.name}</div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-bakery-dough/50 text-bakery-brown">
                {r.tier}
              </span>
            </div>
            {r.address && (
              <div className="mt-1 text-sm text-bakery-choco/80">{r.address}</div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function Layout ({ children }) {
  const linkBase = 'px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bakery-berry/50'
  return (
    <>
      <header className="sticky top-0 z-10 mb-6 border-b border-bakery-dough/60 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-screen-lg mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-bakery-brown">Il Forno</Link>
          <nav className="flex gap-1 rounded-full bg-bakery-dough/40 p-1">
            <NavLink end to="/" className={({ isActive }) => `${linkBase} ${isActive ? 'bg-bakery-berry text-white shadow' : 'text-bakery-brown hover:bg-bakery-berry/10'}`}>Home</NavLink>
            <NavLink to="/add-customer" className={({ isActive }) => `${linkBase} ${isActive ? 'bg-bakery-berry text-white shadow' : 'text-bakery-brown hover:bg-bakery-berry/10'}`}>Add Customer</NavLink>
            <NavLink to="/planner" className={({ isActive }) => `${linkBase} ${isActive ? 'bg-bakery-berry text-white shadow' : 'text-bakery-brown hover:bg-bakery-berry/10'}`}>Planner</NavLink>
            <NavLink to="/setup" className={({ isActive }) => `${linkBase} ${isActive ? 'bg-bakery-berry text-white shadow' : 'text-bakery-brown hover:bg-bakery-berry/10'}`}>Setup</NavLink>
          </nav>
        </div>
      </header>
      <div className="max-w-screen-lg mx-auto px-6">
        <main className="text-center bg-white/60 rounded-xl p-6 border border-bakery-dough/70 shadow-sm">{children}</main>
      </div>
    </>
  )
}

function App () {
  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return (
    <BrowserRouter basename={basename}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-customer" element={<AddCustomer />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/setup" element={<Setup />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
