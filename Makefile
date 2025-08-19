all: build run

run:
	docker compose up

re: clean all

build:
	docker compose build

down:
	docker compose down

fclean: clean
	docker system prune -a -f

clean: stop
	docker compose down -v

.PHONY: all build run re clean fclean