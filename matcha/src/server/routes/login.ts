import { pool } from "@/lib/db/db-utils";
import bcrypt from "bcryptjs";

export async function loginUser(email: string, password: string) {
	const result = await pool.query(
		`SELECT * FROM users WHERE email = $1`,
		[email]
	);
	const user = result.rows[0];
	if (!user) return null;

	const valid = await bcrypt.compare(password, user.passwd);
	if (!valid) return null;

	return user;
}