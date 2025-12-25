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

type PlayerStats struct {
	TotalGames         int     `json:"total_games"`
	WinRate           float64 `json:"win_rate"`
	CurrentStreak     int     `json:"current_streak"`
	LongestWinStreak  int     `json:"longest_win_streak"`
	LongestLoseStreak int     `json:"longest_losing_streak"`
	PeakRating        int     `json:"peak_rating"`
	PeakRatingDate    *time.Time `json:"peak_rating_date"`
	AvgRatingChange   float64 `json:"avg_rating_change"`
}

type HeadToHead struct {
	OpponentID   int     `json:"opponent_id"`
	OpponentName string  `json:"opponent_name"`
	TotalGames   int     `json:"total_games"`
	Wins         int     `json:"wins"`
	Losses       int     `json:"losses"`
	WinRate      float64 `json:"win_rate"`
	LastResult   string  `json:"last_result"`
}

type RatingHistoryPoint struct {
	Date   time.Time `json:"date"`
	Rating int       `json:"rating"`
	GameID int       `json:"game_id"`
}

type RecentGame struct {
	GameID    int       `json:"game_id"`
	Date      time.Time `json:"date"`
	Won       bool      `json:"won"`
	Opponent  string    `json:"opponent"`
	GameType  string    `json:"game_type"`
}
