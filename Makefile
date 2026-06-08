.PHONY: dev build up down logs clean install

# Development
install:
	cd frontend && npm install
	cd backend && npm install

dev:
	docker-compose up -d
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:4000"
	@echo "WebSocket: ws://localhost:4000/socket.io"

# Production
build:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

# Backend only
api:
	cd backend && npm run dev

# Frontend only
ui:
	cd frontend && npm run dev
