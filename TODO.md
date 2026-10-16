# TODO

Audit du 2026-10-12. Difficulté : 🟢 < 1 h · 🟡 ~ demi-journée · 🔴 gros chantier

## 1. Bloquants évaluation (sécurité / sujet)

- [x] 🟢 **Socket : ne plus faire confiance au client.** `chat-msg` utilise `payload.from.id` → usurpation d'identité, message à n'importe qui sans match ni contrôle de blocage. `get-chat-users` permet de lire les matchs d'un autre user ; `notif` / `relation-changed` permettent d'envoyer des notifs arbitraires. Utiliser `socket.data.user`, vérifier match + block, limiter la taille des messages.
  - [matcha/src/lib/socket/socket.ts](matcha/src/lib/socket/socket.ts) (l. 143-153), [matcha/src/lib/socket/chat.ts](matcha/src/lib/socket/chat.ts)
  - Le `TODO` l. 104 de `socket.ts` : `socket.data.user` vient de la vue `my_profile` (pas de mot de passe), mais contient l'email → ne pas le renvoyer tel quel aux autres clients.
- [x] 🟢 **Upload d'images non validé** : aucun contrôle de contenu ni de taille, type MIME fourni par le client. Vérifier les magic bytes (JPEG/PNG/WebP), taille max, ignorer `file.type`.
  - [matcha/src/app/api/me/pictures/route.ts](matcha/src/app/api/me/pictures/route.ts) (l. 60-61)
- [x] 🟢 **Mots de passe en clair en DB** : le seed insère `faker.internet.password()` sans hash.
  - [matcha/src/lib/seed-users.ts](matcha/src/lib/seed-users.ts) (l. 55)
  - Corrigé : mot de passe commun `SEED_PASSWORD` (`.env`), hashé une fois avec bcrypt et réutilisé pour tous les profils seedés → ils sont désormais connectables (cf. README).
- [ ] 🟢 **Seed : 20 profils au lieu de ≥ 500** (`MIN_USERS = 20`).
  - [ ] 🟡 Rendre le seed robuste sans réseau / sans clé Pixabay (actuellement une erreur de téléchargement interrompt la boucle). `userCount` est une string (COUNT) comparée à un nombre ; les ids d'intérêts sont supposés contigus `1..N`.
- [x] 🟡 **Pas de username** : inscription et login se font par email, le sujet impose un username (schéma, signup, login, validateurs, seed, UI).
  - Corrigé : colonne `username` (`^[A-Za-z0-9_]{3,20}$`, unique insensible à la casse), demandée au signup, login par username **ou** email, modifiable dans le profil, affichée en `@username` sur les cards/chat et utilisée dans les notifications. Nécessite `make vdown && make`.
- [ ] 🟢 **`is_verified` jamais vérifié au login** → un compte non vérifié peut se connecter.
  - [matcha/src/lib/db/users.ts](matcha/src/lib/db/users.ts) (`loginUser`)
- [x] 🟢 **Changement d'email sans confirmation** via `POST /api/profile` (`email` est dans les champs autorisés de `updateUser`), sans contrôle d'unicité (→ 500). Retirer `email` des champs modifiables directement. `birthdate`, `latitude`, `longitude`, `city`, `country` passent aussi sans validation (le `default` du validateur accepte tout).
  - [matcha/src/app/api/profile/route.ts](matcha/src/app/api/profile/route.ts), [matcha/src/lib/validators/serverValidator.ts](matcha/src/lib/validators/serverValidator.ts)
  - `change-request` ne valide pas non plus le format ni l'unicité de `new_email`.
  - Corrigé : `email` retiré de `updateUser` (→ `updateUserEmail`, appelé uniquement par `change-confirm`), champs inconnus refusés, `birthdate` / localisation validés comme les CHECK SQL ; `change-request` valide format + unicité et invalide les anciens tokens `change` ; unicité revérifiée à la confirmation.
- [x] 🟢 **Unlike d'un user bloqué = déblocage** : `unlikeUser` supprime toutes les lignes `matches` entre les deux users, `block` compris.
  - [matcha/src/lib/db/likes.ts](matcha/src/lib/db/likes.ts) (l. 136)
  - Corrigé : le `DELETE` ne cible plus que mon `like` ou notre `match` ; si rien n'est supprimé (block, aucun like), pas de notif « unlike », pas de perte de fame, et la route renvoie le statut courant avec `success: false`.
- [x] 🟢 **Like possible sans photo de profil** côté API (vérifié seulement en UI), et like possible vers quelqu'un qui nous a bloqué.
  - [matcha/src/app/api/match/[userId]/like/route.ts](matcha/src/app/api/match/[userId]/like/route.ts)
  - Corrigé : 403 sans photo principale (`hasMainPicture`) ou en cas de block dans un sens ou l'autre ; un re-like d'un like/match existant renvoie le statut courant sans rien insérer. Toast d'erreur dans `LikeButton`.
- [x] 🟢/🟡 **« Signaler comme fake account » absent.**
  - [matcha/src/app/api/users/[userId]/report/route.ts](matcha/src/app/api/users/[userId]/report/route.ts), [matcha/src/lib/db/matches.ts](matcha/src/lib/db/matches.ts) (`reportUser`)
  - Corrigé : table `reports` (un signalement par paire) + compteur `users.report_count` ; signaler bloque aussi l'utilisateur (même transaction) ; au-delà de `REPORT_THRESHOLD` signalements distincts (`.env`, 2 par défaut), le compte disparaît des suggestions et de la recherche (`compatible_users_from`).
- [x] 🟢 **Notification « message reçu » jamais créée** en DB (type présent dans l'enum, jamais émis).
  - Corrigé : `handleChatMessage` crée la notif `message` en DB et émet `notif` au destinataire, sauf s'il a déjà la conversation ouverte ; une seule notif `message` par expéditeur (la plus récente remplace l'ancienne) ; un clic dans la cloche ouvre `/chat`.
- [x] 🟢 **Lint impossible** : `eslint` / `eslint-config-next` absents du `package.json`, script `next lint` supprimé en Next 16.
  - Corrigé : `eslint@9` + `eslint-config-next@16.4.0` en devDependencies, config flat native, `make lint` / `make typecheck` (fonctionnent site éteint).
- [x] 🟡 **Erreurs de hooks React** (`make lint`) : 17 `set-state-in-effect` + 3 `exhaustive-deps`.
  - Corrigé :
    - `SocketContext` : les setState passent dans les handlers du socket (`connect`, `relation-changed`, `chat-users`) ; reset au logout dans le cleanup ; dépend de `me.id` (une mise à jour du profil ne reconnecte plus le socket) ; `chatMsg` retiré du contexte, `ChatWindow` écoute `chat-msg` lui-même.
    - Props → state (`UsersStore`, `ProfileForm`) : resynchro pendant le rendu ; `FilterBar` : effet inutile supprimé.
    - Fetch au montage : `BrowseFromUrl` remplace `MainContent` ×1 et `Liked`/`LikeMe`/`Matches`/`Visitors` (supprimés) ; flag `cancelled` dans les effets de fetch.
    - `LikeTabs` : onglet lu dans l'URL (`?tab=`). `ChatWindow` : `key` par conversation. `useGeolocation().requestLocation()` renvoie la position (plus d'effet dans `ProfileGeoloc`).
- [x] 🟡 **Nettoyage du lint** (44 problèmes restants, objectif zéro erreur / warning) :
  - Corrigé (`make lint` : 0 problème) : `any` remplacés par les vrais types (`PublicUser`, `unknown` + narrowing dans `validateProfileField`, `keyof User` dans `users.ts`) ; `ui/tabs` passe par un contexte typé au lieu de `cloneElement` ; `ProfileInterests` remonte des noms d'intérêts (et non des ids) dans `user.interests` ; logout via `router.push`.
  - `no-explicit-any` (31 erreurs) : surtout [ProfileForm.tsx](matcha/src/components/profile/ProfileForm.tsx) (×7) et [ui/tabs.tsx](matcha/src/components/ui/tabs.tsx) (×6) ; aussi `ui/input`, `ui/textarea`, `ui/cards`, `ProfileInterests`, `ProfileTabs`, `ProfileGeoloc`, `ProfilePicturesModal`, routes `me/interests`, `me/notifications`, `profile`, `lib/db/users.ts`, `lib/gps.ts`, `profileCompletion.ts`, `serverValidator.ts`.
  - `no-unused-vars` (7) : `api/users/route.ts`, `verify-email/page.tsx`, `ProfileInterests`, `ProfileTabs`, `profileCompletion.ts` (cf. §4 code mort).
  - `no-unused-expressions` (4) : `cond && fn()` dans [ProfileInterests.tsx](matcha/src/components/profile/ProfileInterests.tsx) (l. 63), [ProfilePicturesModal.tsx](matcha/src/components/profile/ProfilePicturesModal.tsx) (l. 69, 86, 106).
  - `no-location-assign-relative-destination` : [Header.tsx](matcha/src/components/header/Header.tsx) (l. 16) → router Next.
  - [socket.ts](matcha/src/lib/socket/socket.ts) : `@ts-expect-error` sans description sur l'import `cookie` (l. 5), deux `eslint-disable no-var` devenus inutiles (l. 16, 18).
- [x] 🟢 **Erreurs TypeScript** (`npx tsc --noEmit`) :
  - Corrigé (`tsc` : 0 erreur) : `params` asynchrone dans les routes photos (voir §2) ; `ChatCardUser` stocke uniquement l'URL de l'image (`string | null`) au lieu d'un `Picture` incomplet ; `getUnreadCountByUsers` déjà typé (`UnreadMessages[]`).
- [x] 🟢 À vérifier : la recherche ne filtre le fame que par un minimum (le sujet demande une **tranche**).
  - Corrigé : tranche min/max (bornes optionnelles) sur le score brut affiché sur les cartes, validée côté client et serveur (`validateFameRange`).
- [x] 🟢 Orientation non renseignée (`sex_pref` / `gender` NULL) exclue des suggestions au lieu d'être traitée comme bisexuelle (`COALESCE` dans `compatible_users_from`).
  - [init-db/01-matcha.sql](init-db/01-matcha.sql) (l. 220)
  - Corrigé : `sex_pref` est `NOT NULL DEFAULT 'B'` (un nouvel inscrit est bisexuel tant qu'il n'a pas choisi) ; l'orientation n'est plus un critère « requis » dans `profileCompletion.ts` (6 critères au lieu de 7). `gender` reste requis (sans genre, impossible de calculer la compatibilité).
- [x] 🟢 **Empêcher l'affichage des comptes incomplets** dans les suggestions et la recherche. Ex. `b@mail.com` sans photo : la carte s'affiche mais la modale ne s'ouvre pas (`open && mainPic` dans [CardUser.tsx](matcha/src/components/card-user/CardUser.tsx) l. 86), alors que la visite est enregistrée et notifiée.
  - Filtrer en SQL dans `compatible_users_from` (utilisée par [matcha/src/lib/db/search.ts](matcha/src/lib/db/search.ts)) : au minimum une photo principale (`is_main`) et une localisation.
  - Les critères « requis » existent déjà côté JS dans [matcha/src/lib/profileCompletion.ts](matcha/src/lib/profileCompletion.ts) (genre, orientation, localisation, ≥ 1 photo, ≥ 3 tags) : décider lesquels appliquer et les garder alignés. `sex_pref` n'est plus nullable (défaut `B`, cf. item ci-dessus).

## 2. Bugs

- [x] 🟢 **Suppression / changement de photo principale cassés** : `params` lu de façon synchrone (supprimé en Next 16).
  - [matcha/src/app/api/me/pictures/[id]/route.ts](matcha/src/app/api/me/pictures/[id]/route.ts), [matcha/src/app/api/me/pictures/[id]/main/route.ts](matcha/src/app/api/me/pictures/[id]/main/route.ts)
  - Corrigé : `await context.params` ; `setMainPicture` / `deleteUserPicture` en transaction, 404 si la photo n'appartient pas à l'utilisateur (avant, un id étranger retirait la photo principale) ; promotion de la plus ancienne photo restante à la suppression de la principale.
- [x] 🟢 **Une erreur DB dans un handler socket peut crasher le serveur** : aucun try/catch dans les handlers ni dans `authUser` (promesse rejetée non gérée).
  - Corrigé : handlers enregistrés via `on()` (try/catch), try/catch dans `authUser` et à la connexion, `updateLastLogin` du disconnect catché, listener `error` sur le pool `pg` (une connexion inactive coupée ne tue plus le process).
- [x] 🟢 **`likeUser` incohérent** : doublons possibles (pas d'index unique sur la paire), re-like après match insère une nouvelle ligne, nettoyage des notifs hors transaction (`deleteNotificationsBetweenUsers` n'utilise pas le `client`), `addFame` après le COMMIT.
  - [matcha/src/lib/db/likes.ts](matcha/src/lib/db/likes.ts), [matcha/src/lib/db/notifications.ts](matcha/src/lib/db/notifications.ts)
  - Corrigé : index unique `matches_pair_idx` sur la paire non ordonnée ; `likeUser` verrouille la ligne de la paire (`FOR UPDATE`) et ne fait rien si déjà liké / matché / bloqué (renvoie `null`), `INSERT … ON CONFLICT DO NOTHING` + relecture en cas de like simultané ; nettoyage des notifs et `addFame` dans la transaction (aussi pour `unlikeUser`).
- [x] 🟢 `unlikeUser` envoie une notif « unlike » même pour un simple like (le sujet ne demande la notif que pour un user connecté). Le cas « sans like préalable » est corrigé.
  - Corrigé : `unlikeUser` renvoie le statut supprimé (`RETURNING status`) ; notif « unlike » + toast seulement pour un unmatch ; pour un simple like, la notif « liked you » est retirée et seul `relation-changed` est envoyé (mise à jour silencieuse de l'UI). Fame −5 dans les deux cas.
- [x] 🟢 Notifs de visite envoyées même si l'un des deux a bloqué l'autre ([matcha/src/lib/db/views.ts](matcha/src/lib/db/views.ts)).
  - Corrigé : `recordProfileView` fait `INSERT … SELECT … WHERE NOT EXISTS (block)` ; en cas de blocage dans un sens ou l'autre, rien n'est enregistré (ni visite, ni fame, ni notif DB, ni event socket).
- [x] 🟢 `/api/users/location` : aucune validation, pas de try/catch (coordonnée invalide → CHECK SQL → 500).
  - Corrigé : route morte (seul appelant `components/geoloc/Geoloc.tsx`, monté nulle part) supprimée avec `updateUserLocationBySession`. La localisation passe par `/api/profile` (`ProfileGeoloc`), déjà validée par `validateProfileField`.
- [x] 🟢 `/api/search` : body non validé (`ageRange` mal typé → 500).
  - Corrigé : `validateSearchCriteria` (serverValidator) valide tout le body (objet, `distance` ≥ 0, `ageRange` = 2 entiers 18–100 avec min ≤ max, `fameRange`, `interests` ∈ similar/custom, `customInterests` = tableau de strings) → 400 ; JSON invalide → 400. Côté client : toast d'erreur au lieu de `setResults(undefined)`, validation des âges dans `SearchForm` comme pour la fame.
- [x] 🟢 **Tokens email** : token de reset loggé en clair ([password-request/route.ts](matcha/src/app/api/e-mail/password-request/route.ts) l. 22) ; anciens tokens jamais invalidés ; un reset ne supprime pas les sessions existantes.
  - Corrigé : `console.log` du token supprimé ; une nouvelle demande de reset supprime les anciens tokens `password_reset` du user (comme `change-request` le fait déjà pour `change`) ; un reset réussi supprime tous les tokens `password_reset` du user et toutes ses sessions (`deleteSessionsForUser`).
- [x] 🟢 `/api/users/[userId]/pics` et `/allpics` sans authentification (ni contrôle de blocage).
  - Corrigé : session requise (401) ; `userId` validé (`isValidUuid`, 400 au lieu d'une 500 Postgres) ; `getVisibleMainPicture` / `getAllPicturesButMain(userId, viewerId)` filtrent en SQL si un block existe dans un sens ou l'autre → 204 (comme « pas de photo », pas de fuite). `console.log(picture.id)` retiré, 500 en JSON.
- [x] 🟢 `/api/me/interests` renvoie `err.message` au client.
- [x] 🟢 `setMainPicture` et `deleteUserPicture` : plusieurs requêtes sans transaction.
  - Corrigé : transactions déjà en place (fix `params`) mais requêtes concurrentes non sérialisées (2 « set main » → violation de l'index unique → 500 ; suppression de la principale + d'une autre → plus de photo principale ; uploads simultanés → > 5 photos ou 2 principales). `lockUserPictures` (`SELECT … FROM users … FOR UPDATE`) en tête de `setMainPicture`, `deleteUserPicture` et `addUserPicture` (désormais transactionnel : re-compte sous verrou → `null` si plein, `is_main` calculé dans l'INSERT). `MAX_PICTURES` exporté et utilisé par la route.
- [x] 🟢 `POST /api/login` : `req.formData()` non protégé → un body qui n'est pas du form-data (ex. JSON) donne une 500 au lieu d'une 400 ([login/route.ts](matcha/src/app/api/login/route.ts)).
  - Corrigé : `req.formData().catch(() => null)` (comme `me/pictures`) ; champs vérifiés avec `typeof === "string"` au lieu de `as string` (un champ envoyé comme fichier donnait aussi une 500) → 400 « Missing fields ».
- [x] 🟢 `POST /api/signup` : même problème (`req.formData()` non protégé, champs castés `as string`) ([signup/route.ts](matcha/src/app/api/signup/route.ts)).
  - Corrigé : même traitement ; un champ absent ou non textuel devient `""` et est rejeté par `validateSignupData` → 400 avec le détail des erreurs par champ.

## 3. Architecture

- [x] 🟡/🔴 **Table `matches` fourre-tout** (`like` / `match` / `block` dans un `status`) : on ne sait pas qui a bloqué qui, un block écrase un match, pas de contrainte d'unicité. Passer à `likes(from, to)` + `blocks(blocker, blocked)`, match = like réciproque. Impacte `likes.ts`, `matches.ts`, `chat.ts`, `views.ts`, les vues SQL et `compatible_users_from`.
  - Corrigé : tables `likes(liker_id, liked_id)` et `blocks(blocker_id, blocked_id)` (PK sur la paire orientée, `CHECK` anti-soi-même) ; vue `user_matches` (une ligne par sens) ; fonctions SQL `is_blocked(a, b)` (remplace les 7 `NOT EXISTS … status = 'block'` copiés-collés) et `like_status(me, other)` (mêmes valeurs que `LikeStatus`, UI inchangée). Un unmatch supprime les deux likes (la relation repart de zéro) ; un block supprime les likes dans les deux sens. `matches.ts` renommé `blocks.ts` (`getMatchesForUser` déplacé dans `likes.ts`).
  - Au passage : un block répété retirait 5 de fame à chaque fois (désormais seulement au premier) ; deux likes simultanés A→B / B→A ne détectaient pas le match → `lockUserPair` (`FOR NO KEY UPDATE` sur les deux users, ordre fixe) en tête de `likeUser`, `unlikeUser`, `blockUser` et `reportUser`. Nécessite `make vdown && make`.
- [x] 🟢/🟡 **Système d'unblock** : aucun moyen de débloquer quelqu'un. Route `DELETE /api/match/[userId]/block` (supprime la ligne `blocks` où je suis `blocker_id`, jamais celle de l'autre), liste « utilisateurs bloqués » dans le profil avec un bouton. Les likes supprimés au block ne sont pas restaurés.
  - Corrigé : `unblockUser` / `getBlockedUsers` ([blocks.ts](matcha/src/lib/db/blocks.ts)) ; `DELETE /api/match/[userId]/block` (404 si je n'avais pas bloqué) ; `GET /api/me/blocks` ; onglet « Blocked » du profil ([ProfileBlocked.tsx](matcha/src/components/profile/ProfileBlocked.tsx)) avec confirmation. Débloquer rend les 5 points de fame retirés au block (sinon bloquer / débloquer en boucle viderait la fame de la cible). Si l'autre m'a aussi bloqué, son block reste actif. `userId` validé (`isValidUuid`) sur `POST` et `DELETE`.
- [x] 🟢 **`GET /api/chat/[userId]` sans contrôle de relation** : `getConversation` ne vérifie ni match ni block → l'historique reste lisible (et est marqué comme lu) après un unmatch ou un block. Réutiliser `getChatPartner` (ou `user_matches` + `is_blocked`) → 403.
  - Corrigé : `getChatPartner` en tête de la route → 403 sans match ou en cas de block, 400 si `userId` mal formé, 500 en JSON. Conversation vide : `[]` au lieu d'une 204 sans corps, qui faisait planter `res.json()` dans `ChatWindow` (erreur console à chaque conversation vide) ; `ChatWindow` affiche une conversation vide sur une réponse non-OK.
- [ ] 🟢 **Le block ne nettoie pas les notifications existantes** : les « X liked you » / « viewed your profile » de l'utilisateur bloqué restent dans la cloche. `deleteAllNotificationsBetweenUsers(a, b, client)` dans `insertBlock` ([blocks.ts](matcha/src/lib/db/blocks.ts)).
- [ ] 🟡 **Notifications temps réel déclenchées par le client** : like / unlike / match désormais émis par la route `like` (les events socket `notif` / `relation-changed` côté client ont été supprimés). Les notifs « message » sont émises par le serveur socket. Reste : le block n'envoie rien en temps réel.
- [x] 🟢 **Bloc d'auth copié-collé dans ~30 routes** (messages FR/EN mélangés) → helper `requireUser()`.
- [ ] 🟡 **Logique métier dans `db-utils.ts`** (score, Haversine) → la sortir dans un module dédié. `completeUserInfos` fait **une requête par user** (`getMatchStatus`) → 500 requêtes par recherche. Filtre de distance fait en JS après chargement complet alors que `earthdistance` est installé.
- [x] 🟢 (optionnel) Images en `bytea` renvoyées en base64 dans du JSON, un fetch par carte : servir en binaire avec `Content-Type` et cache.
  - Corrigé : `GET /api/pictures/:id` sert les octets (`Content-Type` déduit des magic bytes, `Cache-Control: private, max-age=3600`, `Vary: Cookie`, contrôle du blocage) ; le seed valide aussi le type par magic bytes ; `/api/users/:id/pics` et `/api/me/pictures/main` redirigent (302) vers cette route ou vers l'avatar par défaut ; les routes JSON ne renvoient plus que les ids ; les composants utilisent l'URL directement en `src` (plus de `useEffect` ni de data URL).
- [x] 🟢 **Doublons** : transport nodemailer recréé 3 fois (→ `lib/mail.ts`) ; deux politiques de mot de passe (`validateSignupData` vs `validatePassword`, cf. `TODO` dans `serverValidator.ts`) ; deux `Pool` Postgres (le seed a le sien) ; interface `Notification` dupliquée (`types.ts` / `SocketContext.tsx`) ; `postcss.config.mjs` + `postcss.config.ts`.
  - Corrigé : `sendMail()` dans `lib/mail.ts` (un seul transport) ; `validatePassword` est l'unique politique (8+, majuscule, minuscule, chiffre, pas courante), réutilisée par `validateSignupData`, et `clientValidator` aligné ; le seed utilise le `pool` de `db-utils` ; `Notification` importée depuis `types.ts` ; `postcss.config.ts` (config Tailwind 3 avec `autoprefixer` non installé) supprimé.
- [x] 🟢 **Schéma SQL** : pas de `ON DELETE CASCADE` sur la plupart des FK (`pictures`, `matches`, `views`, `chat`, `user_interests`) ; aucun index sur `matches`, `chat`, `notifications` ; `timestamp` sans timezone ; `fame` en `float` dans la table mais `INT` dans la fonction.
  - Corrigé : toutes les FK en `ON DELETE CASCADE` ; index sur `matches` (paire + `user2_id`), `chat` (conversation + non lus du destinataire), `notifications` (`target_id, created_at`), `views.seen_by`, `reports.reported_id` ; toutes les dates en `timestamptz` ; `fame` en `int NOT NULL` borné 0–100 (comme `addFame`). Nécessite `make vdown && make`.
- [x] 🟢 Sessions expirées jamais purgées ; cookie sans `maxAge` alors que la session DB dure 7 jours.
  - Corrigé : `createSession` purge les sessions expirées à chaque login ; cookie `maxAge` de 7 jours, aligné sur `expires_at`.

## 4. Hygiène

- [x] 🟢 Code mort : [matcha/src/app/api/users/route.ts](matcha/src/app/api/users/route.ts), [matcha/src/lib/socket/utils.ts](matcha/src/lib/socket/utils.ts), `deleteMessage`, `getMessagesForUser`, `fetchTotalPages`, `addInterest` / `deleteInterest`, `listUsers` commenté, import `redirect` inutilisé dans `profileCompletion.ts`.
- [ ] 🟢 18 `console.log` de debug (`"errors"` dans signup, `"body: "` dans search, `picture.id` dans pics…).
- [ ] 🟢 `executeQuery` logge les paramètres en cas d'erreur (hashes, buffers d'images).
- [ ] 🟢 `userId` non validé (`isValidUuid`) dans `match/[userId]/like` et `match/[userId]/views` → un id mal formé donne une 500 Postgres au lieu d'une 400 (fait seulement pour `pics`, `allpics`, `report`, `block`, `chat`).
- [ ] 🟢 `make typecheck` échoue sur des types générés périmés (`.next/types/validator.ts` référence `api/users/route` et `api/users/location/route`, supprimées) → vider `.next/types` (ou `.next`).
- [ ] 🟢 Géoloc IP via un service tiers appelé depuis le navigateur ([Geoloc.tsx](matcha/src/components/geoloc/Geoloc.tsx)) : un bloqueur de pub → erreur console. La faire côté serveur avec `X-Real-IP` (déjà transmis par nginx). La demande de géoloc se déclenche aussi à chaque chargement.
- [ ] 🟢 Docker : mode dev uniquement (`npm install && tsx watch` à chaque démarrage), `node:alpine` non épinglé, port Postgres exposé.
- [ ] 🟢 `productionBrowserSourceMaps: true` dans `next.config.ts`.

## 5. UI

- [ ] 🟡 **Refonte de l'UI du menu du profil utilisateur.**
  - [matcha/src/components/profile/ProfileTabs.tsx](matcha/src/components/profile/ProfileTabs.tsx)

## Ordre conseillé

1. Les 🟢 de la section 1 + bugs `params` et try/catch sockets (éliminer les risques de note 0).
2. Corriger le lint (`make lint`) : hooks React d'abord, puis le reste.
3. ~~Username.~~
4. Refonte `matches` + notifications côté serveur.
