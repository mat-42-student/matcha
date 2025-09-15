import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Pour le moment, aucune logique → on laisse juste passer la requête
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Ici tu peux même restreindre si besoin, mais par défaut
    // on l’applique à tout sauf aux fichiers statiques
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};