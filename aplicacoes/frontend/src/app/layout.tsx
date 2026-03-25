import type { Metadata } from 'next';
import { ProvidersApp } from '@/componentes/taskflow/providers-app';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskFlow',
  description: 'Kanban com histórico de eventos',
};

export default function LayoutRaiz({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <ProvidersApp>{children}</ProvidersApp>
      </body>
    </html>
  );
}
