'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ChatAprendizadoFlutuante } from '@/componentes/aprendizado/chat-aprendizado-flutuante';
import { clienteQuery } from '@/estado/cliente-query';

export function ProvidersApp({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={clienteQuery}>
      {children}
      <ChatAprendizadoFlutuante />
    </QueryClientProvider>
  );
}
