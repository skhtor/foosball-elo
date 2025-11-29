package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/sassoonkuyumcian/foosball-elo/internal/models"
	"github.com/sassoonkuyumcian/foosball-elo/internal/repository"
)

type Handler struct {
	repo *repository.Repository
}

func New(repo *repository.Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) CreatePlayer(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePlayerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}

	player, err := h.repo.CreatePlayer(r.Context(), req.Name)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create player")
		return
	}

	respondJSON(w, http.StatusCreated, player)
}

func (h *Handler) ListPlayers(w http.ResponseWriter, r *http.Request) {
	players, err := h.repo.ListPlayers(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch players")
		return
	}
	respondJSON(w, http.StatusOK, players)
}

func (h *Handler) CreateGame(w http.ResponseWriter, r *http.Request) {
	var req models.CreateGameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.GameType != "singles" && req.GameType != "doubles" {
		respondError(w, http.StatusBadRequest, "Game type must be 'singles' or 'doubles'")
		return
	}

	game, err := h.repo.CreateGame(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, game)
}

func (h *Handler) ListGames(w http.ResponseWriter, r *http.Request) {
	games, err := h.repo.ListGames(r.Context(), 50)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch games")
		return
	}
	respondJSON(w, http.StatusOK, games)
}

func (h *Handler) Leaderboard(w http.ResponseWriter, r *http.Request) {
	entries, err := h.repo.GetLeaderboard(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch leaderboard")
		return
	}
	respondJSON(w, http.StatusOK, entries)
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
