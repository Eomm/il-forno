import Dexie from 'dexie'

export class IlFornoDB extends Dexie {
  constructor() {
    super('IlFornoDB')

    this.version(1).stores({
      bread: '++id, name, visible, price_cent',
    })
  }
}

export const db = new IlFornoDB()
