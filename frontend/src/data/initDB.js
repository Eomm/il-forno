import { db } from './db'

const INITIAL_BREADS = [
  'Tartaruga',
  'Buffo',
  'Buffetto',
  'Spiga',
  'Spighetta',
  'Grano duro',
  'Arabo',
  'Arabetto',
  'Olio',
  'Olio piccolo',
  'Schizzotto alto da 1',
  'Schizzotto alto da 2',
  'Schizzotto alto da 3',
  'Schizzotto basso da 1',
  'Schizzotto basso da 2',
  'Schizzotto basso da 3',
  'Casereccio da 1',
  'Casereccio da 2',
  'Casereccio da 3',
  'Latte tondo',
  'Latte lungo',
  'Latte piccolo',
  'Integrale lungo',
  'Integrale tondo',
  'Integrale tartaruga',
  'Integrale piccolo',
  'Soffiata',
  'Francesina',
  'Zoccolo',
  'Zoccolo piccolo',
  'Ciabatta',
  'Mantovana',
  'Mantovanina',
  'Rosetta grande',
  'Rosetta piccola',
  'Spaccatina',
  'Lunga',
  'Ciriola',
  'Corno',
  'Montasu',
  'Corno ferrarese',
  'Piccola comune',
  'Curcuma',
  'Mais',
  'Multicereale bianco',
  'Multicerenero',
  'Zucca',
  'Segale',
  'Hamburger',
  'Uvetta',
  'Cioccolato',
  'Filone',
  "Filone all'olio",
  'Misto comune',
  'Misto olio',
  'Misto morbido',
  'Misto croccante',
  'Misto',
]

export async function initializeDatabase() {
  try {
    const count = await db.bread.count()

    // Only initialize if database is empty
    if (count === 0) {
      const breadsToAdd = INITIAL_BREADS.map((name) => ({
        name,
        price_cent: 99,
        visible: true,
      }))

      await db.bread.bulkAdd(breadsToAdd)
      console.log('Database initialized with', breadsToAdd.length, 'bread types')
      return true
    }

    return false
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}
