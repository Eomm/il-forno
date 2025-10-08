import { useMemo } from 'react'
import { DAYS } from './planConstants'

/**
 * Reusable plan table for adding/editing a customer's default delivery plan.
 * Props:
 *  rows: Array<{ id:number, breadType:string, quantity:number, days:Record<string,boolean> }>
 *  breadTypes: string[]
 *  onAddRow(): void
 *  onRemoveRow(rowId:number): void
 *  onChangeBreadType(rowId:number, value:string): void  (blur normalization handled by caller OR pass onBlurBreadType)
 *  onBlurBreadType?(rowId:number, value:string): void
 *  onChangeQuantity(rowId:number, value:number): void
 *  onToggleDay(rowId:number, dayKey:string, checked:boolean): void
 *  showMissingDaysWarning: boolean
 *  disabled?: boolean (disables inputs, but keeps remove buttons unless disableRemove)
 *  disableRemove?: boolean
 *  datalistId: string id for shared datalist
 */
export function CustomerPlanTable({
  rows,
  breadTypes,
  onAddRow,
  onRemoveRow,
  onChangeBreadType,
  onBlurBreadType,
  onChangeQuantity,
  onToggleDay,
  showMissingDaysWarning,
  disabled = false,
  disableRemove = false,
  datalistId,
}) {
  const warning = useMemo(() => showMissingDaysWarning, [showMissingDaysWarning])
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-bakery-brown">Piano di consegna predefinito</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-bakery-wheat rounded-lg overflow-hidden text-base">
          <caption className="sr-only">
            Tabella per definire tipo di pane, quantità e giorni di consegna
          </caption>
          <thead className="bg-bakery-wheat/60">
            <tr className="text-bakery-choco">
              <th scope="col" className="px-3 py-3 text-left font-semibold">
                Tipo di pane <span className="text-bakery-berry">*</span>
              </th>
              <th scope="col" className="px-3 py-3 text-left font-semibold">
                Quantità <span className="text-bakery-berry">*</span>
              </th>
              {DAYS.map((g) => (
                <th key={g.key} scope="col" className="px-2 py-3 text-center font-semibold">
                  {g.label}
                </th>
              ))}
              <th scope="col" className="px-2 py-3 text-center font-semibold">
                <span className="sr-only">Azioni</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-bakery-cream/60'}>
                <td className="px-3 py-2 align-middle">
                  <label htmlFor={`breadType-${row.id}`} className="sr-only">
                    Tipo di pane
                  </label>
                  <input
                    id={`breadType-${row.id}`}
                    name={`breadType-${row.id}`}
                    type="text"
                    required
                    value={row.breadType}
                    disabled={disabled}
                    onChange={(e) => onChangeBreadType(row.id, e.target.value)}
                    onBlur={
                      onBlurBreadType ? (e) => onBlurBreadType(row.id, e.target.value) : undefined
                    }
                    placeholder="Seleziona tipo di pane"
                    list={datalistId}
                    autoComplete="off"
                    className="w-full rounded-lg border border-bakery-dough bg-white px-3 py-2 text-lg text-bakery-choco disabled:bg-bakery-wheat/40 focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
                  />
                </td>
                <td className="px-3 py-2 align-middle">
                  <label htmlFor={`quantity-${row.id}`} className="sr-only">
                    Quantità
                  </label>
                  <input
                    id={`quantity-${row.id}`}
                    name={`quantity-${row.id}`}
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={row.quantity}
                    disabled={disabled}
                    onChange={(e) => onChangeQuantity(row.id, Number(e.target.value))}
                    className="w-28 rounded-lg border border-bakery-dough bg-white px-3 py-2 text-lg text-bakery-choco disabled:bg-bakery-wheat/40 focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
                  />
                </td>
                {DAYS.map((g) => (
                  <td key={`${row.id}-${g.key}`} className="px-2 py-2 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <input
                        id={`day-${g.key}-${row.id}`}
                        name={`day-${g.key}-${row.id}`}
                        type="checkbox"
                        checked={row.days[g.key]}
                        disabled={disabled}
                        onChange={(e) => onToggleDay(row.id, g.key, e.target.checked)}
                        aria-label={`Consegna ${g.label} per questa riga`}
                        className="h-6 w-6 accent-bakery-accent disabled:opacity-60 focus:ring-4 focus:ring-bakery-accent/30"
                      />
                    </div>
                  </td>
                ))}
                <td className="px-2 py-2 text-center align-middle">
                  {!disableRemove && (
                    <button
                      type="button"
                      onClick={() => onRemoveRow(row.id)}
                      aria-label="Rimuovi riga"
                      disabled={disabled}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-bakery-dough bg-white text-bakery-berry disabled:opacity-40 hover:bg-bakery-wheat/50 focus:outline-none focus:ring-4 focus:ring-bakery-accent/30"
                      title="Rimuovi riga"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <datalist id={datalistId}>
        {breadTypes.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={onAddRow}
          disabled={disabled}
          className="inline-flex items-center justify-center rounded-lg bg-bakery-pistachio px-4 py-3 text-lg font-semibold text-white disabled:opacity-50 hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-bakery-pistachio/40"
        >
          Aggiungi riga
        </button>
        {warning && (
          <div
            role="status"
            className="flex-1 min-w-[280px] md:min-w-[480px] text-bakery-berry bg-bakery-wheat/60 border border-bakery-dough rounded-lg px-4 py-3 text-base"
          >
            Seleziona almeno un giorno di consegna per ogni riga della tabella.
          </div>
        )}
      </div>
    </section>
  )
}
