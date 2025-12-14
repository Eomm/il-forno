import { useState, useEffect } from 'react'
import { db } from './db'
import { showToast } from '../utils/toast'

/**
 * Custom hook to load and manage bread list from database
 * @param {Object} options - Options for loading bread list
 * @param {boolean} options.visibleOnly - If true, only load visible bread types
 * @param {boolean} options.autoLoad - If true, automatically load on mount (default: true)
 * @returns {Object} - { breadList, loading, loadBreadList }
 */
export function useBreadList({ visibleOnly = false, autoLoad = true } = {}) {
  const [breadList, setBreadList] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadBreadList() {
    setLoading(true)
    try {
      let breads
      if (visibleOnly) {
        breads = await db.bread.where('visible').equals(1).toArray()
      } else {
        breads = await db.bread.toArray()
      }
      const sortedBreads = breads.sort((a, b) => a.name.localeCompare(b.name, 'it'))
      setBreadList(sortedBreads)
    } catch (error) {
      showToast('Errore nel caricamento dei tipi di pane', 'error')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoLoad) {
      loadBreadList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { breadList, loading, loadBreadList }
}
