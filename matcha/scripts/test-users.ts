// scripts/test-users.ts
import { createUser, listUsers, getUserByEmail, updateUser, deleteUser } from '../src/lib/db/users';
import { pool } from '../src/lib/db-utils';

async function main() {
  try {
    console.log("=== Test CRUD Users ===");

    // 1. Création d'un user
    const newUser = await createUser({
      username: "john_doe",
      email: "john@example.com",
      passwd: "hashedpassword123", // ⚠️ à hasher en vrai avec bcrypt
      country: "France",
      city: "Paris",
      gender: "M",
      sex_pref: "F",
      bio: "Hello, I'm John!",
      fame: 10,
    });
    console.log("User créé:", newUser);

    // 2. Récupération par email
    const userByEmail = await getUserByEmail("john@example.com");
    console.log("User par email:", userByEmail);

    // 3. Update de la bio
    const updatedUser = await updateUser(newUser.id, { bio: "Nouvelle bio pour John" });
    console.log("User mis à jour:", updatedUser);

    // 4. Liste tous les users
    const allUsers = await listUsers();
    console.log("Tous les users:", allUsers);

    // 5. Suppression du user
    const deleted = await deleteUser(newUser.id);
    console.log("Suppression réussie ?", deleted);
  } catch (err) {
    console.error("Erreur lors des tests:", err);
  } finally {
    // Ferme proprement le pool (sinon le script reste ouvert)
    await pool.end();
  }
}

main();