import { useState, useEffect } from 'react'
import Navigation from './Navigation'
import './App.css'

const API_URL = import.meta.env.DEV ? 'http://localhost:8080/api' : window.location.origin + '/api'

function AddPlayer() {
  const [newPlayerName, setNewPlayerName] = useState('')
  const [players, setPlayers] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    const res = await fetch(`${API_URL}/players`)
    const data = await res.json()
    setPlayers(data)
  }

  const createPlayer = async (e) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return
    await fetch(`${API_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPlayerName })
    })
    setNewPlayerName('')
    fetchPlayers()
  }

  const deletePlayer = async (id) => {
    if (!confirm('Delete this player?')) return
    await fetch(`${API_URL}/players/${id}`, { method: 'DELETE' })
    fetchPlayers()
  }

  const startEdit = (player) => {
    setEditingId(player.id)
    setEditName(player.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveEdit = async (id) => {
    if (!editName.trim()) return
    await fetch(`${API_URL}/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName })
    })
    setEditingId(null)
    setEditName('')
    fetchPlayers()
  }

  return (
    <div className="app">
      <h1>⚽ Players</h1>
      <Navigation />
      <div className="container">
        <div className="section">
          <h2>Add Player</h2>
          <form onSubmit={createPlayer}>
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Player name"
            />
            <button type="submit">Add Player</button>
          </form>
        </div>
        <div className="section">
          <h2>All Players</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr key={p.id}>
                  <td>
                    {editingId === p.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      p.name
                    )}
                  </td>
                  <td>{Math.round(p.rating)}</td>
                  <td>
                    {editingId === p.id ? (
                      <>
                        <button onClick={() => saveEdit(p.id)}>Save</button>
                        <button onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="edit" onClick={() => startEdit(p)}>Edit</button>
                        <button className="delete" onClick={() => deletePlayer(p.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AddPlayer
