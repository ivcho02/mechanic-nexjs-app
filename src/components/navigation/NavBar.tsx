'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MenuItem } from '@/types';
import navigationData from '@/data/navigation.json';
import LanguageSwitcher from '../LanguageSwitcher';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';
import { useAuth } from '@/lib/authContext';
import { logoutUser } from '@/lib/firebase';

const NavBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dict, setDict] = useState<Dictionary | null>(null);
  const { user, isAdmin, loading } = useAuth();

  // Get locale from pathname
  const getLocaleFromPathname = () => {
    const segments = pathname?.split('/') || [];
    return segments.length > 1 ? segments[1] : 'en'; // Default to 'en' if no locale
  };

  const locale = getLocaleFromPathname();

  // Wait for client-side rendering to avoid hydration issues
  useEffect(() => {
    setMounted(true);

    // Load dictionary based on locale
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(locale);
      setDict(dictionary);
    };

    loadDictionary();
  }, [locale]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Create localized URL
  const createLocalizedUrl = (url: string) => {
    return url === '/' ? `/${locale}` : `/${locale}${url}`;
  };

  // Handle logout
  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setIsMenuOpen(false);
      router.push(`/${locale}/login`);
    }
  };

  // Icons mapping
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'users':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'wrench':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'cog':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'user-plus':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'plus-circle':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'login':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'logout':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        );
      case 'register':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    // Skip menu items based on auth state
    if (
      (item.requiresAuth && !user) ||
      (item.adminOnly && !isAdmin) ||
      (item.clientOnly && (!user || isAdmin)) || // Only show to clients (authenticated non-admin users)
      (item.guestOnly && user)
    ) {
      return null;
    }

    const localizedUrl = createLocalizedUrl(item.url);

    // Check for active path considering language prefix
    const isActive = pathname === localizedUrl ||
                    (item.url === '/' && pathname === `/${locale}`);

    // Get localized text using the key
    const itemText = dict?.nav?.[item.key as keyof typeof dict.nav] || item.text || '';

    // Special handling for logout
    if (item.key === 'logout') {
      return (
        <button
          key={item.id || index}
          onClick={handleLogout}
          className={`flex items-center px-4 py-2 mb-1 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200 w-full text-left`}
        >
          <span className="mr-3">{getIcon(item.icon)}</span>
          <span>{itemText}</span>
        </button>
      );
    }

    return (
      <Link
        key={item.id || index}
        href={localizedUrl}
        className={`flex items-center px-4 py-2 mb-1 rounded-md ${
          isActive
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        } transition-colors duration-200`}
        onClick={() => setIsMenuOpen(false)}
      >
        <span className="mr-3">{getIcon(item.icon)}</span>
        <span>{itemText}</span>
      </Link>
    );
  };

  // Custom auth menu items
  const authMenuItems: MenuItem[] = user ? [
    // For logged-in users
    {
      id: 'logout',
      text: dict?.nav?.logout || 'Logout',
      key: 'logout',
      url: '/logout',
      icon: 'logout',
      requiresAuth: true
    }
  ] : [
    // For guests
    {
      id: 'login',
      text: dict?.nav?.login || 'Login',
      key: 'login',
      url: '/login',
      icon: 'login',
      guestOnly: true
    },
    {
      id: 'register',
      text: dict?.nav?.register || 'Register',
      key: 'register',
      url: '/register',
      icon: 'register',
      guestOnly: true
    }
  ];

  // Filter main menu items based on user role
  const filteredMainMenu = navigationData.mainMenu.filter(item => {
    // Always show the home menu item
    if (item.key === 'home') return true;

    // Only admin can see admin-only items
    if ('adminOnly' in item && item.adminOnly && !isAdmin) return false;

    // Only clients (non-admin users) can see clientOnly items
    if ('clientOnly' in item && item.clientOnly && (!user || isAdmin)) return false;

    // Show appropriate items based on auth state - check if property exists before using it
    if ('requiresAuth' in item && item.requiresAuth && !user) return false;
    if ('guestOnly' in item && item.guestOnly && user) return false;

    return true;
  });

  if (!mounted || loading) {
    return null; // Prevent rendering during hydration or auth loading
  }

  const mainMenuTitle = dict?.nav?.mainMenu || 'Main Menu';
  const actionsTitle = dict?.nav?.actions || 'Quick Actions';
  const siteTitle = dict?.home?.title || 'Auto Mechanic';

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <button
          onClick={toggleMenu}
          className="p-3 bg-blue-600 rounded-full text-white shadow-lg focus:outline-none"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Desktop navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-white h-screen fixed border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">{siteTitle}</h1>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="px-4 py-2">
          <h2 className="text-xs uppercase font-semibold text-gray-500 tracking-wider mb-2">
            {mainMenuTitle}
          </h2>
          <div className="flex flex-col">
            {filteredMainMenu.map(renderMenuItem)}
          </div>
        </div>

        <div className="px-4 py-2 mt-4">
          <h2 className="text-xs uppercase font-semibold text-gray-500 tracking-wider mb-2">
            {actionsTitle}
          </h2>
          <div className="flex flex-col">
            {navigationData.secondaryMenu
              .filter(item => !item.adminOnly || isAdmin)
              .map(renderMenuItem)}
            {/* Auth menu */}
            {authMenuItems.map(renderMenuItem)}
          </div>
        </div>
      </nav>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-40 md:hidden transition-opacity duration-200 ease-in-out">
          <div className="fixed bottom-24 right-6 bg-white rounded-lg shadow-xl w-48 overflow-hidden">
            <div className="p-3 border-b border-gray-200">
              <LanguageSwitcher />
            </div>
            <div className="py-2">
              {filteredMainMenu.map(renderMenuItem)}
              <div className="border-t border-gray-200 my-2"></div>
              {navigationData.secondaryMenu
                .filter(item => !item.adminOnly || isAdmin)
                .map(renderMenuItem)}
              {authMenuItems.map(renderMenuItem)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;