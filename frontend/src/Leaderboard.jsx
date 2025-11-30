import { useState, useEffect } from 'react'
import './App.css'

const API_URL = import.meta.env.DEV ? 'http://localhost:8080/api' : window.location.origin + '/api'

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchLeaderboard = async () => {
    const res = await fetch(`${API_URL}/leaderboard`)
    const data = await res.json()
    setLeaderboard(data || [])
  }

  return (
    <div className="app">
      <h1>🏓 Foosball Leaderboard</h1>
      <div className="container">
        <div className="section">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Rating</th>
                <th>W-L</th>
                <th>Games</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, idx) => (
                <tr key={player.id}>
                  <td>{idx + 1}</td>
                  <td>{player.name}</td>
                  <td><strong>{player.rating}</strong></td>
                  <td>{player.wins}-{player.losses}</td>
                  <td>{player.games_played}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
