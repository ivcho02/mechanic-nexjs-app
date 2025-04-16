import { redirect } from 'next/navigation';
import { defaultLocale } from '@/middleware';

// This redirects from "/" to "/en" or "/bg" based on default locale
export default function Home() {
  redirect(`/${defaultLocale}`);
}
