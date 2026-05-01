'use client';

import { lazy, Suspense } from 'react';
import { AppPrincipalSkeleton } from '@/componentes/taskflow/skeletons';

const AppPrincipal = lazy(() => import('@/componentes/taskflow/app-principal'));

export function AppPrincipalLazy() {
  return (
    <Suspense fallback={<AppPrincipalSkeleton />}>
      <AppPrincipal />
    </Suspense>
  );
}
