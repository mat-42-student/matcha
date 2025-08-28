import { pool } from "@/lib/db-utils";
import { faker } from "@faker-js/faker";

async function seed() {
  try {
    // Vérifier combien d'utilisateurs existent déjà
    const usersCount = await pool.query("SELECT COUNT(*) FROM users");
    const currentUsers = parseInt(usersCount.rows[0].count, 10);

    if (currentUsers < 500) {
      console.log(`Ajout de ${500 - currentUsers} utilisateurs…`);
      for (let i = currentUsers; i < 500; i++) {
        await pool.query(
          "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
          [
            faker.internet.userName(),
            faker.internet.email(),
            faker.internet.password(), // ⚠️ en vrai tu hacherais
          ]
        );
      }
    } else {
      console.log("Assez d’utilisateurs déjà présents.");
    }

    // Vérifier intérêts
    const interestsCount = await pool.query("SELECT COUNT(*) FROM interests");
    const currentInterests = parseInt(interestsCount.rows[0].count, 10);

    if (currentInterests < 100) {
      console.log(`Ajout de ${100 - currentInterests} intérêts…`);
      for (let i = currentInterests; i < 100; i++) {
        await pool.query("INSERT INTO interests (name) VALUES ($1)", [
          faker.word.noun(),
        ]);
      }
    } else {
      console.log("Assez d’intérêts déjà présents.");
    }

    console.log("Seeding terminé ✅");
  } catch (err) {
    console.error("Erreur seed:", err);
  } finally {
    await pool.end();
  }
}

seed();
