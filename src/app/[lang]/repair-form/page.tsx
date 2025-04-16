'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import RepairForm from '@/components/forms/RepairForm';
import { useAuth } from '@/lib/authContext';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';

export default function RepairFormPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string || 'en';
  const [dict, setDict] = useState<Dictionary | null>(null);

  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(lang);
      setDict(dictionary);
    };
    loadDictionary();
  }, [lang]);

  useEffect(() => {
    // If not loading and either not logged in or not admin, redirect to home
    if (!loading && (!user || !isAdmin)) {
      router.push(`/${lang}`);
    }
  }, [user, isAdmin, loading, router, lang]);

  if (loading || !dict) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You need mechanic privileges to access this page.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <RepairForm />
    </Suspense>
  );
}