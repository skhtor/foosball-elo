import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navigation from './Navigation'
import './App.css'

const API_URL = import.meta.env.DEV ? 'http://localhost:8080/api' : window.location.origin + '/api'

function PlayerStats() {
  const { playerId } = useParams()
  const [player, setPlayer] = useState(null)
  const [stats, setStats] = useState(null)
  const [headToHead, setHeadToHead] = useState([])
  const [ratingHistory, setRatingHistory] = useState([])
  const [recentGames, setRecentGames] = useState([])

  useEffect(() => {
    if (playerId) {
      fetchPlayerStats()
    }
  }, [playerId])

  const fetchPlayerStats = async () => {
    try {
      const [playerRes, statsRes, h2hRes, historyRes, recentRes] = await Promise.all([
        fetch(`${API_URL}/players/${playerId}`),
        fetch(`${API_URL}/players/${playerId}/stats`),
        fetch(`${API_URL}/players/${playerId}/head-to-head`),
        fetch(`${API_URL}/players/${playerId}/rating-history`),
        fetch(`${API_URL}/players/${playerId}/recent-games`)
      ])

      setPlayer(await playerRes.json())
      setStats(await statsRes.json())
      setHeadToHead(await h2hRes.json())
      setRatingHistory(await historyRes.json())
      setRecentGames(await recentRes.json())
    } catch (error) {
      console.error('Error fetching player stats:', error)
    }
  }

  const getFormIcon = (won) => won ? '✅' : '❌'

  const getStreakText = (streak) => {
    if (streak > 0) return `${streak} game win streak`
    if (streak < 0) return `${Math.abs(streak)} game losing streak`
    return 'No active streak'
  }

  if (!player || !stats) return <div>Loading...</div>

  return (
    <div className="app">
      <h1>📊 Player Stats</h1>
      <Navigation />
      <div className="container">

        {/* Player Overview */}
        <div className="section">
          <h2>{player.name}</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px'}}>
            <div className="stat-card">
              <h3>Current Rating</h3>
              <div style={{fontSize: '2em', fontWeight: 'bold', color: '#2c3e50'}}>{Math.round(player.rating)}</div>
            </div>
            <div className="stat-card">
              <h3>Games Played</h3>
              <div style={{fontSize: '2em', fontWeight: 'bold', color: '#2c3e50'}}>{stats.total_games}</div>
            </div>
            <div className="stat-card">
              <h3>Win Rate</h3>
              <div style={{fontSize: '2em', fontWeight: 'bold', color: stats.win_rate >= 0.5 ? '#27ae60' : '#e74c3c'}}>
                {(stats.win_rate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="stat-card">
              <h3>Current Streak</h3>
              <div style={{fontSize: '1.2em', fontWeight: 'bold', color: stats.current_streak > 0 ? '#27ae60' : '#e74c3c'}}>
                {getStreakText(stats.current_streak)}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Form */}
        <div className="section">
          <h2>Recent Form (Last 5 Games)</h2>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px'}}>
            {recentGames.slice(0, 5).map((game, index) => (
              <span key={index} style={{fontSize: '1.5em'}}>
                {getFormIcon(game.won)}
              </span>
            ))}
            {recentGames.length < 5 && (
              <span style={{color: '#95a5a6', marginLeft: '10px'}}>
                ({recentGames.length} games played)
              </span>
            )}
          </div>
          <div style={{fontSize: '0.9em', color: '#7f8c8d'}}>
            Recent record: {recentGames.filter(g => g.won).length}W - {recentGames.filter(g => !g.won).length}L
          </div>
        </div>

        {/* Rating History Chart */}
        <div className="section">
          <h2>Rating History</h2>
          <div style={{height: '300px', border: '1px solid #ddd', borderRadius: '4px', padding: '20px', position: 'relative', background: '#f8f9fa'}}>
            {ratingHistory.length > 1 ? (
              <svg width="100%" height="100%" viewBox="0 0 800 260">
                <defs>
                  <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3498db" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#3498db" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                {/* Chart implementation would go here */}
                <text x="400" y="130" textAnchor="middle" fill="#7f8c8d">
                  Rating chart visualization (requires chart library)
                </text>
              </svg>
            ) : (
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#7f8c8d'}}>
                Not enough games for rating history
              </div>
            )}
          </div>
        </div>

        {/* Head-to-Head Records */}
        <div className="section">
          <h2>Head-to-Head Records</h2>
          {headToHead.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Opponent</th>
                  <th>Games</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Win Rate</th>
                  <th>Last Result</th>
                </tr>
              </thead>
              <tbody>
                {headToHead.map(h2h => (
                  <tr key={h2h.opponent_id}>
                    <td>{h2h.opponent_name}</td>
                    <td>{h2h.total_games}</td>
                    <td style={{color: '#27ae60'}}>{h2h.wins}</td>
                    <td style={{color: '#e74c3c'}}>{h2h.losses}</td>
                    <td style={{color: h2h.win_rate >= 0.5 ? '#27ae60' : '#e74c3c'}}>
                      {(h2h.win_rate * 100).toFixed(1)}%
                    </td>
                    <td>{getFormIcon(h2h.last_result === 'win')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{textAlign: 'center', color: '#7f8c8d', padding: '40px'}}>
              No head-to-head records available
            </div>
          )}
        </div>

        {/* Additional Stats */}
        <div className="section">
          <h2>Additional Statistics</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
            <div className="stat-card">
              <h3>Peak Rating</h3>
              <div style={{fontSize: '1.5em', fontWeight: 'bold'}}>{Math.round(stats.peak_rating)}</div>
              <div style={{fontSize: '0.8em', color: '#7f8c8d'}}>
                {stats.peak_rating_date && `Achieved on ${new Date(stats.peak_rating_date).toLocaleDateString()}`}
              </div>
            </div>
            <div className="stat-card">
              <h3>Longest Win Streak</h3>
              <div style={{fontSize: '1.5em', fontWeight: 'bold', color: '#27ae60'}}>{stats.longest_win_streak}</div>
            </div>
            <div className="stat-card">
              <h3>Longest Losing Streak</h3>
              <div style={{fontSize: '1.5em', fontWeight: 'bold', color: '#e74c3c'}}>{stats.longest_losing_streak}</div>
            </div>
            <div className="stat-card">
              <h3>Average Rating Change</h3>
              <div style={{fontSize: '1.5em', fontWeight: 'bold'}}>
                {stats.avg_rating_change > 0 ? '+' : ''}{stats.avg_rating_change?.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default PlayerStats
