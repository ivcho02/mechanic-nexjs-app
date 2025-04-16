/* @next-codemod-ignore */

import Link from 'next/link';
import { getDictionary } from '@/dictionaries';

export default async function Home({ params }: { params: { lang: string } }) {
  const dict = await getDictionary(params.lang);
  const lang = params.lang;

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
