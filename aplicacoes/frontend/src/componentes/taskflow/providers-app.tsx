'use client';

import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { clienteQuery } from '@/estado/cliente-query';
import { ChatAprendizadoSkeleton } from '@/componentes/taskflow/skeletons';

const ChatAprendizadoFlutuante = lazy(() =>
  import('@/componentes/aprendizado/chat-aprendizado-flutuante').then((modulo) => ({
    default: modulo.ChatAprendizadoFlutuante,
  })),
);

export function ProvidersApp({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={clienteQuery}>
      {children}
      <Suspense fallback={<ChatAprendizadoSkeleton />}>
        <ChatAprendizadoFlutuante />
      </Suspense>
    </QueryClientProvider>
  );
}
