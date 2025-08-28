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

.PHONY: all build run re clean fclean