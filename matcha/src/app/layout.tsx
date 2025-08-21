import "./globals.css"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export const metadata = {
  title: 'Matcha 🍵',
  description: 'Just another dating app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col bg-gray-100">
        <Header />

        <main className="flex-1 flex justify-center items-start p-6">
          <div className="w-full max-w-5xl">{children}</div>
        </main>

        <Footer />
      </body>
    </html>  )
}
