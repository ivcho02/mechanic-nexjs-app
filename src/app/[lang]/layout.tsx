/* @next-codemod-ignore */

import { Inter } from 'next/font/google';
import { locales, defaultLocale } from '@/middleware';
import NavBar from '@/components/navigation/NavBar';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export async function generateStaticParams() {
  return locales.map(lang => ({ lang }));
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  // Cast params as any to bypass the type-checking
  // This is a workaround for the Next.js warning about using params.lang
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const langParam = (params as any).lang || defaultLocale;

  // Validate the language parameter
  const lang = locales.includes(langParam) ? langParam : defaultLocale;

  return (
    <html lang={lang}>
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <NavBar />
          <main className="flex-1 md:ml-64 overflow-y-auto">
            <div className="px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
