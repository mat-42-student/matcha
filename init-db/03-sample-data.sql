-- 03-sample-data.sql
-- Peupler la base Matcha avec quelques entrées de test
-- ⚠️ Ne crée pas de nouveaux "interests", utilise ceux déjà insérés en 02-interests.sql

-- 🔑 5 utilisateurs
INSERT INTO users (username, email, passwd, country, city, latitude, longitude, gender, sex_pref, bio, fame)
VALUES
  ('alice', 'alice@example.com', 'hashed_pwd_1', 'France', 'Paris', 48.8566, 2.3522, 'F', 'M', 'J’aime voyager et la photo.', 10),
  ('bob', 'bob@example.com', 'hashed_pwd_2', 'France', 'Lyon', 45.7640, 4.8357, 'M', 'F', 'Passionné de cuisine.', 20),
  ('charlie', 'charlie@example.com', 'hashed_pwd_3', 'France', 'Marseille', 43.2965, 5.3698, 'M', 'F', 'Toujours partant pour un footing.', 15),
  ('diana', 'diana@example.com', 'hashed_pwd_4', 'France', 'Toulouse', 43.6047, 1.4442, 'F', 'M', 'Grande lectrice et amoureuse des chats.', 25),
  ('eve', 'eve@example.com', 'hashed_pwd_5', 'France', 'Nice', 43.7102, 7.2620, 'F', 'M', 'Fan de sport et de danse.', 30);

-- 🔗 Associer des intérêts existants aux users
-- Ici on prend des intérêts déjà insérés (ex: Hiking, Cooking, Photography, Yoga, Reading)
INSERT INTO user_interests (user_id, interest_id)
SELECT u.id, i.id
FROM users u, interests i
WHERE (u.username, i.name) IN (
  ('alice', 'Photography'),
  ('alice', 'Hiking'),
  ('bob', 'Cooking'),
  ('charlie', 'Hiking'),
  ('diana', 'Reading'),
  ('eve', 'Yoga')
);

-- 💌 Matches
INSERT INTO matches (user1_id, user2_id, status)
SELECT u1.id, u2.id, 'accepted'
FROM users u1, users u2
WHERE (u1.username, u2.username) IN (
  ('alice', 'bob'),
  ('bob', 'diana'),
  ('charlie', 'eve'),
  ('diana', 'alice'),
  ('eve', 'charlie')
);

-- 👀 Views
INSERT INTO views (user1_id, user2_id)
SELECT u1.id, u2.id
FROM users u1, users u2
WHERE (u1.username, u2.username) IN (
  ('alice', 'charlie'),
  ('bob', 'alice'),
  ('charlie', 'bob'),
  ('diana', 'eve'),
  ('eve', 'diana')
);

-- 💬 Messages
INSERT INTO chat (sender_id, recipient_id, message)
SELECT u1.id, u2.id, m.msg
FROM (VALUES
  ('alice', 'bob', 'Salut Bob !'),
  ('bob', 'alice', 'Coucou Alice !'),
  ('charlie', 'eve', 'Tu viens courir demain ?'),
  ('diana', 'alice', 'On se capte ce week-end ?'),
  ('eve', 'charlie', 'Bien sûr !')
) AS m(sender, recipient, msg)
JOIN users u1 ON u1.username = m.sender
JOIN users u2 ON u2.username = m.recipient;

-- 🔔 Notifications
INSERT INTO notifications (user_id, message)
SELECT u.id, n.msg
FROM (VALUES
  ('alice', 'Bob a liké ton profil'),
  ('bob', 'Alice a accepté ton match'),
  ('charlie', 'Eve a vu ton profil'),
  ('diana', 'Nouvel intérêt ajouté'),
  ('eve', 'Charlie t’a envoyé un message')
) AS n(username, msg)
JOIN users u ON u.username = n.username;