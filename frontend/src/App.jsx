import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
