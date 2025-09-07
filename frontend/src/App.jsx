import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import AddCustomer from './pages/AddCustomer'
import Planner from './pages/Planner'

function Home () {
  const [count, setCount] = useState(0)
  return (
    <>
      <div>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button type="button" onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

function Layout ({ children }) {
  return (
    <div>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Link to="/">Home</Link>
        <Link to="/add-customer">Add Customer</Link>
        <Link to="/planner">Planner</Link>
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
