import { pool } from "@/lib/db-utils";
import fs from "fs/promises";

export async function create_database(file) {
  try {
    const sql = await fs.readFile(file, "utf-8");
    await pool.query(sql);

    console.log(`✅ DB import successful from ${file}`);
  } catch (err) {
    console.error("❌ Error creating DB :", err);
  } finally {
    await pool.end();
  }
}