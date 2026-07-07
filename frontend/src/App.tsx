import { Link, Navigate, Route, Routes } from 'react-router-dom'
import BoardPage from './pages/BoardPage'
import EpicsPage from './pages/EpicsPage'
import LoginPage from './pages/LoginPage'
import ResendPage from './pages/ResendPage'
import SignupPage from './pages/SignupPage'
import TeamsPage from './pages/TeamsPage'
import TicketPage from './pages/TicketPage'
import VerifyPage from './pages/VerifyPage'

export default function App() {
  return (
    <>
      <header className="app-header">
        <span className="app-title">Ticketing System</span>
        <nav className="app-nav">
          <Link to="/board">Board</Link>
          <Link to="/teams">Teams</Link>
          <Link to="/epics">Epics</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/board" replace />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/tickets/:id" element={<TicketPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/epics" element={<EpicsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/resend" element={<ResendPage />} />
          <Route
            path="*"
            element={
              <>
                <h1>Not found</h1>
                <p>(placeholder)</p>
              </>
            }
          />
        </Routes>
      </main>
    </>
  )
}
