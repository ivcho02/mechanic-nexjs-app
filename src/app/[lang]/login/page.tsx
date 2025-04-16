'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { loginWithEmail } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(lang);
      setDict(dictionary);
    };

    loadDictionary();
    setMounted(true);
  }, [lang]);

  useEffect(() => {
    if (user) {
      router.push(`/${lang}`);
    }
  }, [user, router, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginWithEmail(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/${lang}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !dict) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {dict.auth?.login || 'Sign in to your account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                {dict.auth?.email || 'Email address'}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={dict.auth?.email || 'Email address'}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {dict.auth?.password || 'Password'}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={dict.auth?.password || 'Password'}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {dict.auth?.signIn || 'Sign in'}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-sm">
              <Link href={`/${lang}/register`} className="font-medium text-blue-600 hover:text-blue-500">
                {dict.auth?.registerPrompt || "Don't have an account? Register"}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}