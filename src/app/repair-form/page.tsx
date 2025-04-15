'use client';

import { Suspense } from 'react';
import RepairForm from '@/components/RepairForm';

export default function RepairFormPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <RepairForm />
    </Suspense>
  );
}