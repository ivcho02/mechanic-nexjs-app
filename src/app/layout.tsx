import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Механик Сервиз",
  description: "Система за управление на сервизни услуги",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-blue-600 text-white">
            <div className="container mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Механик Сервиз</h1>
                <nav>
                  <ul className="flex space-x-4">
                    <li>
                      <Link href="/" className="hover:text-blue-200">Начало</Link>
                    </li>
                    <li>
                      <Link href="/clients" className="hover:text-blue-200">Клиенти</Link>
                    </li>
                    <li>
                      <Link href="/repairs" className="hover:text-blue-200">Ремонти</Link>
                    </li>
                    <li>
                      <Link href="/services" className="hover:text-blue-200">Услуги</Link>
                    </li>
                  </ul>
                </nav>
                <Link href="/add-client" className="hover:text-blue-200">Добави клиент</Link>
              </div>
            </div>
          </header>

          <main className="flex-grow">
            {children}
          </main>

          <footer className="bg-gray-800 text-white">
            <div className="container mx-auto px-4 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Контакти</h3>
                  <p>Телефон: +359 888 888 888</p>
                  <p>Email: info@mechanicservice.bg</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Работно време</h3>
                  <p>Понеделник - Петък: 9:00 - 18:00</p>
                  <p>Събота: 9:00 - 14:00</p>
                  <p>Неделя: Почивен ден</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Адрес</h3>
                  <p>ул. Примерна 123</p>
                  <p>София, България</p>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-700 text-center">
                <p>&copy; {new Date().getFullYear()} Механик Сервиз. Всички права запазени.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
