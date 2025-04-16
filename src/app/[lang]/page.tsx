'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Dictionary, getDictionaryClient } from '@/dictionaries/client';

export default function Page() {
  const params = useParams();
  const lang = params.lang as string;
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

  if (!mounted || !dict) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{dict.home.title}</h1>
        <p className="text-xl text-gray-600 mt-2">{dict.home.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{dict.home.services}</h2>
          <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <Link
            href={`/${lang}/services`}
            className="text-blue-600 hover:text-blue-800"
          >
            {dict.home.viewAll} →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{dict.home.clients}</h2>
          <p className="mb-4">Ut enim ad minim veniam, quis nostrud exercitation.</p>
          <Link
            href={`/${lang}/clients`}
            className="text-blue-600 hover:text-blue-800"
          >
            {dict.home.viewAll} →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{dict.home.repairs}</h2>
          <p className="mb-4">Duis aute irure dolor in reprehenderit in voluptate.</p>
          <Link
            href={`/${lang}/repairs`}
            className="text-blue-600 hover:text-blue-800"
          >
            {dict.home.viewAll} →
          </Link>
        </div>
      </div>
    </div>
  );
}
