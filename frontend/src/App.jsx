import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import AddCustomer from './pages/AddCustomer'
import Planner from './pages/Planner'

function Home () {
  const [count, setCount] = useState(0)
  return (
    <>
      <h1 className="text-4xl font-extrabold tracking-tight text-bakery-brown mb-4">Il Forno</h1>
      <p className="text-bakery-choco/80 mb-6">Vite + React</p>
      <div className="p-6 border border-bakery-dough/80 bg-white/70 backdrop-blur rounded-xl shadow-sm mb-6">
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="rounded-md border border-bakery-dough bg-bakery-wheat text-bakery-choco px-4 py-2 font-medium hover:bg-bakery-dough/70 hover:border-bakery-brown transition"
        >
          count is {count}
        </button>
        <p className="mt-3 text-sm text-bakery-choco/80">
          Edit <code className="font-mono">src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-bakery-choco/70">Click on the Vite and React logos to learn more</p>
    </>
  )
}

function Layout ({ children }) {
  return (
    <div className="max-w-screen-lg mx-auto p-8 text-center">
      <nav className="flex gap-4 mb-8 justify-center">
        <Link to="/" className="text-bakery-brown hover:text-bakery-berry underline-offset-2 hover:underline">Home</Link>
        <Link to="/add-customer" className="text-bakery-brown hover:text-bakery-berry underline-offset-2 hover:underline">Add Customer</Link>
        <Link to="/planner" className="text-bakery-brown hover:text-bakery-berry underline-offset-2 hover:underline">Planner</Link>
      </nav>
      <main className="bg-white/60 rounded-xl p-6 border border-bakery-dough/70 shadow-sm">{children}</main>
    </div>
  )
}

function App () {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-customer" element={<AddCustomer />} />
          <Route path="/planner" element={<Planner />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
