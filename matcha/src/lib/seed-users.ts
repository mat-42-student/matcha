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

async function getPixabayPictureUrls(
  g: 'M'|'F', remainingUsers: number, page = 1
): Promise<string[]> {
  const nb_users = remainingUsers > 200 ? 200 : remainingUsers;
  const gender = g === 'M' ? 'male' : 'female';
  const params = new URLSearchParams({
    key: API_KEY as string,
    q: gender,
    category: "people",
    image_type: "photo",
    per_page: nb_users.toString(),
    safesearch: "true",
    page: page.toString()
  });

  const URL = `https://pixabay.com/api/?${params.toString()}`;
  try {
    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const urls = data.hits.map((hit: Hit) => hit.webformatURL);

    const remaining = remainingUsers - nb_users;
    if (remaining > 0) {
      const nextUrls = await getPixabayPictureUrls(g, remaining, page + 1);
      return urls.concat(nextUrls);
    }

    return urls;
  } catch (err) {
    console.error("getPixabayPictureUrls error:", err);
    return [];
  }
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
    const userCount = ret.rows[0].count;
    if (userCount >= MIN_USERS)
      return;
    const remainingUsers = MIN_USERS - userCount;
    console.log("Getting url pictures from Pixabay...");
    const malePics = await getPixabayPictureUrls('M', remainingUsers);
    const femalePics = await getPixabayPictureUrls('F', remainingUsers);
    console.log("... Done");
    console.log(`Seeding ${remainingUsers} users...`);
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    for (let i = userCount; i < MIN_USERS; i++) {
      const [ id, gender ] = await insertUser(pool, passwordHash);
      await insertUserInterests(pool, id);
      const urlPic = gender === 'M' ? malePics.pop() : femalePics.pop();
      await insertUserPic(pool, id, urlPic as string);
    }
    console.log("... Done");
  } catch (err) {
    console.error("Seed error:", err);
  }
}

async function downloadImage(url: string) {
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

async function insertUserPic(pool: Pool, id: string, urlPic: string) {
    const { buffer, mimeType } = await downloadImage(urlPic);

    await pool.query(
      `INSERT INTO pictures (user_id, data, mime_type, is_main)
        VALUES ($1, $2, $3, true)`,
      [id, buffer, mimeType]
    );
}