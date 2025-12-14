import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'

const BASE_URL = import.meta.env.BASE_URL

export default function Home() {
  return (
    <div className="min-h-screen bg-bakery-cream">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-bakery-choco mb-4">Benvenuti a Il Forno</h1>
          <p className="text-xl text-bakery-brown">Sistema di gestione per il vostro panificio</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Link
            to={`${BASE_URL}gestione-pane`}
            className="bg-bakery-wheat p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow border-2 border-bakery-dough hover:border-bakery-brown"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-bakery-choco mb-3">Gestione Pane</h2>
              <p className="text-bakery-brown">Gestisci i tipi di pane e i prezzi</p>
            </div>
          </Link>

          <Link
            to={`${BASE_URL}gestione-clienti`}
            className="bg-bakery-wheat p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow border-2 border-bakery-dough hover:border-bakery-brown"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-bakery-choco mb-3">Gestione Clienti</h2>
              <p className="text-bakery-brown">Visualizza e modifica i clienti</p>
            </div>
          </Link>

          <Link
            to={`${BASE_URL}impostazioni`}
            className="bg-bakery-wheat p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow border-2 border-bakery-dough hover:border-bakery-brown"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-bakery-choco mb-3">Impostazioni</h2>
              <p className="text-bakery-brown">Gestisci le impostazioni dell'applicazione</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
