# Useful links
https://trello.com/b/8kqH6Lnv

https://dbdiagram.io/d/matcha-66c45599a346f9518c8b4959

https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage


# Database

## reset DB
launch project with `make vdown ; make`

## explore DB

### ✨brand new adminer container✨
http://localhost:8080/
- system `postgresql`
- server `postgres:5432`
- user `alice`
- pass `caglisse`
- database `matcha`

### old fashioned way:
`docker exec -it postgres psql -U alice -d matcha`

### Mailpit
http://localhost:8025/