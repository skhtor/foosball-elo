import { useState, useEffect } from 'react'
import Navigation from './Navigation'
import './App.css'

const API_URL = import.meta.env.DEV ? 'http://localhost:8080/api' : window.location.origin + '/api'

function Game() {
  const [players, setPlayers] = useState([])
  const [games, setGames] = useState([])
  const [gameType, setGameType] = useState('singles')
  const [team1Players, setTeam1Players] = useState([])
  const [team2Players, setTeam2Players] = useState([])
  const [winner, setWinner] = useState('team1')
  const [editingGame, setEditingGame] = useState(null)

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

    await fetch(`${API_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: gameType,
        teams: [
          { player_ids: team1Players.map(Number), score: winner === 'team1' ? 10 : 0 },
          { player_ids: team2Players.map(Number), score: winner === 'team2' ? 10 : 0 }
        ]
      })
    })

    setTeam1Players([])
    setTeam2Players([])
    setWinner('team1')
    fetchGames()
  }

  const deleteGame = async (gameId) => {
    if (!confirm('Undo this game? This will revert all rating changes.')) return
    await fetch(`${API_URL}/games/${gameId}`, {
      method: 'DELETE'
    })
    fetchGames()
  }

  const editGame = (game) => {
    setEditingGame(game)
  }

  const updateGame = async (gameId, newWinner) => {
    await fetch(`${API_URL}/games/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team1_score: newWinner === 'team1' ? 10 : 0,
        team2_score: newWinner === 'team2' ? 10 : 0
      })
    })
    setEditingGame(null)
    fetchGames()
  }

  return (
    <div className="app">
      <h1>⚽ Record Game</h1>
      <Navigation />
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
              </div>
            </div>

            <div style={{marginBottom: '15px'}}>
              <h3>Winner</h3>
              <div className="game-type">
                <label>
                  <input type="radio" value="team1" checked={winner === 'team1'} onChange={(e) => setWinner(e.target.value)} />
                  Team 1
                </label>
                <label>
                  <input type="radio" value="team2" checked={winner === 'team2'} onChange={(e) => setWinner(e.target.value)} />
                  Team 2
                </label>
              </div>
            </div>

            <button type="submit">Record Game</button>
          </form>
        </div>

        <div className="section">
          <h2>Recent Games</h2>
          {games.map(game => {
            const team1Won = game.players.find(p => p.team === 1)?.score > game.players.find(p => p.team === 2)?.score
            return (
              <div key={game.id} className="game">
                <div className="game-header">
                  {game.game_type}
                  <button 
                    className="edit"
                    onClick={() => editGame(game)}
                    style={{marginLeft: '10px'}}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete"
                    onClick={() => deleteGame(game.id)}
                    style={{marginLeft: '10px'}}
                  >
                    Undo
                  </button>
                </div>
                {editingGame?.id === game.id ? (
                  <div style={{padding: '10px', background: '#f8f9fa', borderRadius: '4px'}}>
                    <div style={{marginBottom: '10px'}}>
                      <strong>Winner:</strong>
                      <label style={{marginLeft: '15px'}}>
                        <input 
                          type="radio" 
                          name={`winner-${game.id}`}
                          value="team1"
                          defaultChecked={team1Won}
                        /> Team 1
                      </label>
                      <label style={{marginLeft: '15px'}}>
                        <input 
                          type="radio" 
                          name={`winner-${game.id}`}
                          value="team2"
                          defaultChecked={!team1Won}
                        /> Team 2
                      </label>
                    </div>
                    <button 
                      onClick={() => {
                        const newWinner = document.querySelector(`input[name="winner-${game.id}"]:checked`).value
                        updateGame(game.id, newWinner)
                      }}
                      style={{background: '#27ae60', marginRight: '10px'}}
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingGame(null)}
                      style={{background: '#95a5a6'}}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="game-teams">
                    <div className="game-team">
                      {game.players.filter(p => p.team === 1).map(p => (
                        <div key={p.player_id}>
                          {p.player_name}: {p.rating_before} → {p.rating_after} ({p.rating_after > p.rating_before ? '+' : ''}{p.rating_after - p.rating_before})
                        </div>
                      ))}
                      <div className="score">{team1Won ? 'W' : 'L'}</div>
                    </div>
                    <div className="vs">vs</div>
                    <div className="game-team">
                      {game.players.filter(p => p.team === 2).map(p => (
                        <div key={p.player_id}>
                          {p.player_name}: {p.rating_before} → {p.rating_after} ({p.rating_after > p.rating_before ? '+' : ''}{p.rating_after - p.rating_before})
                        </div>
                      ))}
                      <div className="score">{team1Won ? 'L' : 'W'}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Game
