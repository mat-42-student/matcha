INSERT INTO users (
    first_name,
    last_name,
    email,
    passwd,
    birthdate,
    country,
    city,
    latitude,
    longitude,
    gender,
    sex_pref,
    bio,
    fame
)
VALUES (
    'Jean',
    'Dupont',
    'a@mail.com',
    '$2b$10$0ePBAoJ2pOAWD2rqLlkto.TxYgbFkttKciZgGq7u6jylB1f8fMYKy',
    '1995-10-27', 
    'France',
    'Paris',
    48.8566,
    2.3522,
    'M',
    'B',
    'Passionné de développement et de bases de données.',
    50.5
);

INSERT INTO user_interests (user_id, interest_id)
SELECT id, unnest(ARRAY[1, 2, 3])
FROM users
WHERE email = 'a@mail.com';

INSERT INTO users (
    first_name,
    last_name,
    email,
    passwd,
    birthdate,
    country,
    city,
    latitude,
    longitude,
    gender,
    sex_pref,
    bio,
    fame
)
VALUES (
    'Jeanne',
    'Duponte',
    'b@mail.com',
    '$2b$10$.tWZtIGlY5qFFGHIrqfLZ.5iSGIDYY5/Wktzm5TuR5FCZ2KZzAWUS',
    '1995-10-27', 
    'France',
    'Paris',
    48.8566,
    2.3522,
    'F',
    'B',
    'I enjoy speedmetal',
    72
);

INSERT INTO user_interests (user_id, interest_id)
SELECT id, unnest(ARRAY[1, 2, 3])
FROM users
WHERE email = 'b@mail.com';