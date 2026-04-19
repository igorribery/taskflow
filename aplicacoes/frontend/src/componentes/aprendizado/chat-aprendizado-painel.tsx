'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Database, Loader2, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/servicos/api-taskflow';
import { conteudoUsuarioChatAprendizadoSchema } from '@/schemas/chat-aprendizado';
import type { MensagemChatAprendizado } from '@/tipos/api';

/**
 * Corpo do chat Ollama (estado local). Usado dentro do drawer flutuante.
 */
export function ChatAprendizadoPainel() {
  const [mensagens, setMensagens] = useState<MensagemChatAprendizado[]>([]);
  const [rascunho, setRascunho] = useState('');
  const [modelo, setModelo] = useState('');
  const [usarRag, setUsarRag] = useState(true);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const ultimoRascunhoRef = useRef('');

  const { data: ragStatus, refetch: refetchRagStatus } = useQuery({
    queryKey: ['aprendizado', 'rag', 'status'],
    queryFn: () => api.aprendizadoRagStatus(),
  });

  const mutacaoReindex = useMutation({
    mutationFn: () => api.aprendizadoRagReindex(),
    onSuccess: () => {
      void refetchRagStatus();
    },
  });

  const mutacao = useMutation({
    mutationFn: async (historico: MensagemChatAprendizado[]) => {
      const corpo: {
        mensagens: MensagemChatAprendizado[];
        modelo?: string;
        usarRag?: boolean;
      } = {
        mensagens: historico,
        usarRag,
      };
      const m = modelo.trim();
      if (m) corpo.modelo = m;
      return api.aprendizadoChat(corpo);
    },
    onSuccess: (dados, historicoEnviado) => {
      setErroLocal(null);
      setMensagens([
        ...historicoEnviado,
        { papel: 'assistente', conteudo: dados.resposta },
      ]);
    },
    onError: (e: Error) => {
      setErroLocal(e.message);
      setMensagens((m) => m.slice(0, -1));
      setRascunho(ultimoRascunhoRef.current);
    },
  });

  const enviar = useCallback(() => {
    const parse = conteudoUsuarioChatAprendizadoSchema.safeParse(rascunho);
    if (!parse.success) {
      setErroLocal(parse.error.issues[0]?.message ?? 'Mensagem inválida.');
      return;
    }
    setErroLocal(null);
    const texto = parse.data.trim();
    ultimoRascunhoRef.current = texto;
    const usuario: MensagemChatAprendizado = { papel: 'usuario', conteudo: texto };
    const historico = [...mensagens, usuario];
    setMensagens(historico);
    setRascunho('');
    mutacao.mutate(historico);
  }, [rascunho, mensagens, mutacao]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, mutacao.isPending]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Card className="flex min-h-0 flex-1 flex-col border-zinc-800 bg-black/40">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pt-4">
          <p className="text-xs text-zinc-500">
            Ollama em <code className="rounded bg-zinc-900 px-1">127.0.0.1:11434</code> — modelo padrão no
            backend: <code className="rounded bg-zinc-900 px-1">OLLAMA_MODELO</code>. Para RAG, instale{' '}
            <code className="rounded bg-zinc-900 px-1">nomic-embed-text</code> e clique em indexar.
          </p>
          <div className="flex flex-col gap-2 rounded-md border border-zinc-800/80 bg-zinc-950/40 p-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-zinc-500">
                RAG:{' '}
                <strong className="text-zinc-300">
                  {ragStatus?.trechosIndexados ?? '…'} trechos
                </strong>
              </span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-7 gap-1 border-zinc-700 text-[11px] text-zinc-300"
                disabled={mutacaoReindex.isPending}
                onClick={() => mutacaoReindex.mutate()}
              >
                {mutacaoReindex.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Database className="h-3 w-3" />
                )}
                Indexar docs
              </Button>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-zinc-400">
              <input
                type="checkbox"
                checked={usarRag}
                onChange={(e) => setUsarRag(e.target.checked)}
                className="rounded border-zinc-600 bg-black"
              />
              Usar trechos do repositório nas respostas
            </label>
            {mutacaoReindex.isError ? (
              <p className="text-red-400">
                {(mutacaoReindex.error as Error).message ?? 'Falha ao indexar.'}
              </p>
            ) : null}
            {mutacaoReindex.isSuccess ? (
              <p className="text-emerald-600/90">
                Indexados {mutacaoReindex.data.trechosIndexados} trechos (
                {mutacaoReindex.data.arquivosLidos} arquivos).
              </p>
            ) : null}
          </div>
          <div className="shrink-0">
            <label htmlFor="modelo-ollama" className="mb-1 block text-xs text-zinc-500">
              Modelo (opcional)
            </label>
            <Input
              id="modelo-ollama"
              placeholder="ex.: llama3.2"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="h-8 border-zinc-800 bg-black text-xs text-zinc-200"
            />
          </div>

          <ScrollArea className="h-[min(320px,calc(100vh-280px))] rounded-md border border-zinc-800/80 bg-zinc-950/50 p-3">
            {mensagens.length === 0 && !mutacao.isPending ? (
              <p className="text-center text-sm text-zinc-600">
                Envie uma mensagem para conversar com o modelo local.
              </p>
            ) : null}
            <ul className="space-y-3">
              {mensagens.map((m, i) => (
                <li
                  key={`${i}-${m.papel}-${m.conteudo.slice(0, 24)}`}
                  className={`flex ${m.papel === 'usuario' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                      m.papel === 'usuario'
                        ? 'bg-red-950/50 text-red-50'
                        : 'border border-zinc-800 bg-zinc-900/80 text-zinc-200'
                    }`}
                  >
                    {m.papel === 'assistente' ? (
                      <span className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-500">
                        Assistente
                      </span>
                    ) : null}
                    {m.papel === 'usuario' ? (
                      <span className="mb-1 block text-[10px] uppercase tracking-wide text-red-300/80">
                        Você
                      </span>
                    ) : null}
                    <p className="whitespace-pre-wrap wrap-break-word">{m.conteudo}</p>
                  </div>
                </li>
              ))}
              {mutacao.isPending ? (
                <li className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando resposta…
                  </div>
                </li>
              ) : null}
            </ul>
            <div ref={fimRef} />
          </ScrollArea>

          {erroLocal ? <p className="shrink-0 text-sm text-red-400">{erroLocal}</p> : null}

          <div className="flex shrink-0 flex-col gap-2">
            <Textarea
              placeholder="Escreva sua mensagem…"
              value={rascunho}
              onChange={(e) => setRascunho(e.target.value)}
              rows={3}
              disabled={mutacao.isPending}
              className="min-h-[72px] resize-none border-zinc-800 bg-black text-sm text-zinc-100"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void enviar();
                }
              }}
            />
            <Button
              type="button"
              className="gap-2 bg-red-950 text-red-100 hover:bg-red-900"
              disabled={mutacao.isPending}
              onClick={() => void enviar()}
            >
              {mutacao.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
