import { faker } from "@faker-js/faker";
import { Pool } from 'pg';

function getPool() {
  return new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
  });
}

async function insertUser(pool: Pool) {
  const username = faker.internet.username();
  const gender = Math.random() < 0.5 ? 'M' : 'F';
  const { rows } = await pool.query(
    "INSERT INTO users (username, email, passwd, gender) VALUES ($1, $2, $3, $4) RETURNING id",
    [
      username,
      username + '@' + faker.internet.domainName(),
      faker.internet.password(),
      gender
    ]
  );
  return [rows[0].id, gender];
}

async function insertPic(pool: Pool, id: number, picUrl: string) {
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

async function getPixabayPics(g: string, page: number = 1) {
  const API_KEY = '52071501-9882e5a59e7f705ac0b5ae712';
  const gender = g === 'M' ? 'male' : 'female';
  const params = new URLSearchParams({
    key: API_KEY,
    q: gender,
    category: "people",
    image_type: "photo",
    per_page: "150",
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
    return data.hits.map((hit: any) => hit.webformatURL);
  } catch (err) {
    console.error("getPixabayPics error:", err);
  }
}

async function insertUserInterests(pool: Pool, userId: number) {
  try {
    const interestsCount = await pool.query("SELECT COUNT(*) FROM interests");
    const interests = new Set<number>();

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

async function seed() {
  const pool = getPool();
  const malePics = await getPixabayPics('M');
  malePics.push(... await getPixabayPics('M', 2));
  const femalePics = await getPixabayPics('F');
  femalePics.push(... await getPixabayPics('F', 2));
  // console.log(malePics, "size: ", malePics.length);
  try {
    const ret = await pool.query("SELECT COUNT(*) FROM users");
    const userCount = ret.rows[0].count;
    if (userCount < 500) {
      console.log(`Seeding ${500 - userCount} users...`);
      for (let i = userCount; i < 500; i++) {
        const [ id, gender ] = await insertUser(pool);
        await insertUserInterests(pool, id);
        const pic = gender === 'M' ? malePics.pop() : femalePics.pop();
        await insertPic(pool, id, pic);
      }
    } 
    console.log("... Done");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await pool.end();
  }
}

seed();