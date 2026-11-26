.PHONY: up down migrate test lint lint-frontend format build-frontend

up:
	docker compose up -d --build

down:
	docker compose down

migrate:
	cd backend && alembic upgrade head

test:
	docker compose up -d db
	@echo "Waiting for Postgres..."
	@until docker compose exec -T db pg_isready -U peblo -d peblo >/dev/null 2>&1; do sleep 1; done
	cd backend && TEST_DATABASE_URL="postgresql+psycopg://peblo:peblo@localhost:5432/peblo" PYTHONPATH=. pytest tests/ -v --cov=app --cov-report=term-missing

lint:
	ruff check backend/ api/ scripts/

lint-frontend:
	cd frontend && npm run lint

format:
	ruff format backend/ api/ scripts/

build-frontend:
	cd frontend && npm run build
