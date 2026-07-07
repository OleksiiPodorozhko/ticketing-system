import { useParams } from 'react-router-dom'

export default function TicketPage() {
  const { id } = useParams()
  return (
    <>
      <h1>Ticket {id}</h1>
      <p>(placeholder)</p>
    </>
  )
}
