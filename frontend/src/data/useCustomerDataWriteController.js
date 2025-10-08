// Write-focused data controller: create/update customers and maintenance utilities

import IDBExportImport from 'indexeddb-export-import'
import { breadNameToId, db } from './useCustomerDataReadController'
import { BREAD_TYPES } from './breadTypes'

// Internal helpers (write-only)
async function getCustomerByName(name) {
  return db.customers.get({ name })
}

async function saveCustomerWithPlanToDB({ customer, plan }) {
  const createdAt = new Date().toISOString()
  return db.transaction('rw', db.customers, db.plan, async () => {
    const customerId = await db.customers.add({
      name: customer.name,
      address: customer.address || '',
      tier: customer.tier,
      createdAt,
    })
    const rows = plan.map((r) => {
      const days = r.days || {}
      return {
        customerId,
        createdAt,
        breadTypeId: r.breadTypeId,
        quantity: r.quantity,
        deliveryDate: null,
        monday: !!days.mon,
        tuesday: !!days.tue,
        wednesday: !!days.wed,
        thursday: !!days.thu,
        friday: !!days.fri,
        saturday: !!days.sat,
        sunday: !!days.sun,
      }
    })
    await db.plan.bulkAdd(rows)
    return { ok: true }
  })
}

async function updateCustomerAndPlanInDB({ customerId, tier, address, plan }) {
  const createdAt = new Date().toISOString()
  return db.transaction('rw', db.customers, db.plan, async () => {
    await db.customers.update(customerId, { tier, address: address || '' })
    const existingIds = await db.plan
      .where({ customerId })
      .and((r) => r.deliveryDate == null)
      .primaryKeys()
    if (existingIds.length) await db.plan.bulkDelete(existingIds)
    const rows = plan.map((r) => {
      const days = r.days || {}
      return {
        customerId,
        createdAt,
        breadTypeId: r.breadTypeId,
        quantity: r.quantity,
        deliveryDate: null,
        monday: !!days.mon,
        tuesday: !!days.tue,
        wednesday: !!days.wed,
        thursday: !!days.thu,
        friday: !!days.fri,
        saturday: !!days.sat,
        sunday: !!days.sun,
      }
    })
    if (rows.length) await db.plan.bulkAdd(rows)
    return { ok: true }
  })
}

// Public write functions
async function resetLocalData() {
  await db.delete()
  await db.open()
}

async function exportLocalData() {
  await db.open()
  const idbDatabase = db.backendDB()
  const jsonString = await new Promise((resolve, reject) => {
    IDBExportImport.exportToJsonString(idbDatabase, (err, json) => {
      if (err) return reject(err)
      resolve(json)
    })
  })
  const pad = (n) => String(n).padStart(2, '0')
  const now = new Date()
  const human = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  const filename = `il-forno_${human}.json`
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { filename }
}

async function importLocalDataFromFile(file) {
  if (!file) throw new Error('Nessun file selezionato')
  const jsonString = await (file.text
    ? file.text()
    : new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsText(file)
      }))
  await db.open()
  const idbDatabase = db.backendDB()
  await new Promise((resolve, reject) => {
    IDBExportImport.clearDatabase(idbDatabase, (err) => (err ? reject(err) : resolve()))
  })
  await new Promise((resolve, reject) => {
    IDBExportImport.importFromJsonString(idbDatabase, jsonString, (err) =>
      err ? reject(err) : resolve()
    )
  })
}

async function submitCustomer({ customer, rows }) {
  if (!customer?.name?.trim()) throw new Error('Il nome è obbligatorio')
  if (!customer?.tier) throw new Error('Il giro è obbligatorio')
  if (!Array.isArray(rows) || rows.length === 0)
    throw new Error('Aggiungi almeno una riga di consegna')
  const invalidRow = rows.find((r) => {
    const hasBread = r.breadTypeId != null || !!r.breadType
    const hasQuantity = !!r.quantity
    const hasDays = Object.values(r.days || {}).some(Boolean)
    return !hasBread || !hasQuantity || !hasDays
  })
  if (invalidRow)
    throw new Error('Controlla le righe: tipo, quantità e almeno un giorno sono obbligatori')
  const name = customer.name.trim()
  const existing = await getCustomerByName(name)
  if (existing) throw new Error('Esiste già un cliente con questo nome')
  const plan = rows.map((r) => {
    let id = r.breadTypeId
    if (id == null && r.breadType) id = breadNameToId.get(r.breadType)
    if (typeof id === 'string') id = parseInt(id, 10)
    if (!Number.isFinite(id)) throw new Error('Tipo di pane non valido in una riga')
    return { breadTypeId: id, quantity: r.quantity, days: r.days }
  })
  try {
    await saveCustomerWithPlanToDB({
      customer: { name, address: customer.address?.trim() || '', tier: customer.tier },
      plan,
    })
    return { ok: true }
  } catch (err) {
    if (err?.name === 'ConstraintError') throw err
    console.error('IndexedDB save failed', err)
    throw new Error('Errore durante il salvataggio locale')
  }
}

async function updateCustomer({ id, customer, rows }) {
  if (!Number.isFinite(id)) throw new Error('ID cliente non valido')
  if (!customer?.tier) throw new Error('Il giro è obbligatorio')
  if (!Array.isArray(rows) || rows.length === 0)
    throw new Error('Aggiungi almeno una riga di consegna')
  const invalidRow = rows.find((r) => {
    const hasBread = r.breadTypeId != null || !!r.breadType
    const hasQuantity = !!r.quantity
    const hasDays = Object.values(r.days || {}).some(Boolean)
    return !hasBread || !hasQuantity || !hasDays
  })
  if (invalidRow)
    throw new Error('Controlla le righe: tipo, quantità e almeno un giorno sono obbligatori')
  const plan = rows.map((r) => {
    let breadTypeId = r.breadTypeId
    if (breadTypeId == null && r.breadType) breadTypeId = breadNameToId.get(r.breadType)
    if (typeof breadTypeId === 'string') breadTypeId = parseInt(breadTypeId, 10)
    if (!Number.isFinite(breadTypeId)) throw new Error('Tipo di pane non valido in una riga')
    return { breadTypeId, quantity: r.quantity, days: r.days }
  })
  try {
    await updateCustomerAndPlanInDB({
      customerId: id,
      tier: customer.tier,
      address: customer.address?.trim() || '',
      plan,
    })
    return { ok: true }
  } catch (err) {
    console.error('IndexedDB update failed', err)
    throw new Error("Errore durante l'aggiornamento del cliente")
  }
}

export function useCustomerDataWriteController() {
  // Expose only write / maintenance operations
  return {
    submitCustomer,
    updateCustomer,
    resetLocalData,
    exportLocalData,
    importLocalDataFromFile,
    // (Optionally) export bread types for forms
    breadTypes: BREAD_TYPES.map((b) => b.name),
  }
}
