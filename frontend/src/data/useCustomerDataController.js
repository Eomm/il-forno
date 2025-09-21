// Data layer utility: bread types, tiers, and submit handler

import { BREAD_TYPES } from './breadTypes'
import { TIERS } from './tiers'

// IndexedDB setup (simple helper)
const DB_NAME = 'il-forno'
const DB_VERSION = 1
const STORE_CUSTOMERS = 'customers'

const breadNameToId = new Map(BREAD_TYPES.map(({ name, id }) => [name, id]))

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

async function loadCounts () {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CUSTOMERS, 'readonly')
    const store = tx.objectStore(STORE_CUSTOMERS)
    const req = store.getAll()

    req.onsuccess = () => {
      const rows = req.result || []
      console.log(rows)

      const counts = Object.fromEntries(TIERS.map((t) => [t, 0]))
      for (const r of rows) {
        const t = r?.customer?.tier
        if (t in counts) counts[t] += 1
      }
      resolve(counts)
    }

    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
    tx.onerror = () => reject(tx.error)
  })
}

// Simple name search (case-insensitive, contains). Returns an array of rows.
async function searchCustomersByName (query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return []
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CUSTOMERS, 'readonly')
    const store = tx.objectStore(STORE_CUSTOMERS)
    const req = store.getAll()

    req.onsuccess = () => {
      const rows = (req.result || [])
        .filter(r => (r?.customer?.name || '').toLowerCase().includes(q))
        .sort((a, b) => a.customer.name.localeCompare(b.customer.name))
      resolve(rows)
    }
    req.onerror = () => reject(req.error)

    tx.oncomplete = () => db.close()
    tx.onerror = () => reject(tx.error)
  })
}

export function useCustomerDataController () {
  const getBreadTypes = () => BREAD_TYPES.map(bt => bt.name)
  const getTiers = () => TIERS

  // Placeholder: load plan/deliveries for a specific date and tier. Returns empty for now.
  const getPlanByDate = async (date, tier) => {
    // date can be a Date or ISO string; normalize if needed later
    void date
    void tier
    return []
  }

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
        if (id == null && r.breadType) id = breadNameToId.get(r.breadType)
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
    loadCounts,
    searchCustomers: searchCustomersByName,
    getPlanByDate,
  }
}
