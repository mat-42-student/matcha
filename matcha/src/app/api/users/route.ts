// app/api/users/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db-utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    "SELECT * FROM users LIMIT $1 OFFSET $2",
    [limit, offset]
  );

  return NextResponse.json(rows);
}
