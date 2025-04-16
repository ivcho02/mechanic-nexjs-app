'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales } from '@/middleware';

export default function LanguageSwitcher() {
  const pathname = usePathname();

  // Function to get path with updated locale
  const getPathWithLocale = (locale: string) => {
    const segments = pathname?.split('/') || [];

    // Replace the locale segment (first segment after root)
    if (segments.length > 1) {
      segments[1] = locale;
    }

    return segments.join('/');
  };

  // Get current locale from path
  const getCurrentLocale = () => {
    const segments = pathname?.split('/') || [];
    return segments.length > 1 ? segments[1] : 'en';
  };

  return (
    <div className="flex space-x-2">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={getPathWithLocale(locale)}
          className={`px-3 py-1 rounded text-sm ${
            getCurrentLocale() === locale
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {locale === 'en' ? '🇺🇸 EN' : '🇧🇬 BG'}
        </Link>
      ))}
    </div>
  );
}