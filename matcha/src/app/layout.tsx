import "./globals.css"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"


export const metadata = {
  title: "Matcha 🍵",
  description: "Just another dating app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="h-screen flex flex-col bg-gray-100">
        <Header />

        {/* main empêche le scroll par défaut */}
        <main className="flex-1 overflow-hidden">
          {/* wrapper prend toute la hauteur disponible */}
          <div className="w-full max-w-5xl mx-auto h-full">
            {children}
          </div>
        </main>

        <Footer />
      </body>
    </html>
  );
}
