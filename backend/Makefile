.PHONY: run build migrate-up migrate-down test clean

run:
	go run cmd/api/main.go

build:
	go build -o bin/api cmd/api/main.go

migrate-up:
	psql "postgres://foosball:foosball@localhost:5432/foosball?sslmode=disable" -f ../migrations/001_init.sql

migrate-down:
	psql "postgres://foosball:foosball@localhost:5432/foosball?sslmode=disable" -c "DROP TABLE IF EXISTS game_participants, games, players CASCADE;"

test:
	go test -v ./...

clean:
	rm -rf bin/
