import { fa, fakerFR as faker } from "@faker-js/faker";
import { Pool } from 'pg';
import fs from "fs";
import path from "path";

const MIN_USERS = 10;
const API_KEY = process.env.PIX_KEY;
const filePath = path.join(process.cwd(), "src/data/fr-cities.json");
const frCities = JSON.parse(fs.readFileSync(filePath, "utf-8"));

export function getPool() {
  return new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
  });
}

function getRandomCity() {
  const index = Math.floor(Math.random() * frCities.length);
  return frCities[index];
}

function getRandomUsername(sex) {
  const gender = sex === 'M'? 'male' : "female";
  return faker.person.firstName(gender) + faker.number.int(9999);
}

async function insertUser(pool) {
  const gender = Math.random() < 0.5 ? 'M' : 'F';
  const username = getRandomUsername(gender);
  const city = getRandomCity();

  const { rows } = await pool.query(
    `INSERT INTO users (username, email, passwd, gender, bio, city, latitude, longitude, year_of_birth) VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      username,
      username + '@' + faker.internet.domainName(),
      faker.internet.password(),
      gender,
      faker.person.bio(),
      city.name,
      city.lat,
      city.lon,
      faker.date.birthdate()
    ]
  );
  return [rows[0].id, gender];
}

async function getPixabayPictureUrls(g, remainingUsers, page = 1) {
  const nb_users = remainingUsers > 200 ? 200 : remainingUsers;
  const gender = g === 'M' ? 'male' : 'female';
  const params = new URLSearchParams({
    key: API_KEY,
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
    const urls = data.hits.map(hit => hit.webformatURL);

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

async function insertUserInterests(pool, userId) {
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
  const pool = getPool();
  try {
    const ret = await pool.query("SELECT COUNT(*) FROM users");
    const userCount = ret.rows[0].count;
    if (userCount >= MIN_USERS)
      return;
    const remainingUsers = MIN_USERS - userCount;
    console.log("Getting pictures from Pixabay...");
    const malePics = await getPixabayPictureUrls('M', remainingUsers);
    const femalePics = await getPixabayPictureUrls('F', remainingUsers);
    console.log(`Seeding ${remainingUsers} users...`);
    for (let i = userCount; i < MIN_USERS; i++) {
      const [ id, gender ] = await insertUser(pool);
      await insertUserInterests(pool, id);
      const urlPic = gender === 'M' ? malePics.pop() : femalePics.pop();
      await insertUserPic(pool, id, urlPic);
    }
    console.log("... Done");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await pool.end();
  }
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}`);
  }
  const buffer = await res.arrayBuffer();
  const mimeType = res.headers.get("content-type") ?? "image/jpeg";
  return { buffer: Buffer.from(buffer), mimeType };
}

async function insertUserPic(pool, id, urlPic) {
    console.log(`Downloading ${urlPic}`);
    const { buffer, mimeType } = await downloadImage(urlPic);

    await pool.query(
      `INSERT INTO pictures (user_id, data, mime_type, is_main)
        VALUES ($1, $2, $3, true)`,
      [id, buffer, mimeType]
    );
    console.log(`Inserted image for user ${id}`);
}