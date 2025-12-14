import Navigation from '../components/Navigation';

export default function GestionePane () {
  return (
    <div className="min-h-screen bg-bakery-cream">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-bakery-choco">Gestione Pane</h1>
      </main>
    </div>
  );
}
