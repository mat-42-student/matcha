# Matcha

## Intro

Matcha is a web oriented project from the 42 post cursus formation.
The aim is to build a dating app featuring login, geoloc, search engine, chat and notifications.

Project has been made with next.js, socket.io, a postgresql database and nginx.

## Install

$ git clone
$ make
Then https://localhost:8443 (or any host url)

## Seeded profiles

On first boot, fake profiles are generated with faker (`matcha/src/lib/seed-users.ts`).
They all share the same password, set by `SEED_PASSWORD` in `.env` (default: `Matcha-Seed-42`).
It is hashed once with bcrypt and stored hashed, like any other password.
To log in as a seeded user, pick their email (e.g. from Adminer at http://localhost:8080) and use `SEED_PASSWORD`.

Changing `SEED_PASSWORD` only affects new seeds: reset the database with `make vdown && make`.

