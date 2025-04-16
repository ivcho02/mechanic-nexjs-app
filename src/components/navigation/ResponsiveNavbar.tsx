'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '../LanguageSwitcher';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';

export default function ResponsiveNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [mounted, setMounted] = useState(false);

  // Get locale from path
  const getLocaleFromPathname = () => {
    const segments = pathname?.split('/') || [];
    return segments.length > 1 ? segments[1] : 'en'; // Default to 'en' if no locale
  };

  const locale = getLocaleFromPathname();

  // Load dictionary
  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(locale);
      setDict(dictionary);
    };

    loadDictionary();
    setMounted(true);
  }, [locale]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Create localized URL
  const createLocalizedUrl = (url: string) => {
    return `/${locale}${url}`;
  };

  const isActive = (path: string) => {
    const localizedPath = createLocalizedUrl(path);
    return pathname === localizedPath ? 'text-blue-200' : 'hover:text-blue-200';
  };

  if (!mounted || !dict) {
    return null; // Prevent rendering during hydration or if dictionary isn't loaded
  }

  return (
    <header className="bg-blue-600 text-white py-4 shadow-md">
      <div className="container mx-auto px-4">
        <nav className="relative">
          {/* Desktop navigation */}
          <div className="flex justify-between items-center">
            <div className="font-bold text-xl">{dict.home.title}</div>

            {/* Desktop menu */}
            <div className="hidden md:flex space-x-6">
              <Link href={createLocalizedUrl('/')} className={isActive('/')}>
                {dict.nav.home}
              </Link>
              <Link href={createLocalizedUrl('/clients')} className={isActive('/clients')}>
                {dict.nav.clients}
              </Link>
              <Link href={createLocalizedUrl('/repairs')} className={isActive('/repairs')}>
                {dict.nav.repairs}
              </Link>
              <Link href={createLocalizedUrl('/services')} className={isActive('/services')}>
                {dict.nav.services}
              </Link>
              <LanguageSwitcher />
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden focus:outline-none"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile navigation - with animation */}
          <div
            className={`md:hidden absolute z-10 w-full left-0 right-0 mt-2 bg-blue-700 rounded-md shadow-lg overflow-hidden transition-all duration-300 ease-in-out transform origin-top ${
              isMenuOpen
                ? 'max-h-96 opacity-100 scale-y-100'
                : 'max-h-0 opacity-0 scale-y-0'
            }`}
          >
            <div className="flex flex-col py-2">
              <Link
                href={createLocalizedUrl('/')}
                className={`px-4 py-2 ${isActive('/')}`}
                onClick={closeMenu}
              >
                {dict.nav.home}
              </Link>
              <Link
                href={createLocalizedUrl('/clients')}
                className={`px-4 py-2 ${isActive('/clients')}`}
                onClick={closeMenu}
              >
                {dict.nav.clients}
              </Link>
              <Link
                href={createLocalizedUrl('/repairs')}
                className={`px-4 py-2 ${isActive('/repairs')}`}
                onClick={closeMenu}
              >
                {dict.nav.repairs}
              </Link>
              <Link
                href={createLocalizedUrl('/services')}
                className={`px-4 py-2 ${isActive('/services')}`}
                onClick={closeMenu}
              >
                {dict.nav.services}
              </Link>
              <div className="px-4 py-2 mt-2 border-t border-blue-600">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}