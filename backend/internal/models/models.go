package models

import "time"

type Player struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Rating      int       `json:"rating"`
	GamesPlayed int       `json:"games_played"`
	CreatedAt   time.Time `json:"created_at"`
}

type Game struct {
	ID        int          `json:"id"`
	GameType  string       `json:"game_type"`
	CreatedAt time.Time    `json:"created_at"`
	Players   []GamePlayer `json:"players"`
}

type GamePlayer struct {
	PlayerID     int    `json:"player_id"`
	PlayerName   string `json:"player_name"`
	Team         int    `json:"team"`
	Score        int    `json:"score"`
	RatingBefore int    `json:"rating_before"`
	RatingAfter  int    `json:"rating_after"`
}

type CreatePlayerRequest struct {
	Name string `json:"name"`
}

type CreateGameRequest struct {
	GameType string           `json:"game_type"`
	Teams    []CreateGameTeam `json:"teams"`
}

type CreateGameTeam struct {
	PlayerIDs []int `json:"player_ids"`
	Score     int   `json:"score"`
}

type LeaderboardEntry struct {
	Player
	Wins   int `json:"wins"`
	Losses int `json:"losses"`
}
