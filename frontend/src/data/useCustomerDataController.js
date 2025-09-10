// Data layer utility: bread types, tiers, and submit handler

export const breadTypes = [
  { id: 1, name: "Tartaruga" },
  { id: 2, name: "Buffo" },
  { id: 3, name: "Buffetto" },
  { id: 4, name: "Spiga" },
  { id: 5, name: "Spighetta" },
  { id: 6, name: "Grano duro" },
  { id: 7, name: "Arabo" },
  { id: 8, name: "Arabetto" },
  { id: 9, name: "Olio" },
  { id: 10, name: "Olio piccolo" },
  { id: 11, name: "Schizzotto alto da 1" },
  { id: 12, name: "Schizzotto alto da 2" },
  { id: 13, name: "Schizzotto alto da 3" },
  { id: 14, name: "Schizzotto basso da 1" },
  { id: 15, name: "Schizzotto basso da 2" },
  { id: 16, name: "Schizzotto basso da 3" },
  { id: 17, name: "Casereccio da 1" },
  { id: 18, name: "Casereccio da 2" },
  { id: 19, name: "Casereccio da 3" },
  { id: 20, name: "Latte tondo" },
  { id: 21, name: "Latte lungo" },
  { id: 22, name: "Latte piccolo" },
  { id: 23, name: "Integrale lungo" },
  { id: 24, name: "Integrale tondo" },
  { id: 25, name: "Integrale tartaruga" },
  { id: 26, name: "Integrale piccolo" },
  { id: 27, name: "Soffiata" },
  { id: 28, name: "Francesina" },
  { id: 29, name: "Zoccolo" },
  { id: 30, name: "Zoccolo piccolo" },
  { id: 31, name: "Ciabatta" },
  { id: 32, name: "Mantovana" },
  { id: 33, name: "Mantovanina" },
  { id: 34, name: "Rosetta grande" },
  { id: 35, name: "Rosetta piccola" },
  { id: 36, name: "Spaccatina" },
  { id: 37, name: "Lunga" },
  { id: 38, name: "Ciriola" },
  { id: 39, name: "Corno" },
  { id: 40, name: "Montasu'" },
  { id: 41, name: "Corno ferrarese" },
  { id: 42, name: "Piccola comune" },
  { id: 43, name: "Curcuma" },
  { id: 44, name: "Mais" },
  { id: 45, name: "Multicereale bianco" },
  { id: 46, name: "Multicerenero" },
  { id: 47, name: "Zucca" },
  { id: 48, name: "Segale" },
  { id: 49, name: "Hamburger" },
  { id: 50, name: "Uvetta" },
  { id: 51, name: "Cioccolato" },
  { id: 52, name: "Filone" },
  { id: 53, name: "Filone all'olio" },
  { id: 54, name: "Misto comune" },
  { id: 55, name: "Misto olio" }
]

// Removed BREAD_TYPES_LIST; build name->id map directly from breadTypes
const BREAD_NAME_TO_ID = new Map(breadTypes.map(({ name, id }) => [name, id]))

export const TIERS = ['Este', 'Villa', 'Deserto']

// IndexedDB setup (simple helper)
const DB_NAME = 'il-forno'
const DB_VERSION = 1
const STORE_CUSTOMERS = 'customers'

function openDB () {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      // Create or upgrade object store
      let store
      if (!db.objectStoreNames.contains(STORE_CUSTOMERS)) {
        store = db.createObjectStore(STORE_CUSTOMERS, { keyPath: 'id', autoIncrement: true })
      } else {
        store = request.transaction.objectStore(STORE_CUSTOMERS)
      }
      // Ensure unique index on customer.name
      if (!store.indexNames.contains('by_name')) {
        store.createIndex('by_name', 'customer.name', { unique: true })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveCustomerToDB (payload) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CUSTOMERS, 'readwrite')
    const store = tx.objectStore(STORE_CUSTOMERS)
    const req = store.add(payload)

    req.onsuccess = () => resolve({ id: req.result })
    req.onerror = () => reject(req.error)

    tx.oncomplete = () => db.close()
    tx.onerror = () => reject(tx.error)
  })
}

async function getCustomerByName (name) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CUSTOMERS, 'readonly')
    const store = tx.objectStore(STORE_CUSTOMERS)
    let index
    if (store.indexNames && store.indexNames.contains('by_name')) {
      index = store.index('by_name')
    } else {
      index = null
    }

    if (index) {
      const req = index.get(name)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    } else {
      // Fallback for older DBs without the index: linear scan
      const cursorReq = store.openCursor()
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result
        if (!cursor) return resolve(null)
        if (cursor.value?.customer?.name === name) return resolve(cursor.value)
        cursor.continue()
      }
      cursorReq.onerror = () => reject(cursorReq.error)
    }

    tx.oncomplete = () => db.close()
    tx.onerror = () => reject(tx.error)
  })
}

export function useCustomerDataController () {
  const getBreadTypes = () => breadTypes.map(bt => bt.name)
  const getTiers = () => TIERS

  const submitCustomer = async ({ customer, rows }) => {
    // Validazioni base
    if (!customer?.name?.trim()) throw new Error('Il nome è obbligatorio')
    if (!customer?.tier) throw new Error('Il giro è obbligatorio')
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('Aggiungi almeno una riga di consegna')

    const invalidRow = rows.find((r) => {
      const hasBread = r.breadTypeId != null || !!r.breadType
      const hasQuantity = !!r.quantity
      const hasDays = Object.values(r.days || {}).some(Boolean)
      return !hasBread || !hasQuantity || !hasDays
    })
    if (invalidRow) throw new Error('Controlla le righe: tipo, quantità e almeno un giorno sono obbligatori')

    const name = customer.name.trim()

    // Unicità nome cliente
    const existing = await getCustomerByName(name)
    if (existing) throw new Error('Esiste già un cliente con questo nome')

    // Prepara payload (adatta ai requisiti del backend se necessario)
    const payload = {
      customer: {
        name,
        address: customer.address?.trim() || '',
        tier: customer.tier,
      },
      plan: rows.map((r) => {
        let id = r.breadTypeId
        if (id == null && r.breadType) id = BREAD_NAME_TO_ID.get(r.breadType)
        if (typeof id === 'string') id = parseInt(id, 10)
        if (!Number.isFinite(id)) throw new Error('Tipo di pane non valido in una riga')
        return {
          breadTypeId: id,
          quantity: r.quantity,
          days: r.days,
        }
      }),
      createdAt: new Date().toISOString(),
    }

    // Salvataggio su IndexedDB
    try {
      const { id } = await saveCustomerToDB(payload)
      console.log('Saved customer to IndexedDB', { id, payload })
      return { ok: true, id }
    } catch (err) {
      if (err?.name === 'ConstraintError') {
        throw err
      }

      console.error('IndexedDB save failed', err)
      throw new Error('Errore durante il salvataggio locale')
    }
  }

  return {
    breadTypes: getBreadTypes(),
    tiers: getTiers(),
    submitCustomer,
  }
}
