import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Leaderboard from './Leaderboard.jsx'
import Game from './Game.jsx'
import AddPlayer from './AddPlayer.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/games" element={<Game />} />
        <Route path="/add-player" element={<AddPlayer />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
