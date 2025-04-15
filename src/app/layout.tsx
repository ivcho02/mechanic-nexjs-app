import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata, Viewport } from "next";
import ResponsiveNavbar from "@/components/ResponsiveNavbar";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export const metadata: Metadata = {
  title: "Автосервиз",
  description: "Система за управление на автосервиз",
  icons: {
    icon: '/favicon.ico',
  },
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
          <ResponsiveNavbar />

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
