import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { analyzeProfileCompletion } from "@/lib/profileCompletion";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  
  const completion = await analyzeProfileCompletion(user);
  return NextResponse.json(completion);
}