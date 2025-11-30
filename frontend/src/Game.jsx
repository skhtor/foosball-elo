import { useState, useEffect } from 'react'
import './App.css'

const API_URL = import.meta.env.DEV ? 'http://localhost:8080/api' : window.location.origin + '/api'

function Game() {
  const [players, setPlayers] = useState([])
  const [games, setGames] = useState([])
  const [gameType, setGameType] = useState('singles')
  const [team1Players, setTeam1Players] = useState([])
  const [team2Players, setTeam2Players] = useState([])
  const [team1Score, setTeam1Score] = useState('')
  const [team2Score, setTeam2Score] = useState('')

  useEffect(() => {
    fetchPlayers()
    fetchGames()
  }, [])

  const fetchPlayers = async () => {
    const res = await fetch(`${API_URL}/players`)
    const data = await res.json()
    setPlayers(data || [])
  }

  const fetchGames = async () => {
    const res = await fetch(`${API_URL}/games`)
    const data = await res.json()
    setGames(data || [])
  }

  const recordGame = async (e) => {
    e.preventDefault()
    if (team1Players.length === 0 || team2Players.length === 0) return
    if (!team1Score || !team2Score) return

    await fetch(`${API_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: gameType,
        teams: [
          { player_ids: team1Players.map(Number), score: Number(team1Score) },
          { player_ids: team2Players.map(Number), score: Number(team2Score) }
        ]
      })
    })

    setTeam1Players([])
    setTeam2Players([])
    setTeam1Score('')
    setTeam2Score('')
    fetchGames()
  }

  const deleteGame = async (gameId) => {
    if (!confirm('Undo this game? This will revert all rating changes.')) return
    await fetch(`${API_URL}/games/${gameId}`, {
      method: 'DELETE'
    })
    fetchGames()
  }

  return (
    <div className="app">
      <h1>⚽ Record Game</h1>

      <div className="container">
        <div className="section">
          <h2>Record Game</h2>
          <form onSubmit={recordGame}>
            <div className="game-type">
              <label>
                <input type="radio" value="singles" checked={gameType === 'singles'} onChange={(e) => setGameType(e.target.value)} />
                Singles
              </label>
              <label>
                <input type="radio" value="doubles" checked={gameType === 'doubles'} onChange={(e) => setGameType(e.target.value)} />
                Doubles
              </label>
            </div>

            <div className="teams">
              <div className="team">
                <h3>Team 1</h3>
                <select value={team1Players[0] || ''} onChange={(e) => setTeam1Players([e.target.value])}>
                  <option value="">Select player</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {gameType === 'doubles' && (
                  <select value={team1Players[1] || ''} onChange={(e) => setTeam1Players([team1Players[0], e.target.value])}>
                    <option value="">Select partner</option>
                    {players.filter(p => p.id !== Number(team1Players[0])).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                <input type="number" value={team1Score} onChange={(e) => setTeam1Score(e.target.value)} placeholder="Score" min="0" />
              </div>

              <div className="team">
                <h3>Team 2</h3>
                <select value={team2Players[0] || ''} onChange={(e) => setTeam2Players([e.target.value])}>
                  <option value="">Select player</option>
                  {players.filter(p => !team1Players.includes(String(p.id))).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {gameType === 'doubles' && (
                  <select value={team2Players[1] || ''} onChange={(e) => setTeam2Players([team2Players[0], e.target.value])}>
                    <option value="">Select partner</option>
                    {players.filter(p => p.id !== Number(team2Players[0]) && !team1Players.includes(String(p.id))).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                <input type="number" value={team2Score} onChange={(e) => setTeam2Score(e.target.value)} placeholder="Score" min="0" />
              </div>
            </div>

            <button type="submit">Record Game</button>
          </form>
        </div>

        <div className="section">
          <h2>Recent Games</h2>
          {games.map(game => (
            <div key={game.id} className="game">
              <div className="game-header">
                {game.game_type}
                <button 
                  onClick={() => deleteGame(game.id)}
                  style={{background: '#e74c3c', padding: '5px 10px', fontSize: '12px', marginLeft: '10px'}}
                >
                  Undo
                </button>
              </div>
              <div className="game-teams">
                <div className="game-team">
                  {game.players.filter(p => p.team === 1).map(p => (
                    <div key={p.player_id}>
                      {p.player_name}: {p.rating_before} → {p.rating_after} ({p.rating_after > p.rating_before ? '+' : ''}{p.rating_after - p.rating_before})
                    </div>
                  ))}
                  <div className="score">{game.players.find(p => p.team === 1)?.score}</div>
                </div>
                <div className="vs">vs</div>
                <div className="game-team">
                  {game.players.filter(p => p.team === 2).map(p => (
                    <div key={p.player_id}>
                      {p.player_name}: {p.rating_before} → {p.rating_after} ({p.rating_after > p.rating_before ? '+' : ''}{p.rating_after - p.rating_before})
                    </div>
                  ))}
                  <div className="score">{game.players.find(p => p.team === 2)?.score}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Game
