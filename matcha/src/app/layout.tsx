import "./globals.css"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { cookies } from "next/headers";
import { getUserByIdFromSession } from "@/lib/db/session";
import type { PublicUser } from "@/types";
import { UserProvider } from "@/context/UserContext";


export const metadata = {
  title: "Matcha 🍵",
  description: "Just another dating app",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {


  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

  // 🔑 Appel direct DB
  const user: PublicUser | null = sessionId ? await getUserByIdFromSession(sessionId) : null;

  return (
    <html lang="fr">
      <body className="h-screen flex flex-col bg-gray-100">
        <UserProvider initialUser={user}>
            {/* on passe initialUser en prop */}
            <Header />
            {/* main empêche le scroll par défaut */}
            <main className="flex-1 overflow-hidden">
            {/* wrapper prend toute la hauteur disponible */}
            <div className="w-full max-w-5xl mx-auto h-full">
                {children}
            </div>
            </main>
            <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
