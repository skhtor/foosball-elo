package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassoonkuyumcian/foosball-elo/internal/elo"
	"github.com/sassoonkuyumcian/foosball-elo/internal/models"
)

type Repository struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreatePlayer(ctx context.Context, name string) (*models.Player, error) {
	var player models.Player
	err := r.db.QueryRow(ctx,
		`INSERT INTO players (name, rating) VALUES ($1, $2) RETURNING id, name, rating, games_played, created_at`,
		name, elo.InitialRating,
	).Scan(&player.ID, &player.Name, &player.Rating, &player.GamesPlayed, &player.CreatedAt)
	return &player, err
}

func (r *Repository) ListPlayers(ctx context.Context) ([]models.LeaderboardEntry, error) {
	rows, err := r.db.Query(ctx,
		`SELECT p.id, p.name, p.rating, p.games_played, p.created_at,
		        COUNT(CASE WHEN gp.rating_after > gp.rating_before THEN 1 END) as wins,
		        COUNT(CASE WHEN gp.rating_after < gp.rating_before THEN 1 END) as losses
		 FROM players p
		 LEFT JOIN game_participants gp ON p.id = gp.player_id
		 GROUP BY p.id
		 ORDER BY rating DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var players []models.LeaderboardEntry
	for rows.Next() {
		var p models.LeaderboardEntry
		if err := rows.Scan(&p.ID, &p.Name, &p.Rating, &p.GamesPlayed, &p.CreatedAt, &p.Wins, &p.Losses); err != nil {
			return nil, err
		}
		players = append(players, p)
	}
	return players, rows.Err()
}

func (r *Repository) GetPlayersByIDs(ctx context.Context, ids []int) (map[int]*models.Player, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name, rating, games_played, created_at FROM players WHERE id = ANY($1)`, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	players := make(map[int]*models.Player)
	for rows.Next() {
		var p models.Player
		if err := rows.Scan(&p.ID, &p.Name, &p.Rating, &p.GamesPlayed, &p.CreatedAt); err != nil {
			return nil, err
		}
		players[p.ID] = &p
	}
	return players, rows.Err()
}

func (r *Repository) CreateGame(ctx context.Context, req models.CreateGameRequest) (*models.Game, error) {
	if len(req.Teams) != 2 {
		return nil, fmt.Errorf("exactly 2 teams required")
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var allPlayerIDs []int
	for _, team := range req.Teams {
		allPlayerIDs = append(allPlayerIDs, team.PlayerIDs...)
	}

	players, err := r.GetPlayersByIDs(ctx, allPlayerIDs)
	if err != nil {
		return nil, err
	}

	team1Ratings := make([]int, len(req.Teams[0].PlayerIDs))
	for i, id := range req.Teams[0].PlayerIDs {
		team1Ratings[i] = players[id].Rating
	}

	team2Ratings := make([]int, len(req.Teams[1].PlayerIDs))
	for i, id := range req.Teams[1].PlayerIDs {
		team2Ratings[i] = players[id].Rating
	}

	deltaTeam1, deltaTeam2 := elo.CalculateNewRatings(
		elo.AverageRating(team1Ratings),
		elo.AverageRating(team2Ratings),
		req.Teams[0].Score > req.Teams[1].Score,
	)

	var gameID int
	err = tx.QueryRow(ctx, `INSERT INTO games (game_type) VALUES ($1) RETURNING id`, req.GameType).Scan(&gameID)
	if err != nil {
		return nil, err
	}

	gamePlayers := []models.GamePlayer{}
	for teamNum, team := range req.Teams {
		delta := deltaTeam1
		if teamNum == 1 {
			delta = deltaTeam2
		}

		for _, playerID := range team.PlayerIDs {
			player := players[playerID]
			newRating := player.Rating + delta

			_, err = tx.Exec(ctx,
				`INSERT INTO game_participants (game_id, player_id, team, score, rating_before, rating_after) VALUES ($1, $2, $3, $4, $5, $6)`,
				gameID, playerID, teamNum+1, team.Score, player.Rating, newRating,
			)
			if err != nil {
				return nil, err
			}

			_, err = tx.Exec(ctx, `UPDATE players SET rating = $1, games_played = games_played + 1 WHERE id = $2`, newRating, playerID)
			if err != nil {
				return nil, err
			}

			gamePlayers = append(gamePlayers, models.GamePlayer{
				PlayerID:     playerID,
				PlayerName:   player.Name,
				Team:         teamNum + 1,
				Score:        team.Score,
				RatingBefore: player.Rating,
				RatingAfter:  newRating,
			})
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &models.Game{ID: gameID, GameType: req.GameType, Players: gamePlayers}, nil
}

func (r *Repository) ListGames(ctx context.Context, limit int) ([]models.Game, error) {
	rows, err := r.db.Query(ctx,
		`SELECT g.id, g.game_type, g.created_at, gp.player_id, p.name, gp.team, gp.score, gp.rating_before, gp.rating_after
		 FROM games g
		 JOIN game_participants gp ON g.id = gp.game_id
		 JOIN players p ON gp.player_id = p.id
		 ORDER BY g.created_at DESC, g.id, gp.team
		 LIMIT $1`, limit*10,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	gamesMap := make(map[int]*models.Game)
	var gameIDs []int

	for rows.Next() {
		var gameID int
		var gameType string
		var createdAt interface{}
		var gp models.GamePlayer

		err := rows.Scan(&gameID, &gameType, &createdAt, &gp.PlayerID, &gp.PlayerName, &gp.Team, &gp.Score, &gp.RatingBefore, &gp.RatingAfter)
		if err != nil {
			return nil, err
		}

		if _, exists := gamesMap[gameID]; !exists {
			gamesMap[gameID] = &models.Game{ID: gameID, GameType: gameType, Players: []models.GamePlayer{}}
			gameIDs = append(gameIDs, gameID)
		}
		gamesMap[gameID].Players = append(gamesMap[gameID].Players, gp)
	}

	games := make([]models.Game, 0, len(gameIDs))
	for _, id := range gameIDs {
		if len(games) >= limit {
			break
		}
		games = append(games, *gamesMap[id])
	}
	return games, rows.Err()
}

func (r *Repository) GetLeaderboard(ctx context.Context) ([]models.LeaderboardEntry, error) {
	rows, err := r.db.Query(ctx,
		`SELECT p.id, p.name, p.rating, p.games_played, p.created_at,
		        COUNT(CASE WHEN gp.rating_after > gp.rating_before THEN 1 END) as wins,
		        COUNT(CASE WHEN gp.rating_after < gp.rating_before THEN 1 END) as losses
		 FROM players p
		 LEFT JOIN game_participants gp ON p.id = gp.player_id
		 GROUP BY p.id
		 ORDER BY p.rating DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []models.LeaderboardEntry
	for rows.Next() {
		var entry models.LeaderboardEntry
		err := rows.Scan(&entry.ID, &entry.Name, &entry.Rating, &entry.GamesPlayed, &entry.CreatedAt, &entry.Wins, &entry.Losses)
		if err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}
	return entries, rows.Err()
}

func (r *Repository) DeleteGame(ctx context.Context, gameID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Get all participants to revert their ratings
	rows, err := tx.Query(ctx,
		`SELECT player_id, rating_before FROM game_participants WHERE game_id = $1`,
		gameID,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	type revert struct {
		playerID     int
		ratingBefore int
	}
	var reverts []revert

	for rows.Next() {
		var r revert
		if err := rows.Scan(&r.playerID, &r.ratingBefore); err != nil {
			return err
		}
		reverts = append(reverts, r)
	}

	if len(reverts) == 0 {
		return fmt.Errorf("game not found")
	}

	// Revert each player's rating and decrement games_played
	for _, rev := range reverts {
		_, err = tx.Exec(ctx,
			`UPDATE players SET rating = $1, games_played = games_played - 1 WHERE id = $2`,
			rev.ratingBefore, rev.playerID,
		)
		if err != nil {
			return err
		}
	}

	// Delete the game (cascades to game_participants)
	_, err = tx.Exec(ctx, `DELETE FROM games WHERE id = $1`, gameID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *Repository) UpdateGame(ctx context.Context, gameID string, team1Score, team2Score int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Get game info
	var gameType string
	err = tx.QueryRow(ctx, `SELECT game_type FROM games WHERE id = $1`, gameID).Scan(&gameType)
	if err != nil {
		return fmt.Errorf("game not found")
	}

	// Get all participants with their original ratings
	rows, err := tx.Query(ctx,
		`SELECT player_id, team, rating_before FROM game_participants WHERE game_id = $1 ORDER BY team`,
		gameID,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	type participant struct {
		playerID     int
		team         int
		ratingBefore int
	}
	var participants []participant

	for rows.Next() {
		var p participant
		if err := rows.Scan(&p.playerID, &p.team, &p.ratingBefore); err != nil {
			return err
		}
		participants = append(participants, p)
	}

	// Separate by team
	var team1Players, team2Players []participant
	for _, p := range participants {
		if p.team == 1 {
			team1Players = append(team1Players, p)
		} else {
			team2Players = append(team2Players, p)
		}
	}

	// Calculate new ratings
	team1Ratings := make([]int, len(team1Players))
	for i, p := range team1Players {
		team1Ratings[i] = p.ratingBefore
	}

	team2Ratings := make([]int, len(team2Players))
	for i, p := range team2Players {
		team2Ratings[i] = p.ratingBefore
	}

	deltaTeam1, deltaTeam2 := elo.CalculateNewRatings(
		elo.AverageRating(team1Ratings),
		elo.AverageRating(team2Ratings),
		team1Score > team2Score,
	)

	// Update game_participants with new scores and ratings
	for _, p := range team1Players {
		newRating := p.ratingBefore + deltaTeam1
		_, err = tx.Exec(ctx,
			`UPDATE game_participants SET score = $1, rating_after = $2 WHERE game_id = $3 AND player_id = $4`,
			team1Score, newRating, gameID, p.playerID,
		)
		if err != nil {
			return err
		}
		// Update player's current rating
		_, err = tx.Exec(ctx,
			`UPDATE players SET rating = rating - $1 + $2 WHERE id = $3`,
			p.ratingBefore+deltaTeam1, newRating, p.playerID,
		)
		if err != nil {
			return err
		}
	}

	for _, p := range team2Players {
		newRating := p.ratingBefore + deltaTeam2
		_, err = tx.Exec(ctx,
			`UPDATE game_participants SET score = $1, rating_after = $2 WHERE game_id = $3 AND player_id = $4`,
			team2Score, newRating, gameID, p.playerID,
		)
		if err != nil {
			return err
		}
		// Update player's current rating
		_, err = tx.Exec(ctx,
			`UPDATE players SET rating = rating - $1 + $2 WHERE id = $3`,
			p.ratingBefore+deltaTeam2, newRating, p.playerID,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *Repository) DeletePlayer(ctx context.Context, playerID string) error {
	result, err := r.db.Exec(ctx, `DELETE FROM players WHERE id = $1`, playerID)
	if err != nil {
		return err
	}
	
	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("player not found")
	}
	
	return nil
}

func (r *Repository) UpdatePlayer(ctx context.Context, playerID string, name string) error {
	result, err := r.db.Exec(ctx, `UPDATE players SET name = $1 WHERE id = $2`, name, playerID)
	if err != nil {
		return err
	}
	
	if result.RowsAffected() == 0 {
		return fmt.Errorf("player not found")
	}
	
	return nil
}
