import { fakerFR as faker } from "@faker-js/faker";
import { Pool } from 'pg';
import fs from "fs";
import path from "path";

const MAX_USERS = 10;

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
  console.log(`frCities length: ${frCities.length}`);
  const index = Math.floor(Math.random() * frCities.length);
  console.log(`city: ${JSON.stringify(frCities[index])}`);
  return frCities[index];
}

async function insertUser(pool) {
  const username = faker.person.firstName() + faker.number.int(9999);
  const gender = Math.random() < 0.5 ? 'M' : 'F';
  const city = getRandomCity();
  console.log(`city ${city}`);

  const { rows } = await pool.query(
    `INSERT INTO users (username, email, passwd, gender, bio, city, latitude, longitude) VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      username,
      username + '@' + faker.internet.domainName(),
      faker.internet.password(),
      gender,
      faker.person.bio(),
      city.name,
      city.lat,
      city.lon
    ]
  );
  return [rows[0].id, gender];
}

async function downloadPic(pool, id, picUrl) {
  try {
    await pool.query(
      "INSERT INTO pictures (user_id, url) VALUES ($1, $2)",
      [id, picUrl]
    );
  }
  catch (err) {
    console.error("Insert pic error:", err);
  }
}

async function getPixabayPictureUrls(g, page = 1) {
  const API_KEY = '52071501-9882e5a59e7f705ac0b5ae712';
  const gender = g === 'M' ? 'male' : 'female';
  const params = new URLSearchParams({
    key: API_KEY,
    q: gender,
    category: "people",
    image_type: "photo",
    per_page: MAX_USERS.toString(),
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
    return data.hits.map((hit) => hit.webformatURL);
  } catch (err) {
    console.error("getPixabayPictureUrls error:", err);
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
    if (userCount >= MAX_USERS)
      return;
    console.log("Getting pictures from Pixabay...");
    const malePics = await getPixabayPictureUrls('M');
    // malePics.push(... await getPixabayPictureUrls('M', 2));
    const femalePics = await getPixabayPictureUrls('F');
    // femalePics.push(... await getPixabayPictureUrls('F', 2));
    console.log(`Seeding ${MAX_USERS - userCount} users...`);
    for (let i = userCount; i < MAX_USERS; i++) {
      const [ id, gender ] = await insertUser(pool);
      await insertUserInterests(pool, id);
      const pic = gender === 'M' ? malePics.pop() : femalePics.pop();
      await downloadPic(pool, id, pic);
    }
    console.log("... Done");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await pool.end();
  }
}

// import fetch from "node-fetch";

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// const PIXABAY_KEY = process.env.PIXABAY_KEY;

// async function fetchPixabayImages(query: string, perPage = 5) {
//   const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(
//     query
//   )}&image_type=photo&per_page=${perPage}`;

//   const res = await fetch(url);
//   if (!res.ok) {
//     throw new Error(`Pixabay API error: ${res.status}`);
//   }
//   const data = await res.json();
//   return data.hits as { largeImageURL: string; id: number }[];
// }

// async function downloadImage(url: string) {
//   const res = await fetch(url);
//   if (!res.ok) {
//     throw new Error(`Failed to download ${url}`);
//   }
//   const buffer = await res.arrayBuffer();
//   const mimeType = res.headers.get("content-type") ?? "image/jpeg";
//   return { buffer: Buffer.from(buffer), mimeType };
// }

// async function seedPictures() {
//   const client = await pool.connect();
//   try {
//     const images = await fetchPixabayImages("portrait", 5);

//     for (const img of images) {
//       console.log(`Downloading ${img.largeImageURL}`);
//       const { buffer, mimeType } = await downloadImage(img.largeImageURL);

//       // Ici j’utilise un user_id bidon — à adapter avec tes vrais users !
//       const userId = "00000000-0000-0000-0000-000000000001";

//       await client.query(
//         `INSERT INTO pictures (user_id, data, mime_type, url, filename)
//          VALUES ($1, $2, $3, NULL, $4)`,
//         [userId, buffer, mimeType, `pixabay-${img.id}.jpg`]
//       );
//       console.log(`Inserted image for user ${userId}`);
//     }
//   } finally {
//     client.release();
//   }
// }

// seedPictures()
//   .then(() => {
//     console.log("✅ Seeding done!");
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.error("❌ Error seeding:", err);
//     process.exit(1);
//   });