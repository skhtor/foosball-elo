import { Link, useLocation } from 'react-router-dom'

function Navigation() {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path === '/leaderboard' && location.pathname === '/') return true
    return location.pathname === path
  }

  const buttonStyle = (path) => ({
    background: isActive(path) ? '#2980b9' : '#3498db',
    fontWeight: isActive(path) ? 'bold' : 'normal'
  })

  return (
    <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px'}}>
      <Link to="/"><button style={buttonStyle('/')}>Leaderboard</button></Link>
      <Link to="/games"><button style={buttonStyle('/games')}>Games</button></Link>
      <Link to="/add-player"><button style={buttonStyle('/add-player')}>Players</button></Link>
    </div>
  )
}

export default Navigation
