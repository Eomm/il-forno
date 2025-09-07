import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import AddCustomer from './pages/AddCustomer'
import Planner from './pages/Planner'

function Home () {
  const [count, setCount] = useState(0)
  return (
    <>
      <h1 className="text-3xl font-bold mb-4">Vite + React</h1>
      <div className="p-6 border rounded-lg shadow-sm mb-4">
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="rounded-md border px-4 py-2 text-base font-medium bg-neutral-900 text-white transition-colors hover:border-indigo-500 dark:bg-neutral-800"
        >
          count is {count}
        </button>
        <p className="mt-3 text-sm text-gray-600">
          Edit <code className="font-mono">src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-gray-500">Click on the Vite and React logos to learn more</p>
    </>
  )
}

function Layout ({ children }) {
  return (
    <div className="max-w-screen-lg mx-auto p-8 text-center">
      <nav className="flex gap-3 mb-6 justify-center">
        <Link to="/" className="text-indigo-600 hover:underline">Home</Link>
        <Link to="/add-customer" className="text-indigo-600 hover:underline">Add Customer</Link>
        <Link to="/planner" className="text-indigo-600 hover:underline">Planner</Link>
      </nav>
      <main>{children}</main>
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
