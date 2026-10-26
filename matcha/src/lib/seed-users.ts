// matcha/src/server/seed-users.ts

import { faker } from "@faker-js/faker";
import { Pool } from 'pg';
import { pool } from './db/db-utils';
import { detectImageMimeType } from './validators/imageValidator';
import bcrypt from 'bcryptjs';
import fs from "fs";
import path from "path";

const MIN_USERS = 20;
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

async function insertUser(pool: Pool, passwordHash: string) {
  const gender = Math.random() < 0.5 ? 'M' : 'F';
  const sexPref = 'B'

  const firstName = getRandomName(gender);
  const lastName = faker.person.lastName()
  const username = getUsername(firstName, lastName);
  const city = getRandomCity();
  const email = `${firstName}.${lastName}@${faker.internet.domainName()}`
    .toLowerCase()
    .replace(/\s+/g, ""); // supprime tout espace éventuel

  const { rows } = await pool.query(
    `INSERT INTO users (username, first_name, last_name, email, passwd, gender, sex_pref, bio, city, latitude, longitude, birthdate, fame) VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
    [
      username,
      firstName,
      lastName,
      email,
      passwordHash,
      gender,
      sexPref,
      faker.person.bio(),
      city.name,
      city.lat,
      city.lon,
      faker.date.birthdate(),
      Math.floor(Math.random() * 100)
    ]
  );
  return [rows[0].id, gender];
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

async function insertUserInterests(pool: Pool, userId: string) {
  try {
    const interestsCount = await pool.query("SELECT COUNT(*) FROM interests");
    const interests = new Set();

    while (interests.size < 3) {
      const randomInterest = Math.floor(Math.random() * Number(interestsCount.rows[0].count)) + 1;
      interests.add(randomInterest);
    }
    for (const interestId of interests) {
      await pool.query(
        "INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2)",
        [userId, interestId]
      );
    }
  } catch (err) {
    console.error("Seed interests error:", err);
  }
}

export async function seed() {
  try {
    const ret = await pool.query("SELECT COUNT(*) FROM users");
    const userCount = Number(ret.rows[0].count);
    if (userCount >= MIN_USERS)
      return;
    const remainingUsers = MIN_USERS - userCount;
    const pictures = { M: await loadPictures('M'), F: await loadPictures('F') };
    console.log(`Seeding ${remainingUsers} users...`);
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    for (let i = userCount; i < MIN_USERS; i++) {
      const [ id, gender ] = await insertUser(pool, passwordHash);
      await insertUserInterests(pool, id);
      const pics = pictures[gender as 'M'|'F'];
      if (pics.length > 0)
        await insertUserPic(pool, id, pics[i % pics.length]);
    }
    console.log("... Done");
  } catch (err) {
    console.error("Seed error:", err);
  }
}

async function insertUserPic(pool: Pool, id: string, { buffer, mimeType }: Picture) {
  await pool.query(
    `INSERT INTO pictures (user_id, data, mime_type, is_main)
      VALUES ($1, $2, $3, true)`,
    [id, buffer, mimeType]
  );
}
