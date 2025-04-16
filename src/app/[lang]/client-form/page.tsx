'use client';

import { Suspense } from 'react';
import ClientForm from '@/components/forms/ClientForm';
import { useParams } from 'next/navigation';

export default function ClientFormPage() {
  const params = useParams();
  const lang = params.lang as string;

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ClientForm lang={lang} />
    </Suspense>
  );
}