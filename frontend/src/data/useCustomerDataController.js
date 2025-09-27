// Data layer utility: bread types, tiers, and submit handler

/**
 * @typedef {Object} PlanDelivery
 * @property {number} customerId - Unique ID of the customer
 * @property {string} customerName - Name of the customer
 * @property {string} tier - Tier of the customer
 * @property {number} breadTypeId - ID of the bread type
 * @property {string} breadTypeName - Name of the bread type
 * @property {number} quantity - Quantity for delivery
 * @property {string|null} deliveryDate - ISO date string if specific delivery, otherwise null
 * @property {Object} days - Object indicating delivery days (boolean for each day)
 * @property {boolean} days.monday
 * @property {boolean} days.tuesday
 * @property {boolean} days.wednesday
 * @property {boolean} days.thursday
 * @property {boolean} days.friday
 * @property {boolean} days.saturday
 * @property {boolean} days.sunday
*/

import { BREAD_TYPES } from './breadTypes'
import { TIERS } from './tiers'

// IndexedDB setup (simple helper)
const DB_NAME = 'il-forno'
const DB_VERSION = 1
const STORE_CUSTOMERS = 'customers'
const STORE_PLAN = 'plan'

const breadNameToId = new Map(BREAD_TYPES.map(({ name, id }) => [name, id]))
const breadIdToName = new Map(BREAD_TYPES.map(({ id, name }) => [id, name]))

function openDB () {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      // Create or upgrade object stores
      let customersStore
      if (!db.objectStoreNames.contains(STORE_CUSTOMERS)) {
        customersStore = db.createObjectStore(STORE_CUSTOMERS, { keyPath: 'id', autoIncrement: true })
      } else {
        customersStore = request.transaction.objectStore(STORE_CUSTOMERS)
      }
      // Ensure indexes on flat fields
      if (!customersStore.indexNames.contains('by_name_flat')) {
        customersStore.createIndex('by_name_flat', 'name', { unique: true })
      }
      if (!customersStore.indexNames.contains('by_tier_flat')) {
        customersStore.createIndex('by_tier_flat', 'tier', { unique: false })
      }

      // Create plan store
      let planStore
      if (!db.objectStoreNames.contains(STORE_PLAN)) {
        planStore = db.createObjectStore(STORE_PLAN, { keyPath: 'id', autoIncrement: true })
      } else {
        planStore = request.transaction.objectStore(STORE_PLAN)
      }
      // Helpful indexes
      if (!planStore.indexNames.contains('by_customerId')) {
        planStore.createIndex('by_customerId', 'customerId', { unique: false })
      }
      if (!planStore.indexNames.contains('by_deliveryDate')) {
        planStore.createIndex('by_deliveryDate', 'deliveryDate', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveCustomerWithPlanToDB ({ customer, plan }) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_CUSTOMERS, STORE_PLAN], 'readwrite')
    const customers = tx.objectStore(STORE_CUSTOMERS)
    const plans = tx.objectStore(STORE_PLAN)

    const createdAt = new Date().toISOString()
    // Insert customer (flat schema)
    const customerToInsert = {
      name: customer.name,
      address: customer.address || '',
      tier: customer.tier,
      createdAt,
    }

    const addCustomerReq = customers.add(customerToInsert)

    addCustomerReq.onerror = () => reject(addCustomerReq.error)

    addCustomerReq.onsuccess = () => {
      const customerId = addCustomerReq.result
      // Insert each plan row
      for (const r of plan) {
        const days = r.days || {}
        const record = {
          customerId,
          createdAt,
          breadTypeId: r.breadTypeId,
          quantity: r.quantity,
          deliveryDate: null, // default is NULL; specific deliveries could set this later
          monday: !!days.mon,
          tuesday: !!days.tue,
          wednesday: !!days.wed,
          thursday: !!days.thu,
          friday: !!days.fri,
          saturday: !!days.sat,
          sunday: !!days.sun,
        }
        const addPlanReq = plans.add(record)
        addPlanReq.onerror = () => reject(addPlanReq.error)
      }
    }

    tx.oncomplete = () => {
      db.close()
      resolve({ ok: true })
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

async function getCustomerByName (name) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CUSTOMERS, 'readonly')
    const store = tx.objectStore(STORE_CUSTOMERS)

    let index = null
    if (store.indexNames && store.indexNames.contains('by_name_flat')) index = store.index('by_name_flat')

    if (index) {
      const req = index.get(name)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    } else {
      // Fallback linear scan
      const cursorReq = store.openCursor()
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result
        if (!cursor) return resolve(null)
        const v = cursor.value
        if (v?.name === name) return resolve(v)
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
      const counts = Object.fromEntries(TIERS.map((t) => [t, 0]))
      for (const r of rows) {
        const t = r?.tier
        if (t in counts) counts[t] += 1
      }
      resolve(counts)
    }

    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
    tx.onerror = () => reject(tx.error)
  })
}

// Simple name search (case-insensitive, contains). Returns an array of flat customer rows.
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
        .filter(r => (r?.name || '').toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name))
      resolve(rows)
    }
    req.onerror = () => reject(req.error)

    tx.oncomplete = () => db.close()
    tx.onerror = () => reject(tx.error)
  })
}

function toISODate (d) {
  const date = (d instanceof Date) ? d : new Date(d)
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return local.toISOString().slice(0, 10)
}

function dayNameFromDate (d) {
  const date = (d instanceof Date) ? d : new Date(d)
  // 0=Sunday..6=Saturday
  const idx = date.getDay()
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][idx]
}

export function useCustomerDataController () {
  const getBreadTypes = () => BREAD_TYPES.map(bt => bt.name)
  const getTiers = () => TIERS

  /**
   * Delete all local IndexedDB data for this app.
   * Useful for a clean reset from the Setup page.
   *
   * @returns {Promise<void>}
   */
  const resetLocalData = async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      // If blocked by open connections, proceed once user refreshes
      req.onblocked = () => resolve()
    })
  }

  /**
   * Loads the plan/deliveries for a specific date and tier.
   *
   * @async
   * @function getPlanByDate
   * @param {Date|string|number} date - The target date (can be a Date object, ISO string, or timestamp).
   * @param {string|number} tier - The tier to filter by. If '0', returns all tiers.
   * @returns {Promise<Array<PlanDelivery>>} Resolves to an array of plan objects.
   */
  const getPlanByDate = async (date, tier) => {
    const targetDayName = dayNameFromDate(date) // e.g., 'monday'
    const targetISO = toISODate(date)

    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PLAN, STORE_CUSTOMERS], 'readonly')
      const planStore = tx.objectStore(STORE_PLAN)
      const customerStore = tx.objectStore(STORE_CUSTOMERS)

      const planReq = planStore.getAll()
      const custReq = customerStore.getAll()

      let plans = []
      let customers = []

      planReq.onsuccess = () => { plans = planReq.result || [] }
      custReq.onsuccess = () => { customers = custReq.result || [] }

      const finish = () => {
        // Build customer map
        const customerMap = new Map()
        for (const c of customers) customerMap.set(c.id, c)

        // Filter plans matching the day/date AND exclude records created after the selected date
        const filtered = plans.filter((p) => {
          // Exclude plans created after the target date
          if (p.createdAt && toISODate(p.createdAt) > targetISO) return false

          const matchDate = p.deliveryDate && p.deliveryDate === targetISO
          const matchDay = !p.deliveryDate && !!p[targetDayName]
          return matchDate || matchDay
        })

        // Optional filter by tier (ignore if '0')
        const byTier = String(tier) === '0'
          ? filtered
          : filtered.filter((p) => customerMap.get(p.customerId)?.tier === tier)

        const result = byTier.map((p) => ({
          customerId: p.customerId,
          customerName: customerMap.get(p.customerId)?.name || '—',
          tier: customerMap.get(p.customerId)?.tier || '',
          breadTypeId: p.breadTypeId,
          breadTypeName: breadIdToName.get(p.breadTypeId) || '',
          quantity: p.quantity,
          deliveryDate: p.deliveryDate,
          days: {
            monday: !!p.monday,
            tuesday: !!p.tuesday,
            wednesday: !!p.wednesday,
            thursday: !!p.thursday,
            friday: !!p.friday,
            saturday: !!p.saturday,
            sunday: !!p.sunday,
          },
        }))

        resolve(result)
      }

      tx.oncomplete = finish
      tx.onerror = () => reject(tx.error)
    })
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

    // Prepara customer flat + plan rows
    const plan = rows.map((r) => {
      let id = r.breadTypeId
      if (id == null && r.breadType) id = breadNameToId.get(r.breadType)
      if (typeof id === 'string') id = parseInt(id, 10)
      if (!Number.isFinite(id)) throw new Error('Tipo di pane non valido in una riga')
      return {
        breadTypeId: id,
        quantity: r.quantity,
        days: r.days,
      }
    })

    try {
      await saveCustomerWithPlanToDB({
        customer: { name, address: customer.address?.trim() || '', tier: customer.tier },
        plan,
      })
      return { ok: true }
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
    resetLocalData,
  }
}
