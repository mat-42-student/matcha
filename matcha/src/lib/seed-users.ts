// matcha/src/server/seed-users.ts

import { faker } from "@faker-js/faker";
import { PoolClient } from 'pg';
import { executeQuery, pool } from './db/db-utils';
import { detectImageMimeType } from './validators/imageValidator';
import bcrypt from 'bcryptjs';
import fs from "fs";
import path from "path";

const MIN_USERS = 500;
const API_KEY = process.env.PIX_KEY;
// Mot de passe commun à tous les profils seedés (hashé une seule fois dans seed())
const SEED_PASSWORD = process.env.SEED_PASSWORD || "Matcha-Seed-42";
const filePath = path.join(process.cwd(), "src/data/fr-cities.json");
const frCities = JSON.parse(fs.readFileSync(filePath, "utf-8"));

interface Hit {
  id: number;
  webformatURL: string;
}

function getRandomCity() {
  const index = Math.floor(Math.random() * frCities.length);
  return frCities[index];
}

function getRandomName(sex: string) {
  const gender = sex === 'M'? 'male' : "female";
  return (faker.person.firstName(gender));
}

// ex. "Jean-Luc", "Dupont" -> "jeanluc_dupont_4821" (fits ^[A-Za-z0-9_]{3,20}$)
function getUsername(firstName: string, lastName: string) {
  const clean = (s: string) =>
    s.normalize("NFD").replace(/[^A-Za-z0-9]/g, "").toLowerCase();
  const base = `${clean(firstName)}_${clean(lastName)}`.slice(0, 14);
  return `${base}_${faker.number.int({ min: 1000, max: 99999 })}`;
}

interface SeedUser {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: 'M'|'F';
  sexPref: 'M'|'F'|'B';
  city: { name: string; lat: number; lon: number };
  birthdate: Date;
}

/**
 * Mixed orientations, so that the compatibility filter visibly excludes profiles:
 * 60% attracted to the other gender, 15% to the same gender, 25% to both
 */
function getRandomSexPref(gender: 'M'|'F'): 'M'|'F'|'B' {
  const r = Math.random();
  if (r < 0.6) return gender === 'M' ? 'F' : 'M';
  if (r < 0.75) return gender;
  return 'B';
}

function makeUser(): SeedUser {
  const gender = Math.random() < 0.5 ? 'M' : 'F';
  const firstName = getRandomName(gender);
  const lastName = faker.person.lastName();
  return {
    username: getUsername(firstName, lastName),
    firstName,
    lastName,
    email: `${firstName}.${lastName}@${faker.internet.domainName()}`
      .toLowerCase()
      .replace(/\s+/g, ""), // supprime tout espace éventuel
    gender,
    sexPref: getRandomSexPref(gender),
    city: getRandomCity(),
    birthdate: faker.date.birthdate(),
  };
}

/**
 * Inserts count users in one query. A random username / email already taken is
 * skipped (ON CONFLICT DO NOTHING), so fewer rows than requested may be returned.
 */
async function insertUsers(client: PoolClient, count: number, passwordHash: string) {
  const users = Array.from({ length: count }, makeUser);
  const { rows } = await executeQuery<{ id: string; gender: 'M'|'F' }>(
    `INSERT INTO users (username, first_name, last_name, email, passwd, gender, sex_pref, bio, city, latitude, longitude, birthdate, base_fame, last_login, is_verified)
     SELECT username, first_name, last_name, email, $1, gender, sex_pref, bio, city, latitude, longitude, birthdate, base_fame, last_login, true
       FROM unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[],
                   $10::float[], $11::float[], $12::date[], $13::int[], $14::timestamptz[])
         AS u(username, first_name, last_name, email, gender, sex_pref, bio, city, latitude, longitude, birthdate, base_fame, last_login)
     ON CONFLICT DO NOTHING
     RETURNING id, gender`,
    [
      passwordHash,
      users.map((u) => u.username),
      users.map((u) => u.firstName),
      users.map((u) => u.lastName),
      users.map((u) => u.email),
      users.map((u) => u.gender),
      users.map((u) => u.sexPref),
      users.map(() => faker.person.bio()),
      users.map((u) => u.city.name),
      users.map((u) => u.city.lat),
      users.map((u) => u.city.lon),
      users.map((u) => u.birthdate),
      users.map(() => Math.floor(Math.random() * 100)),
      users.map(() => faker.date.recent({ days: 30 })),
    ],
    client
  );
  return rows;
}

// Pixabay photos are downloaded once into this folder (gitignored) and reused by every
// seed afterwards: no network nor API key needed once the cache is filled.
const PICS_CACHE_DIR = path.join(process.cwd(), ".seed-cache");
const PICS_PER_GENDER = 100; // shared by all the seeded users (Pixabay per_page <= 200)
const DOWNLOAD_CONCURRENCY = 8;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface Picture {
  buffer: Buffer;
  mimeType: string;
}

async function getPixabayHits(g: 'M'|'F', count: number): Promise<Hit[]> {
  const params = new URLSearchParams({
    key: API_KEY as string,
    q: g === 'M' ? 'male' : 'female',
    category: "people",
    image_type: "photo",
    per_page: count.toString(),
    safesearch: "true",
  });
  const response = await fetch(`https://pixabay.com/api/?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.hits;
}

async function downloadImage(url: string): Promise<Picture> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  // same check as uploads: trust the content, not the remote Content-Type
  const mimeType = detectImageMimeType(buffer);
  if (!mimeType) {
    throw new Error(`Not an allowed image: ${url}`);
  }
  return { buffer, mimeType };
}

// Downloads the missing pictures into dir; a failed download is skipped, not fatal
async function fillPicturesCache(g: 'M'|'F', dir: string, cached: string[]) {
  if (!API_KEY) {
    console.warn("PIX_KEY not set: cannot download seed pictures");
    return;
  }
  const known = new Set(cached.map((file) => path.parse(file).name));
  const hits = (await getPixabayHits(g, PICS_PER_GENDER))
    .filter((hit) => !known.has(String(hit.id)));

  const worker = async () => {
    for (let hit = hits.pop(); hit; hit = hits.pop()) {
      try {
        const { buffer, mimeType } = await downloadImage(hit.webformatURL);
        await fs.promises.writeFile(path.join(dir, `${hit.id}.${EXTENSIONS[mimeType]}`), buffer);
      } catch (err) {
        console.error("Seed picture download error:", err);
      }
    }
  };
  await Promise.all(Array.from({ length: DOWNLOAD_CONCURRENCY }, worker));
}

async function loadPictures(g: 'M'|'F'): Promise<Picture[]> {
  const dir = path.join(PICS_CACHE_DIR, g);
  await fs.promises.mkdir(dir, { recursive: true });
  let files = await fs.promises.readdir(dir);
  if (files.length < PICS_PER_GENDER) {
    console.log(`Downloading ${g} seed pictures from Pixabay...`);
    try {
      await fillPicturesCache(g, dir, files);
    } catch (err) {
      console.error("Seed pictures error:", err);
    }
    files = await fs.promises.readdir(dir);
  }

  const pictures: Picture[] = [];
  for (const file of files) {
    const buffer = await fs.promises.readFile(path.join(dir, file));
    const mimeType = detectImageMimeType(buffer);
    if (mimeType)
      pictures.push({ buffer, mimeType });
  }
  if (pictures.length === 0)
    console.warn(`No ${g} seed pictures available: those users get no picture`);
  return pictures;
}

const INTERESTS_PER_USER = 3;
const MAX_INSERT_ATTEMPTS = 5;

function pickRandom<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

async function insertUsersInterests(client: PoolClient, userIds: string[]) {
  const { rows } = await executeQuery<{ id: number }>("SELECT id FROM interests", [], client);
  const interestIds = rows.map((r) => r.id);
  const pairs = userIds.flatMap((userId) =>
    pickRandom(interestIds, INTERESTS_PER_USER).map((interestId) => [userId, interestId] as const)
  );
  await executeQuery(
    `INSERT INTO user_interests (user_id, interest_id)
     SELECT * FROM unnest($1::uuid[], $2::int[])`,
    [pairs.map(([userId]) => userId), pairs.map(([, interestId]) => interestId)],
    client
  );
}

/**
 * Each picture is sent once into a temporary table, then copied by Postgres
 * for every user sharing it (instead of sending ~500 image buffers).
 */
async function insertUsersPictures(
  client: PoolClient, users: { id: string; gender: 'M'|'F' }[], pictures: Record<'M'|'F', Picture[]>
) {
  const all = [...pictures.M, ...pictures.F];
  if (all.length === 0)
    return;
  await executeQuery(
    `CREATE TEMP TABLE seed_pictures (idx int PRIMARY KEY, data bytea NOT NULL, mime_type text NOT NULL)
     ON COMMIT DROP`,
    [],
    client
  );
  await executeQuery(
    `INSERT INTO seed_pictures SELECT * FROM unnest($1::int[], $2::bytea[], $3::text[])`,
    [all.map((_, i) => i), all.map((p) => p.buffer), all.map((p) => p.mimeType)],
    client
  );

  // round robin over the pictures of the user's gender (F pictures come after M ones in idx)
  const assigned = users
    .map((user, i) => {
      const count = pictures[user.gender].length;
      const offset = user.gender === 'M' ? 0 : pictures.M.length;
      return count > 0 ? [user.id, offset + (i % count)] as const : null;
    })
    .filter((pair) => pair !== null);
  await executeQuery(
    `INSERT INTO pictures (user_id, data, mime_type, is_main)
     SELECT u.id, p.data, p.mime_type, true
       FROM unnest($1::uuid[], $2::int[]) AS u(id, idx)
       JOIN seed_pictures p ON p.idx = u.idx`,
    [assigned.map(([id]) => id), assigned.map(([, idx]) => idx)],
    client
  );
}

export async function seed() {
  const client = await pool.connect();
  let inTransaction = false;
  try {
    const ret = await executeQuery<{ count: string }>("SELECT COUNT(*) FROM users", [], client);
    const userCount = Number(ret.rows[0].count);
    if (userCount >= MIN_USERS)
      return;
    const remainingUsers = MIN_USERS - userCount;
    const pictures = { M: await loadPictures('M'), F: await loadPictures('F') };
    console.log(`Seeding ${remainingUsers} users...`);
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    await client.query("BEGIN");
    inTransaction = true;
    const users: { id: string; gender: 'M'|'F' }[] = [];
    // a few random usernames / emails may already be taken: retry for the missing ones
    for (let attempt = 0; users.length < remainingUsers && attempt < MAX_INSERT_ATTEMPTS; attempt++)
      users.push(...await insertUsers(client, remainingUsers - users.length, passwordHash));
    await insertUsersInterests(client, users.map((u) => u.id));
    await insertUsersPictures(client, users, pictures);
    await client.query("COMMIT");
    console.log(`... Done (${users.length} users)`);
  } catch (err) {
    if (inTransaction)
      await client.query("ROLLBACK");
    console.error("Seed error:", err);
  } finally {
    client.release();
  }
}
