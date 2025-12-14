import { Link } from 'react-router-dom'

const BASE_URL = import.meta.env.BASE_URL

export default function Navigation() {
  return (
    <nav className="bg-bakery-cream text-bakery-brown shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link
            to={`${BASE_URL}`}
            className="text-2xl font-bold hover:text-bakery-berry transition-colors"
          >
            Il Forno
          </Link>
          <ul className="flex space-x-6">
            <li>
              <Link
                to={`${BASE_URL}`}
                className="hover:text-bakery-berry transition-colors font-medium"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to={`${BASE_URL}planner`}
                className="hover:text-bakery-berry transition-colors font-medium"
              >
                Planner
              </Link>
            </li>
            <li>
              <Link
                to={`${BASE_URL}gestione-pane`}
                className="hover:text-bakery-berry transition-colors font-medium"
              >
                Gestione Pane
              </Link>
            </li>
            <li>
              <Link
                to={`${BASE_URL}gestione-clienti`}
                className="hover:text-bakery-berry transition-colors font-medium"
              >
                Gestione Clienti
              </Link>
            </li>
            <li>
              <Link
                to={`${BASE_URL}impostazioni`}
                className="hover:text-bakery-berry transition-colors font-medium"
              >
                Impostazioni
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
