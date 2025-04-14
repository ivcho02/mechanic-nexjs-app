'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ResponsiveNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return pathname === path ? 'text-blue-200' : 'hover:text-blue-200';
  };

  return (
    <header className="bg-blue-600 text-white py-4 shadow-md">
      <div className="container mx-auto px-4">
        <nav className="relative">
          {/* Desktop navigation */}
          <div className="flex justify-between items-center">
            <div className="font-bold text-xl">Автосервиз</div>

            {/* Desktop menu */}
            <div className="hidden md:flex space-x-6">
              <Link href="/" className={isActive('/')}>Начало</Link>
              <Link href="/clients" className={isActive('/clients')}>Клиенти</Link>
              <Link href="/repairs" className={isActive('/repairs')}>Ремонти</Link>
              <Link href="/services" className={isActive('/services')}>Услуги</Link>
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
                ? 'max-h-64 opacity-100 scale-y-100'
                : 'max-h-0 opacity-0 scale-y-0'
            }`}
          >
            <div className="flex flex-col py-2">
              <Link
                href="/"
                className={`px-4 py-2 ${isActive('/')}`}
                onClick={closeMenu}
              >
                Начало
              </Link>
              <Link
                href="/clients"
                className={`px-4 py-2 ${isActive('/clients')}`}
                onClick={closeMenu}
              >
                Клиенти
              </Link>
              <Link
                href="/repairs"
                className={`px-4 py-2 ${isActive('/repairs')}`}
                onClick={closeMenu}
              >
                Ремонти
              </Link>
              <Link
                href="/services"
                className={`px-4 py-2 ${isActive('/services')}`}
                onClick={closeMenu}
              >
                Услуги
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}