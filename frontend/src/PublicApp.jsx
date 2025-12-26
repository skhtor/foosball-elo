import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Leaderboard from './Leaderboard.jsx'
import PlayerStats from './PlayerStats.jsx'

function PublicApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/player/:playerId" element={<PlayerStats />} />
        <Route path="*" element={<div style={{textAlign: 'center', padding: '50px'}}>
          <h2>Page Not Available</h2>
          <p>This page is only available on the internal admin interface.</p>
          <a href="/" style={{color: '#3498db'}}>← Back to Leaderboard</a>
        </div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default PublicApp
