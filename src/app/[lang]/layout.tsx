/* @next-codemod-ignore */

import { Inter } from 'next/font/google';
import { locales, defaultLocale } from '@/middleware';
import NavBar from '@/components/navigation/NavBar';
import '../globals.css';
import { AuthProvider } from '@/lib/authContext';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export async function generateStaticParams() {
  return locales.map(lang => ({ lang }));
}

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  // Access language-specific metadata
  const lang = params.lang || defaultLocale;

  return {
    title: lang === 'bg' ? 'Автомеханик Услуги' : 'Auto Mechanic Service',
    description: lang === 'bg'
      ? 'Професионален автомобилен ремонт и поддръжка'
      : 'Professional car repair and maintenance',
  };
}

type LayoutProps = {
  children: React.ReactNode;
  params: { lang: string };
};

export default function RootLayout({ children, params }: LayoutProps) {
  // Validate the language parameter
  const lang = locales.includes(params.lang) ? params.lang : defaultLocale;

  return (
    <html lang={lang}>
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen">
            <NavBar />
            <main className="flex-1 md:ml-64 overflow-y-auto">
              <div className="px-6 py-8">
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
