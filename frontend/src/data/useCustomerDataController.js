// Data layer utility: bread types, tiers, and submit handler

export const breadTypes = [
  "Tartaruga",
  "Buffo",
  "Buffetto",
  "Spiga",
  "Spighetta",
  "Grano duro",
  "Arabo",
  "Arabetto",
  "Olio",
  "Olio piccolo",
  "Schizzotto alto da 1",
  "Schizzotto alto da 2",
  "Schizzotto alto da 3",
  "Schizzotto basso da 1",
  "Schizzotto basso da 2",
  "Schizzotto basso da 3",
  "Casereccio da 1",
  "Casereccio da 2",
  "Casereccio da 3",
  "Latte tondo",
  "Latte lungo",
  "Latte piccolo",
  "Integrale lungo",
  "Integrale tondo",
  "Integrale tartaruga",
  "Integrale piccolo",
  "Soffiata",
  "Francesina",
  "Zoccolo",
  "Zoccolo piccolo",
  "Ciabatta",
  "Mantovana",
  "Mantovanina",
  "Rosetta grande",
  "Rosetta piccola",
  "Spaccatina",
  "Lunga",
  "Ciriola",
  "Corno",
  "Montasu'",
  "Corno ferrarese",
  "Piccola comune",
  "Curcuma",
  "Mais",
  "Multicereale bianco",
  "Multicerenero",
  "Zucca",
  "Segale",
  "Hamburger",
  "Uvetta",
  "Cioccolato",
  "Filone",
  "Filone all'olio",
  "Misto comune",
  "Misto olio"
]

export const TIERS = ['Este', 'Villa', 'Deserto']

export function useCustomerDataController () {
  const getBreadTypes = () => breadTypes
  const getTiers = () => TIERS

  const submitCustomer = async ({ customer, rows }) => {
    // Validazioni base
    if (!customer?.name?.trim()) throw new Error('Il nome è obbligatorio')
    if (!customer?.tier) throw new Error('Il giro è obbligatorio')
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('Aggiungi almeno una riga di consegna')

    const invalidRow = rows.find((r) => !r.breadType || !r.quantity || !Object.values(r.days || {}).some(Boolean))
    if (invalidRow) throw new Error('Controlla le righe: tipo, quantità e almeno un giorno sono obbligatori')

    // Prepara payload (adatta ai requisiti del backend se necessario)
    const payload = {
      customer: {
        name: customer.name.trim(),
        address: customer.address?.trim() || '',
        tier: customer.tier,
      },
      plan: rows.map((r) => ({
        breadType: r.breadType,
        quantity: r.quantity,
        days: r.days,
      })),
      createdAt: new Date().toISOString(),
    }

    // Esempio: chiamata API (commentata)
    // const res = await fetch('/api/customers', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload),
    // })
    // if (!res.ok) throw new Error('Errore durante il salvataggio')
    // return await res.json()

    // Fallback: simulazione salvataggio
    console.log('Submitting customer payload', payload)
    await new Promise((r) => setTimeout(r, 400))
    return { ok: true }
  }

  return {
    breadTypes: getBreadTypes(),
    tiers: getTiers(),
    submitCustomer,
  }
}
