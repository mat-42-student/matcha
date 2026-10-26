DEV = docker compose -f docker-compose.yml -f docker-compose.dev.yml

all: build run

run:
	docker compose up

dev:
	$(DEV) up

re: clean all

build:
	docker compose build

vdown:
	$(DEV) down -v

down:
	$(DEV) down

fclean: vdown clean
	docker system prune -a -f

clean: down

lint:
	$(DEV) run --rm --no-deps matcha_server sh -c "npm install && npm run lint"

typecheck:
	$(DEV) run --rm --no-deps matcha_server sh -c "npm install && npm run typecheck"

.PHONY: all build run dev re clean fclean lint typecheck
