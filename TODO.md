# TODO

Audit du 2026-10-12. Difficulté : 🟢 < 1 h · 🟡 ~ demi-journée · 🔴 gros chantier

## 1. Bloquants évaluation (sécurité / sujet)

- [x] 🟢 **Socket : ne plus faire confiance au client.** `chat-msg` utilise `payload.from.id` → usurpation d'identité, message à n'importe qui sans match ni contrôle de blocage. `get-chat-users` permet de lire les matchs d'un autre user ; `notif` / `relation-changed` permettent d'envoyer des notifs arbitraires. Utiliser `socket.data.user`, vérifier match + block, limiter la taille des messages.
  - [matcha/src/lib/socket/socket.ts](matcha/src/lib/socket/socket.ts) (l. 143-153), [matcha/src/lib/socket/chat.ts](matcha/src/lib/socket/chat.ts)
  - Le `TODO` l. 104 de `socket.ts` : `socket.data.user` vient de la vue `my_profile` (pas de mot de passe), mais contient l'email → ne pas le renvoyer tel quel aux autres clients.
- [x] 🟢 **Upload d'images non validé** : aucun contrôle de contenu ni de taille, type MIME fourni par le client. Vérifier les magic bytes (JPEG/PNG/WebP), taille max, ignorer `file.type`.
  - [matcha/src/app/api/me/pictures/route.ts](matcha/src/app/api/me/pictures/route.ts) (l. 60-61)
- [ ] 🟢 **Mots de passe en clair en DB** : le seed insère `faker.internet.password()` sans hash.
  - [matcha/src/lib/seed-users.ts](matcha/src/lib/seed-users.ts) (l. 478)
- [ ] 🟢 **Seed : 20 profils au lieu de ≥ 500** (`MIN_USERS = 20`).
  - [ ] 🟡 Rendre le seed robuste sans réseau / sans clé Pixabay (actuellement une erreur de téléchargement interrompt la boucle). `userCount` est une string (COUNT) comparée à un nombre ; les ids d'intérêts sont supposés contigus `1..N`.
- [ ] 🟡 **Pas de username** : inscription et login se font par email, le sujet impose un username (schéma, signup, login, validateurs, seed, UI).
- [ ] 🟢 **`is_verified` jamais vérifié au login** → un compte non vérifié peut se connecter.
  - [matcha/src/lib/db/users.ts](matcha/src/lib/db/users.ts) (`loginUser`)
- [ ] 🟢 **Changement d'email sans confirmation** via `POST /api/profile` (`email` est dans les champs autorisés de `updateUser`), sans contrôle d'unicité (→ 500). Retirer `email` des champs modifiables directement. `birthdate`, `latitude`, `longitude`, `city`, `country` passent aussi sans validation (le `default` du validateur accepte tout).
  - [matcha/src/app/api/profile/route.ts](matcha/src/app/api/profile/route.ts), [matcha/src/lib/validators/serverValidator.ts](matcha/src/lib/validators/serverValidator.ts)
  - `change-request` ne valide pas non plus le format ni l'unicité de `new_email`.
- [ ] 🟢 **Unlike d'un user bloqué = déblocage** : `unlikeUser` supprime toutes les lignes `matches` entre les deux users, `block` compris.
  - [matcha/src/lib/db/likes.ts](matcha/src/lib/db/likes.ts) (l. 136)
- [ ] 🟢 **Like possible sans photo de profil** côté API (vérifié seulement en UI), et like possible vers quelqu'un qui nous a bloqué.
  - [matcha/src/app/api/match/[userId]/like/route.ts](matcha/src/app/api/match/[userId]/like/route.ts)
- [ ] 🟢/🟡 **« Signaler comme fake account » absent.**
- [ ] 🟢 **Notification « message reçu » jamais créée** en DB (type présent dans l'enum, jamais émis).
- [ ] 🟢 **Lint impossible** : `eslint` / `eslint-config-next` absents du `package.json`, script `next lint` supprimé en Next 16.
  - [ ] 🟡 Corriger ensuite les erreurs/warnings remontés (31 `any` / `eslint-disable` / `@ts-*` dans le code).
- [ ] 🟢 **Erreurs TypeScript** (`npx tsc --noEmit`) :
  - `params` synchrone dans les routes photos (voir §2)
  - [matcha/src/components/card-user/ChatCardUser.tsx](matcha/src/components/card-user/ChatCardUser.tsx) (l. 10) : `Picture` sans `id`
  - [matcha/src/lib/db/chat.ts](matcha/src/lib/db/chat.ts) (l. 41) : `getUnreadCountByUsers` non typé
- [ ] 🟢 À vérifier : la recherche ne filtre le fame que par un minimum (le sujet demande une **tranche**).
- [ ] 🟢 Orientation non renseignée (`sex_pref` / `gender` NULL) exclue des suggestions au lieu d'être traitée comme bisexuelle (`COALESCE` dans `compatible_users_from`).
  - [init-db/01-matcha.sql](init-db/01-matcha.sql) (l. 220)
- [ ] 🟢 **Empêcher l'affichage des comptes incomplets** dans les suggestions et la recherche. Ex. `b@mail.com` sans photo : la carte s'affiche mais la modale ne s'ouvre pas (`open && mainPic` dans [CardUser.tsx](matcha/src/components/card-user/CardUser.tsx) l. 86), alors que la visite est enregistrée et notifiée.
  - Filtrer en SQL dans `compatible_users_from` (utilisée par [matcha/src/lib/db/search.ts](matcha/src/lib/db/search.ts)) : au minimum une photo principale (`is_main`) et une localisation.
  - Les critères « requis » existent déjà côté JS dans [matcha/src/lib/profileCompletion.ts](matcha/src/lib/profileCompletion.ts) (genre, orientation, localisation, ≥ 1 photo, ≥ 3 tags) : décider lesquels appliquer et les garder alignés. Attention : exiger `sex_pref` contredit le sujet (orientation non renseignée = bisexuel, cf. item ci-dessus).

## 2. Bugs

- [ ] 🟢 **Suppression / changement de photo principale cassés** : `params` lu de façon synchrone (supprimé en Next 16).
  - [matcha/src/app/api/me/pictures/[id]/route.ts](matcha/src/app/api/me/pictures/[id]/route.ts), [matcha/src/app/api/me/pictures/[id]/main/route.ts](matcha/src/app/api/me/pictures/[id]/main/route.ts)
- [ ] 🟢 **Une erreur DB dans un handler socket peut crasher le serveur** : aucun try/catch dans les handlers ni dans `authUser` (promesse rejetée non gérée).
- [ ] 🟢 **`likeUser` incohérent** : doublons possibles (pas d'index unique sur la paire), re-like après match insère une nouvelle ligne, nettoyage des notifs hors transaction (`deleteNotificationsBetweenUsers` n'utilise pas le `client`), `addFame` après le COMMIT.
  - [matcha/src/lib/db/likes.ts](matcha/src/lib/db/likes.ts), [matcha/src/lib/db/notifications.ts](matcha/src/lib/db/notifications.ts)
- [ ] 🟢 `unlikeUser` envoie une notif « unlike » et retire 5 de fame même sans like préalable (le sujet ne demande la notif que pour un user connecté).
- [ ] 🟢 Notifs de visite envoyées même si l'un des deux a bloqué l'autre ([matcha/src/lib/db/views.ts](matcha/src/lib/db/views.ts)).
- [ ] 🟢 `/api/users/location` : aucune validation, pas de try/catch (coordonnée invalide → CHECK SQL → 500).
- [ ] 🟢 `/api/search` : body non validé (`ageRange` mal typé → 500).
- [ ] 🟢 **Tokens email** : token de reset loggé en clair ([password-request/route.ts](matcha/src/app/api/e-mail/password-request/route.ts) l. 22) ; anciens tokens jamais invalidés ; un reset ne supprime pas les sessions existantes.
- [ ] 🟢 `/api/users/[userId]/pics` et `/allpics` sans authentification (ni contrôle de blocage).
- [ ] 🟢 `/api/me/interests` renvoie `err.message` au client.
- [ ] 🟢 `setMainPicture` et `deleteUserPicture` : plusieurs requêtes sans transaction.

## 3. Architecture

- [ ] 🟡/🔴 **Table `matches` fourre-tout** (`like` / `match` / `block` dans un `status`) : on ne sait pas qui a bloqué qui, un block écrase un match, pas de contrainte d'unicité. Passer à `likes(from, to)` + `blocks(blocker, blocked)`, match = like réciproque. Impacte `likes.ts`, `matches.ts`, `chat.ts`, `views.ts`, les vues SQL et `compatible_users_from`.
- [ ] 🟡 **Notifications temps réel déclenchées par le client** : like / unlike / match désormais émis par la route `like` (les events socket `notif` / `relation-changed` côté client ont été supprimés). Reste : le block n'envoie rien en temps réel, et les notifs « message » (cf. §1).
- [ ] 🟢 **Bloc d'auth copié-collé dans ~30 routes** (messages FR/EN mélangés) → helper `requireUser()`.
- [ ] 🟡 **Logique métier dans `db-utils.ts`** (score, Haversine) → la sortir dans un module dédié. `completeUserInfos` fait **une requête par user** (`getMatchStatus`) → 500 requêtes par recherche. Filtre de distance fait en JS après chargement complet alors que `earthdistance` est installé.
- [ ] 🟡 (optionnel) Images en `bytea` renvoyées en base64 dans du JSON, un fetch par carte : servir en binaire avec `Content-Type` et cache.
- [ ] 🟢 **Doublons** : transport nodemailer recréé 3 fois (→ `lib/mail.ts`) ; deux politiques de mot de passe (`validateSignupData` vs `validatePassword`, cf. `TODO` dans `serverValidator.ts`) ; deux `Pool` Postgres (le seed a le sien) ; interface `Notification` dupliquée (`types.ts` / `SocketContext.tsx`) ; `postcss.config.mjs` + `postcss.config.ts`.
- [ ] 🟢 **Schéma SQL** : pas de `ON DELETE CASCADE` sur la plupart des FK (`pictures`, `matches`, `views`, `chat`, `user_interests`) ; aucun index sur `matches`, `chat`, `notifications` ; `timestamp` sans timezone ; `fame` en `float` dans la table mais `INT` dans la fonction (commentaire « DB uses 0–2000 » obsolète dans `search.ts`).
- [ ] 🟢 Sessions expirées jamais purgées ; cookie sans `maxAge` alors que la session DB dure 7 jours.

## 4. Hygiène

- [ ] 🟢 Code mort : [matcha/src/app/api/users/route.ts](matcha/src/app/api/users/route.ts), [matcha/src/lib/socket/utils.ts](matcha/src/lib/socket/utils.ts), `deleteMessage`, `getMessagesForUser`, `fetchTotalPages`, `addInterest` / `deleteInterest`, `listUsers` commenté, import `redirect` inutilisé dans `profileCompletion.ts`.
- [ ] 🟢 18 `console.log` de debug (`"errors"` dans signup, `"body: "` dans search, `picture.id` dans pics…).
- [ ] 🟢 `executeQuery` logge les paramètres en cas d'erreur (hashes, buffers d'images).
- [ ] 🟢 Géoloc IP via un service tiers appelé depuis le navigateur ([Geoloc.tsx](matcha/src/components/geoloc/Geoloc.tsx)) : un bloqueur de pub → erreur console. La faire côté serveur avec `X-Real-IP` (déjà transmis par nginx). La demande de géoloc se déclenche aussi à chaque chargement.
- [ ] 🟢 Docker : mode dev uniquement (`npm install && tsx watch` à chaque démarrage), `node:alpine` non épinglé, port Postgres exposé.
- [ ] 🟢 `productionBrowserSourceMaps: true` dans `next.config.ts`.

## Ordre conseillé

1. Les 🟢 de la section 1 + bugs `params` et try/catch sockets (éliminer les risques de note 0).
2. Installer ESLint et corriger.
3. Username.
4. Refonte `matches` + notifications côté serveur.
