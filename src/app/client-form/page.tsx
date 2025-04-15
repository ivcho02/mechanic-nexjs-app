'use client';

import { Suspense } from 'react';
import ClientForm from '@/components/forms/ClientForm';

export default function ClientFormPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ClientForm />
    </Suspense>
  );
}