'use client';

import type { CSSProperties } from 'react';
import { Drawer } from 'vaul';
import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatAprendizadoPainel } from '@/componentes/aprendizado/chat-aprendizado-painel';

/**
 * Botão fixo (canto inferior direito) + drawer lateral com o chat Ollama.
 * Biblioteca: [vaul](https://github.com/emilkowalski/vaul) (drawer usado pelo ecossistema shadcn).
 */
export function ChatAprendizadoFlutuante() {
  return (
    <Drawer.Root direction="right" shouldScaleBackground={false} modal>
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-red-900/50 bg-red-950 text-red-100 shadow-lg transition hover:bg-red-900 focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:outline-none"
          aria-label="Abrir chat Ollama (aprendizado)"
        >
          <Bot className="h-7 w-7" aria-hidden />
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content
          className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-xl outline-none"
          style={{ ['--initial-transform' as string]: '100%' } as CSSProperties}
        >
          <Drawer.Title className="sr-only">Chat Ollama — aprendizado</Drawer.Title>
          <Drawer.Description className="sr-only">
            Conversa com modelo local via Ollama, apenas para desenvolvimento.
          </Drawer.Description>

          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
            <span className="text-sm font-medium text-zinc-200">Assistente local</span>
            <Drawer.Close asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Fechar chat">
                <X className="h-4 w-4" />
              </Button>
            </Drawer.Close>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
            <ChatAprendizadoPainel />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
