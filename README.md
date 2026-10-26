# Matcha

## Intro

Matcha is a web oriented project from the 42 post cursus formation.
The aim is to build a dating app featuring login, geoloc, search engine, chat and notifications.

Project has been made with next.js, socket.io, a postgresql database and nginx.

## Install

$ git clone
$ make
Then https://localhost:8443 (or any host url). Emails (verification, password reset) are caught by Mailpit at http://localhost:8025.

For development, `make dev` mounts the sources with hot reload and adds Adminer (http://localhost:8080) and the Postgres port.

## Seeded profiles

On first boot, fake profiles are generated with faker (`matcha/src/lib/seed-users.ts`).
They all share the same password, set by `SEED_PASSWORD` in `.env` (default: `Matcha-Seed-42`).
It is hashed once with bcrypt and stored hashed, like any other password.
Seeded profiles are already verified. To log in as one, pick their username (e.g. from Adminer in dev, or
`docker exec matcha_postgres psql -U alice -d matcha -c "SELECT username FROM users LIMIT 5"`) and use `SEED_PASSWORD`.

Their pictures are downloaded once from Pixabay (`PIX_KEY`) into `matcha/.seed-cache/` and reused by later seeds.

Changing `SEED_PASSWORD` only affects new seeds: reset the database with `make vdown && make`.

