# Foosball Elo Rating System

Web application for tracking foosball ratings using Elo algorithm. Supports singles and doubles games with dynamic team compositions.

## Tech Stack

- **Backend**: Go 1.21+ with Chi router
- **Frontend**: React + Vite
- **Database**: PostgreSQL

## Local Development

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
cd backend
make migrate-up

# Run backend
make run

# Run frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/players` - List all players
- `POST /api/players` - Create player
- `GET /api/games` - List games
- `POST /api/games` - Record game and update ratings
- `GET /api/leaderboard` - Get current rankings

## Example API Calls

### Create a player
```bash
curl -X POST http://localhost:8080/api/players \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice"}'
```

### Record a singles game
```bash
curl -X POST http://localhost:8080/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "game_type": "singles",
    "teams": [
      {"player_ids": [1], "score": 10},
      {"player_ids": [2], "score": 8}
    ]
  }'
```

### Record a doubles game
```bash
curl -X POST http://localhost:8080/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "game_type": "doubles",
    "teams": [
      {"player_ids": [1, 2], "score": 10},
      {"player_ids": [3, 4], "score": 7}
    ]
  }'
```
