# Makefile for Tech Mentor project
# This Makefile handles building and running both frontend and backend applications

# Variables
DOCKER_COMPOSE := docker compose
BACKEND_DIR := backend
FRONTEND_DIR := web

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make install          - Install dependencies for both frontend and backend"
	@echo "  make build-backend    - Build the backend Docker image"
	@echo "  make run-backend      - Run the backend container with MongoDB and show logs"
	@echo "  make stop-backend     - Stop the backend and MongoDB containers"
	@echo "  make clean-backend    - Remove backend and MongoDB containers and images"
	@echo "  make logs-backend     - View backend container logs"
	@echo "  make build-frontend   - Build the frontend for production"
	@echo "  make run-frontend     - Run the frontend development server"
	@echo "  make install-frontend - Install frontend dependencies"
	@echo "  make lint-frontend    - Lint the frontend code"
	@echo "  make dev              - Run backend in Docker + frontend locally (with auto type/endpoint generation)"
	@echo "  make restart-dev      - Restart backend in Docker + frontend locally (with auto type/endpoint generation)"
	@echo "  make run-backend-local - Run only backend locally (with auto type/endpoint generation)"
	@echo "  make extract-types    - Extract types from backend DTOs to frontend"
	@echo "  make extract-endpoints - Extract API endpoints from backend controllers to frontend"
	@echo "  make extract-all      - Extract both types and endpoints from backend to frontend"
	@echo "  make watch-all        - Watch backend files and auto-regenerate types and endpoints"
	@echo "  make stop             - Stop all running services"
	@echo "  make clean            - Clean all resources"

# Installation targets
.PHONY: install
install: install-backend install-frontend
	@echo "Installing all dependencies..."

.PHONY: install-backend
install-backend:
	@echo "Installing backend dependencies..."
	@cd $(BACKEND_DIR) && npm install

.PHONY: install-frontend
install-frontend:
	@echo "Installing frontend dependencies..."
	@cd $(FRONTEND_DIR) && npm install

# Backend targets
.PHONY: build-backend
build-backend:
	@echo "Building backend image..."
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) build

.PHONY: run-backend
run-backend: stop-backend
	@echo "Starting backend and MongoDB containers..."
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) up -d
	@echo "Backend is running at http://localhost:3000"
	@echo "MongoDB is running at mongodb://localhost:27017"
	@echo "Showing application logs..."
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) logs -f tech-mentor-backend

.PHONY: start-backend
start-backend:
	@echo "Starting backend and MongoDB containers in background..."
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) up -d
	@echo "Backend is running at http://localhost:3000"
	@echo "MongoDB is running at mongodb://localhost:27017"

.PHONY: stop-backend
stop-backend:
	@echo "Stopping backend and MongoDB containers..."
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) down

.PHONY: clean-backend
clean-backend: stop-backend
	@echo "Removing backend and MongoDB images..."
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) down --rmi all

.PHONY: logs-backend
logs-backend:
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) logs -f tech-mentor-backend

# Backend local development targets
.PHONY: run-backend-local
run-backend-local: install-backend
	@echo "Starting backend locally with auto type and endpoint generation..."
	@echo "Backend: http://localhost:3000"
	@echo "🔥 Auto type/endpoint generation enabled - changes will automatically update frontend!"
	@echo "Press Ctrl+C to stop"
	@cd $(BACKEND_DIR) && npm run dev

.PHONY: extract-types
extract-types: install-backend
	@echo "Extracting types from backend DTOs to frontend..."
	@cd $(BACKEND_DIR) && npm run extract-types
	@echo "✅ Types extracted successfully!"
	@echo "Frontend types are now available in web/src/types/generated/"

.PHONY: watch-types
watch-types: install-backend
	@echo "Starting type watcher for backend DTOs..."
	@echo "🔥 Will automatically regenerate frontend types when DTO files change"
	@echo "Press Ctrl+C to stop watching"
	@cd $(BACKEND_DIR) && npm run watch-types

# New extraction targets
.PHONY: extract-endpoints
extract-endpoints: install-backend
	@echo "Extracting API endpoints from backend controllers to frontend..."
	@cd $(BACKEND_DIR) && npm run extract-endpoints
	@echo "✅ API endpoints extracted successfully!"
	@echo "Frontend API constants are now available in web/src/types/generated/"

.PHONY: extract-all
extract-all: install-backend
	@echo "Extracting types and endpoints from backend to frontend..."
	@cd $(BACKEND_DIR) && npm run extract-all
	@echo "✅ Types and endpoints extracted successfully!"
	@echo "Frontend types and API constants are now available in web/src/types/generated/"

.PHONY: watch-all
watch-all: install-backend
	@echo "Starting watcher for backend DTOs, enums, and controllers..."
	@echo "🔥 Will automatically regenerate frontend types and endpoints when files change"
	@echo "Press Ctrl+C to stop watching"
	@cd $(BACKEND_DIR) && npm run watch-all

# Frontend targets
.PHONY: build-frontend
build-frontend: install-frontend
	@echo "Building frontend for production..."
	@cd $(FRONTEND_DIR) && npm run build

.PHONY: run-frontend
run-frontend: install-frontend
	@echo "Starting frontend development server..."
	@echo "Frontend will be available at http://localhost:5173"
	@cd $(FRONTEND_DIR) && npm run dev

.PHONY: lint-frontend
lint-frontend:
	@echo "Linting frontend code..."
	@cd $(FRONTEND_DIR) && npm run lint

.PHONY: preview-frontend
preview-frontend: build-frontend
	@echo "Starting frontend preview server..."
	@cd $(FRONTEND_DIR) && npm run preview

# Development targets (run both)
.PHONY: dev
dev: install-backend install-frontend
	@echo "Starting full development environment with Docker + auto type/endpoint generation..."
	@echo "This will start backend in Docker and frontend locally"
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:5173"
	@echo "🔥 Auto type/endpoint generation enabled - changes will automatically update frontend!"
	@echo ""
	@echo "Extracting initial types and endpoints..."
	@cd $(BACKEND_DIR) && npm run extract-all
	@echo "Starting backend with Docker..."
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) up -d
	@echo "Starting watcher in background..."
	@cd $(BACKEND_DIR) && npm run watch-all &
	@echo "Starting frontend..."
	@cd $(FRONTEND_DIR) && npm run dev

.PHONY: restart-dev
restart-dev: stop install-backend install-frontend
	@echo "Restarting full development environment with Docker + auto type/endpoint generation..."
	@echo "This will stop all services and restart backend in Docker and frontend locally"
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:5173"
	@echo "🔥 Auto type/endpoint generation enabled - changes will automatically update frontend!"
	@echo ""
	@echo "Extracting initial types and endpoints..."
	@cd $(BACKEND_DIR) && npm run extract-all
	@echo "Starting backend with Docker..."
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) up -d
	@echo "Starting watcher in background..."
	@cd $(BACKEND_DIR) && npm run watch-all &
	@echo "Starting frontend..."
	@cd $(FRONTEND_DIR) && npm run dev

.PHONY: start
start: start-backend
	@echo "Starting both services in background..."
	@echo "Use 'make run-frontend' in another terminal to start the frontend dev server"
	@echo "Or use 'make dev' to start both with frontend logs"

# Stop all services
.PHONY: stop
stop: stop-backend stop-local
	@echo "All services stopped"

.PHONY: stop-local
stop-local:
	@echo "Stopping local development processes..."
	@pkill -f "npm run dev" || true
	@pkill -f "node scripts/watch-types.js" || true
	@pkill -f "vite" || true
	@echo "Local development processes stopped"

# Clean all
.PHONY: clean
clean: clean-backend
	@echo "Cleaning all resources..."
	@echo "Removing frontend node_modules..."
	@rm -rf $(FRONTEND_DIR)/node_modules
	@rm -rf $(FRONTEND_DIR)/dist 