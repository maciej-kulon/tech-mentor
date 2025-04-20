# Makefile for Tech Mentor project
# This Makefile handles building and running Docker containers for the application

# Variables
DOCKER_COMPOSE := docker compose
BACKEND_DIR := backend

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make build-backend    - Build the backend Docker image"
	@echo "  make run-backend      - Run the backend container with MongoDB and show logs"
	@echo "  make stop-backend     - Stop the backend and MongoDB containers"
	@echo "  make clean-backend    - Remove backend and MongoDB containers and images"
	@echo "  make logs-backend     - View backend container logs"

# Backend targets
.PHONY: build-backend
build-backend:
	@echo "Building backend image..."
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) build

.PHONY: run-backend
run-backend: stop-backend
	@echo "Starting backend and MongoDB containers..."
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) up -d
	@echo "Showing logs..."
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) logs -f

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
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) logs -f

# Frontend targets (placeholder for future implementation)
.PHONY: build-frontend
build-frontend:
	@echo "Frontend build not implemented yet"

.PHONY: run-frontend
run-frontend:
	@echo "Frontend run not implemented yet"

# Clean all
.PHONY: clean
clean: clean-backend
	@echo "Cleaning all resources..." 