// matcha/src/app/layout.tsx

import "./globals.css"
import { Header } from "@/components/header/Header"
import { Footer } from "@/components/header/Footer"
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import type { PublicUser } from "@/lib/types";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "@/context/SocketContext";

export const metadata = {
  title: "Matcha 🍵",
  description: "Just another dating app",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

  const user: PublicUser | null = sessionId ? await getSessionUser(sessionId) : null;

  return (
    <html lang="fr">
      <body className="h-screen flex flex-col bg-gray-100">
        <UserProvider initialUser={user}>
          <SocketProvider>
            <Header />
              <main className="flex-1 overflow-auto">
                <div className="w-full mx-auto h-full">
                  <Toaster   position="top-center" reverseOrder={false} />
                  {children}
                </div>
              </main>
            <Footer />
          </SocketProvider>
        </UserProvider>
      </body>
    </html>
  );
}
