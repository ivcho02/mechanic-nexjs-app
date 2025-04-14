import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Автосервиз",
  description: "Система за управление на автосервиз",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg">
      <body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen flex flex-col">
          <header className="bg-blue-600 text-white py-4">
            <div className="container mx-auto px-4">
              <nav className="flex justify-between items-center">
                <div className="flex space-x-6">
                  <Link href="/" className="hover:text-blue-200">Начало</Link>
                  <Link href="/clients" className="hover:text-blue-200">Клиенти</Link>
                  <Link href="/repairs" className="hover:text-blue-200">Ремонти</Link>
                  <Link href="/services" className="hover:text-blue-200">Услуги</Link>
                </div>
              </nav>
            </div>
          </header>

          <main className="flex-grow">
            {children}
          </main>

          <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto px-4 text-center">
              <p>&copy; {new Date().getFullYear()} Автосервиз. Всички права запазени.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
