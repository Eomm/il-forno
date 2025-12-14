import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home'
import GestionePane from './pages/GestionePane'
import GestioneClienti from './pages/GestioneClienti'
import NuovoCliente from './pages/NuovoCliente'
import Impostazioni from './pages/Impostazioni'

const BASE_URL = import.meta.env.BASE_URL

const router = createBrowserRouter([
  {
    path: BASE_URL,
    element: <Home />,
  },
  {
    path: `${BASE_URL}gestione-pane`,
    element: <GestionePane />,
  },
  {
    path: `${BASE_URL}gestione-clienti`,
    element: <GestioneClienti />,
  },
  {
    path: `${BASE_URL}gestione-clienti/nuovo`,
    element: <NuovoCliente />,
  },
  {
    path: `${BASE_URL}gestione-clienti/edit/:customerId`,
    element: <NuovoCliente />,
  },
  {
    path: `${BASE_URL}impostazioni`,
    element: <Impostazioni />,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
