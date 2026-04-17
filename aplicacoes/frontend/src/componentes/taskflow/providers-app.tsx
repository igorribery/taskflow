'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { clienteQuery } from '@/estado/cliente-query';

export function ProvidersApp({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={clienteQuery}>{children}</QueryClientProvider>;
}
