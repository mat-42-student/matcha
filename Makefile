all: build run

run:
	docker compose up

re: clean all

build:
	docker compose build

vdown:
	docker compose down -v

down:
	docker compose down

fclean: vdown clean
	docker system prune -a -f

clean: down

lint:
	docker compose run --rm --no-deps matcha_server sh -c "npm install && npm run lint"

typecheck:
	docker compose run --rm --no-deps matcha_server sh -c "npm install && npm run typecheck"

.PHONY: all build run re clean fclean lint typecheck