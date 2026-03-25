import type { Metadata } from 'next';
import { ProvidersApp } from '@/componentes/taskflow/providers-app';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'TaskFlow',
  description: 'Kanban com histórico de eventos',
};

export default function LayoutRaiz({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={cn("dark font-sans", geist.variable)}>
      <body className="min-h-screen antialiased">
        <ProvidersApp>{children}</ProvidersApp>
      </body>
    </html>
  );
}
