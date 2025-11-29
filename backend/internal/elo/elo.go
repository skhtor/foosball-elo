package elo

import "math"

const (
	KFactor       = 32
	InitialRating = 1500
)

func CalculateNewRatings(teamARating, teamBRating float64, teamAWon bool) (deltaA, deltaB int) {
	expectedA := 1.0 / (1.0 + math.Pow(10, (teamBRating-teamARating)/400.0))
	expectedB := 1 - expectedA

	var actualA, actualB float64
	if teamAWon {
		actualA, actualB = 1.0, 0.0
	} else {
		actualA, actualB = 0.0, 1.0
	}

	deltaA = int(math.Round(KFactor * (actualA - expectedA)))
	deltaB = int(math.Round(KFactor * (actualB - expectedB)))
	return
}

func AverageRating(ratings []int) float64 {
	if len(ratings) == 0 {
		return InitialRating
	}
	sum := 0
	for _, r := range ratings {
		sum += r
	}
	return float64(sum) / float64(len(ratings))
}
