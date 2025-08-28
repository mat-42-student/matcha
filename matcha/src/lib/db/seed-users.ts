import { faker } from "@faker-js/faker";
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

async function seed() {
  try {
    const usersCount = await pool.query("SELECT COUNT(*) FROM users");
    console.log("SELECT COUNT(*) FROM users : ", usersCount);
    const currentUsers = parseInt(usersCount.rows[0].count, 10);

    if (currentUsers < 500) {
      console.log(`Seeding ${500 - currentUsers} users`);
      for (let i = currentUsers; i < 500; i++) {
        await pool.query(
          "INSERT INTO users (username, email, password, gender) VALUES ($1, $2, $3, $4)",
          [
            faker.internet.username(),
            faker.internet.email(),
            faker.internet.password(), // ⚠️ en vrai tu hacherais
            i % 2 === 0 ? 'M' : 'F'
          ]
        );
      }
    } else {
      console.log("... Done");
    }
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await pool.end();
  }
}

seed();