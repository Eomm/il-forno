import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import './PlannerPrint.css'

export default function PlannerPrint() {
  const [searchParams] = useSearchParams()
  const [deliveries, setDeliveries] = useState([])
  const [date, setDate] = useState('')
  const [village, setVillage] = useState('')

  useEffect(() => {
    // Parse URL parameters
    const dateParam = searchParams.get('date')
    const villageParam = searchParams.get('village')
    const deliveriesParam = searchParams.get('deliveries')

    if (dateParam) {
      setDate(dateParam)
    }

    if (villageParam) {
      setVillage(villageParam)
    }

    if (deliveriesParam) {
      try {
        const parsedDeliveries = JSON.parse(deliveriesParam)
        setDeliveries(parsedDeliveries)
      } catch (error) {
        console.error('Error parsing deliveries:', error)
        setDeliveries([])
      }
    }

    // Trigger print dialog after a short delay to ensure content is loaded
    const timer = setTimeout(() => {
      window.print()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchParams])

  return (
    <div className="print-container">
      <div className="print-header no-print">
        <h1 className="print-title">Il Forno - Planner Consegne</h1>
        {date && <p className="print-info">Data: {date}</p>}
        {village && <p className="print-info">Giro: {village}</p>}
      </div>

      {deliveries.length === 0 ? (
        <p>Nessuna consegna da stampare.</p>
      ) : (
        <table className="print-table">
          <thead>
            <tr>
              <th>Giro</th>
              <th>Cliente</th>
              <th>Quantità</th>
              <th>Tipo di Pane</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery, index) => (
              <tr key={index}>
                <td>{delivery.village}</td>
                <td>{delivery.customerName}</td>
                <td>{delivery.quantity}</td>
                <td>{delivery.breadName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
