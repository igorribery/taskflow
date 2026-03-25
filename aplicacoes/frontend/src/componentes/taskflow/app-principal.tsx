'use client';

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  CheckCircle2,
  Circle,
  Clock3,
  GripVertical,
  History,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useSessao } from '@/estado/sessao';
import { api } from '@/servicos/api-taskflow';
import type { Comentario, HistoricoItem, ListaKanban, Tarefa } from '@/tipos/api';

dayjs.locale('pt-br');

function encontrarTarefa(
  taskId: string,
  quadro: ListaKanban[] | undefined,
): Tarefa | undefined {
  if (!quadro) return undefined;
  for (const l of quadro) {
    const t = l.tarefas.find((x) => x.id === taskId);
    if (t) return t;
  }
  return undefined;
}

function resolverListaDestino(
  overId: string,
  quadro: ListaKanban[],
): string | null {
  if (quadro.some((l) => l.id === overId)) return overId;
  for (const l of quadro) {
    if (l.tarefas.some((t) => t.id === overId)) return l.id;
  }
  return null;
}

function idListaConcluido(quadro: ListaKanban[]): string | undefined {
  return quadro.find((l) => l.slug === 'done')?.id;
}

function traduzirAcao(acao: string): string {
  const mapa: Record<string, string> = {
    CRIADA: 'Criada',
    STATUS_ALTERADO: 'Status alterado',
    LISTA_ALTERADA: 'Lista alterada',
    TITULO_ALTERADO: 'Título alterado',
    DESCRICAO_ALTERADA: 'Descrição alterada',
    DELETADA: 'Excluída',
    COMENTARIO_ADICIONADO: 'Comentário adicionado',
  };
  return mapa[acao] ?? acao;
}

function traduzirValor(valor: string | null | undefined): string {
  if (!valor) return '—';
  const v = valor.trim();
  const upper = v.toUpperCase();
  const lower = v.toLowerCase();

  if (upper === 'TODO' || lower === 'todo') return 'A fazer';
  if (upper === 'DOING' || lower === 'doing') return 'Em andamento';
  if (upper === 'DONE' || lower === 'done') return 'Concluído';

  return v;
}

/** Ex.: 24 de mar. de 2026, 17:50 */
function formatarDataHoraAbsoluta(dataIso: string): string {
  const d = dayjs(dataIso).locale('pt-br');
  const mes = d.format('MMM').replace(/\.$/, '');
  return `${d.format('D')} de ${mes}. de ${d.format('YYYY')}, ${d.format('HH:mm')}`;
}

function iconeTipoHistorico(acao: string): LucideIcon {
  switch (acao) {
    case 'CRIADA':
      return Plus;
    case 'STATUS_ALTERADO':
    case 'LISTA_ALTERADA':
      return ArrowRightLeft;
    case 'TITULO_ALTERADO':
    case 'DESCRICAO_ALTERADA':
      return Pencil;
    case 'COMENTARIO_ADICIONADO':
      return MessageSquare;
    case 'DELETADA':
      return Trash2;
    default:
      return Clock3;
  }
}

function CartaoPreviewArraste({ tarefa }: { tarefa: Tarefa }) {
  return (
    <div className="flex w-[280px] max-w-[min(280px,85vw)] cursor-grabbing gap-1 rounded-lg border border-red-900/70 bg-zinc-900 p-2 shadow-2xl shadow-black/80 ring-2 ring-red-800/40">
      <div className="shrink-0 rounded p-1 text-red-400/90">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="font-medium text-zinc-100">{tarefa.titulo}</p>
        {tarefa.descricao ? (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{tarefa.descricao}</p>
        ) : null}
      </div>
    </div>
  );
}

function CartaoTarefa({
  tarefa,
  slugLista,
  onConcluir,
  onEditar,
  onExcluir,
}: {
  tarefa: Tarefa;
  slugLista: string | null;
  onConcluir: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tarefa.id,
  });
  const estilo: CSSProperties = {
    transition: 'none',
    ...(transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : undefined),
    ...(isDragging ? { opacity: 0 } : undefined),
  };

  const estaConcluida = slugLista === 'done';

  return (
    <div
      ref={setNodeRef}
      style={estilo}
      role="presentation"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onEditar();
      }}
      className={`flex w-full max-w-[280px] cursor-pointer gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 p-2 text-left shadow-sm transition-[border-color,background-color] duration-100 hover:border-red-900/60 hover:bg-zinc-900 ${
        isDragging ? 'pointer-events-none' : ''
      }`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="touch-none shrink-0 cursor-grab text-zinc-600 hover:bg-zinc-800 hover:text-red-400/80 active:cursor-grabbing"
        {...listeners}
        {...attributes}
        aria-label="Arrastar tarefa"
      >
        <GripVertical className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 p-0.5 text-zinc-500 hover:text-emerald-500/90"
        title={estaConcluida ? 'Reabrir (voltar à primeira lista)' : 'Marcar como concluída'}
        onClick={(e) => {
          e.stopPropagation();
          onConcluir();
        }}
      >
        {estaConcluida ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </Button>
      <p className="min-w-0 flex-1 py-0.5 text-sm font-medium leading-snug text-zinc-100">
        {tarefa.titulo}
      </p>
      {tarefa.descricao ? (
        <span className="sr-only">{tarefa.descricao}</span>
      ) : null}
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-zinc-500 hover:bg-zinc-800 hover:text-red-300"
          title="Editar cartão"
          onClick={(e) => {
            e.stopPropagation();
            onEditar();
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
          title="Excluir cartão"
          onClick={(e) => {
            e.stopPropagation();
            onExcluir();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ColunaKanban({
  lista,
  onAddCard,
  onToggleConcluir,
  onEditar,
  onExcluir,
}: {
  lista: ListaKanban;
  onAddCard: () => void;
  onToggleConcluir: (t: Tarefa, slugLista: string | null) => void;
  onEditar: (t: Tarefa) => void;
  onExcluir: (t: Tarefa) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: lista.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[272px] shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-2 ${
        isOver ? 'border-red-900/70 bg-red-950/10' : ''
      }`}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-zinc-200">{lista.titulo}</h3>
        <Badge variant="secondary" className="border-zinc-800 bg-black/60 font-normal text-zinc-500">
          {lista.tarefas.length}
        </Badge>
      </div>
      <div className="flex min-h-[120px] flex-col gap-2">
        {lista.tarefas.map((t) => (
          <CartaoTarefa
            key={t.id}
            tarefa={t}
            slugLista={lista.slug}
            onConcluir={() => onToggleConcluir(t, lista.slug)}
            onEditar={() => onEditar(t)}
            onExcluir={() => onExcluir(t)}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-2 h-auto w-full justify-start gap-2 border-dashed border-zinc-700 py-2 pl-2 text-left text-sm font-normal text-zinc-500 hover:border-red-900/40 hover:bg-black/40 hover:text-zinc-300"
        onClick={onAddCard}
      >
        <Plus className="h-4 w-4 shrink-0" />
        Adicionar cartão
      </Button>
    </div>
  );
}

export default function AppPrincipal() {
  const queryClient = useQueryClient();
  const { token, usuario, definirSessao, limpar } = useSessao();
  const [abaAuth, setAbaAuth] = useState<'login' | 'cadastro'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erroAuth, setErroAuth] = useState<string | null>(null);

  const [novoWorkspace, setNovoWorkspace] = useState('');
  const [workspaceConvite, setWorkspaceConvite] = useState('');
  const [workspaceAtivo, setWorkspaceAtivo] = useState<string | null>(null);

  const [modalCriar, setModalCriar] = useState(false);
  const [listaIdNovaTarefa, setListaIdNovaTarefa] = useState<string | null>(null);
  const [tituloNova, setTituloNova] = useState('');
  const [descNova, setDescNova] = useState('');

  const [modalNovaLista, setModalNovaLista] = useState(false);
  const [tituloNovaLista, setTituloNovaLista] = useState('');

  const [tarefaPainel, setTarefaPainel] = useState<Tarefa | null>(null);
  const [tituloEdicao, setTituloEdicao] = useState('');
  const [descEdicao, setDescEdicao] = useState('');
  const [historico, setHistorico] = useState<HistoricoItem[] | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[] | null>(null);
  const [textoComentario, setTextoComentario] = useState('');
  const [comentarioEditandoId, setComentarioEditandoId] = useState<string | null>(null);
  const [textoComentarioEditando, setTextoComentarioEditando] = useState('');
  const [comentarioParaExcluir, setComentarioParaExcluir] = useState<Comentario | null>(null);
  const [alertaExcluirTarefaAberto, setAlertaExcluirTarefaAberto] = useState(false);
  const [tarefaAlvoExclusao, setTarefaAlvoExclusao] = useState<Tarefa | null>(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(true);

  const [tarefaArrastando, setTarefaArrastando] = useState<Tarefa | null>(null);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces', token],
    queryFn: () => api.workspacesListar(token!),
    enabled: !!token,
  });

  const { data: quadro = [], isLoading: carregandoQuadro } = useQuery({
    queryKey: ['quadro', token, workspaceAtivo],
    queryFn: () => api.workspaceQuadro(token!, workspaceAtivo!),
    enabled: !!token && !!workspaceAtivo,
  });

  const idDone = useMemo(() => idListaConcluido(quadro), [quadro]);
  const idTodo = useMemo(() => quadro.find((l) => l.slug === 'todo')?.id, [quadro]);
  const eventoCriacao = useMemo(
    () => historico?.find((h) => h.acao === 'CRIADA') ?? null,
    [historico],
  );

  const nomeListaDaTarefa = useCallback(
    (tarefaId: string) => {
      const l = quadro.find((x) => x.tarefas.some((t) => t.id === tarefaId));
      return l?.titulo ?? 'Lista';
    },
    [quadro],
  );

  const mutacaoAuth = useMutation({
    mutationFn: async () => {
      setErroAuth(null);
      if (abaAuth === 'login') {
        return api.login({ email, senha });
      }
      return api.cadastro({ nome, email, senha });
    },
    onSuccess: (d) => {
      definirSessao(d.token, d.usuario);
      setErroAuth(null);
    },
    onError: (e: Error) => setErroAuth(e.message),
  });

  const mutacaoWorkspace = useMutation({
    mutationFn: () => api.workspaceCriar(token!, novoWorkspace.trim()),
    onSuccess: () => {
      setNovoWorkspace('');
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const mutacaoEntrar = useMutation({
    mutationFn: () => api.workspaceEntrar(token!, workspaceConvite.trim()),
    onSuccess: () => {
      setWorkspaceConvite('');
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const mutacaoNovaLista = useMutation({
    mutationFn: () => api.listaCriar(token!, workspaceAtivo!, tituloNovaLista.trim()),
    onSuccess: () => {
      setModalNovaLista(false);
      setTituloNovaLista('');
      void queryClient.invalidateQueries({ queryKey: ['quadro', token, workspaceAtivo] });
    },
  });

  const mutacaoCriarTarefa = useMutation({
    mutationFn: () =>
      api.tarefaCriar(token!, workspaceAtivo!, {
        titulo: tituloNova.trim(),
        descricao: descNova.trim() || undefined,
        listaId: listaIdNovaTarefa ?? undefined,
      }),
    onSuccess: () => {
      setModalCriar(false);
      setTituloNova('');
      setDescNova('');
      setListaIdNovaTarefa(null);
      void queryClient.invalidateQueries({ queryKey: ['quadro', token, workspaceAtivo] });
    },
  });

  const mutacaoAtualizarTarefa = useMutation({
    mutationFn: (vars: {
      id: string;
      corpo: Parameters<typeof api.tarefaAtualizar>[2];
    }) => api.tarefaAtualizar(token!, vars.id, vars.corpo),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({ queryKey: ['quadro', token, workspaceAtivo] });
      await carregarHistorico(vars.id);
      await carregarComentarios(vars.id);
    },
  });

  const mutacaoDeletar = useMutation({
    mutationFn: (id: string) => api.tarefaDeletar(token!, id),
    onSuccess: (_data, id) => {
      setTarefaPainel((p) => (p?.id === id ? null : p));
      setTarefaAlvoExclusao(null);
      setAlertaExcluirTarefaAberto(false);
      void queryClient.invalidateQueries({ queryKey: ['quadro', token, workspaceAtivo] });
    },
  });

  const mutacaoComentario = useMutation({
    mutationFn: () =>
      api.comentarioCriar(token!, tarefaPainel!.id, textoComentario.trim()),
    onSuccess: async () => {
      setTextoComentario('');
      if (tarefaPainel) {
        await carregarComentarios(tarefaPainel.id);
        await carregarHistorico(tarefaPainel.id);
      }
    },
  });

  const mutacaoComentarioAtualizar = useMutation({
    mutationFn: (vars: { id: string; texto: string }) =>
      api.comentarioAtualizar(token!, vars.id, vars.texto),
    onSuccess: async () => {
      if (tarefaPainel) {
        setComentarioEditandoId(null);
        setTextoComentarioEditando('');
        await carregarComentarios(tarefaPainel.id);
      }
    },
  });

  const mutacaoComentarioDeletar = useMutation({
    mutationFn: (comentarioId: string) => api.comentarioDeletar(token!, comentarioId),
    onSuccess: async () => {
      setComentarioParaExcluir(null);
      if (tarefaPainel) {
        await carregarComentarios(tarefaPainel.id);
      }
    },
  });

  const mutacaoLogout = useMutation({
    mutationFn: () => api.logout(token!),
    onSettled: () => {
      limpar();
      setWorkspaceAtivo(null);
      void queryClient.clear();
    },
  });

  const carregarHistorico = useCallback(
    async (tarefaId: string) => {
      if (!token) return;
      const h = await api.historicoTarefa(token, tarefaId);
      setHistorico(h);
    },
    [token],
  );

  const carregarComentarios = useCallback(
    async (tarefaId: string) => {
      if (!token) return;
      const c = await api.comentariosListar(token, tarefaId);
      setComentarios(c);
    },
    [token],
  );

  const abrirPainel = useCallback(
    (t: Tarefa) => {
      setTarefaPainel(t);
      setTituloEdicao(t.titulo);
      setDescEdicao(t.descricao ?? '');
      setHistorico(null);
      setComentarios(null);
      setTextoComentario('');
      setComentarioEditandoId(null);
      setTextoComentarioEditando('');
      setComentarioParaExcluir(null);
      setMostrarDetalhes(true);
      void carregarHistorico(t.id);
      void carregarComentarios(t.id);
    },
    [carregarHistorico, carregarComentarios],
  );

  const moverParaLista = useCallback(
    (tarefa: Tarefa, listaIdDestino: string) => {
      if (tarefa.listaId === listaIdDestino) return;
      mutacaoAtualizarTarefa.mutate({ id: tarefa.id, corpo: { listaId: listaIdDestino } });
    },
    [mutacaoAtualizarTarefa],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setTarefaArrastando(null);
      const { active, over } = event;
      if (!over || !token || !workspaceAtivo) return;
      const taskId = String(active.id);
      const destinoListaId = resolverListaDestino(String(over.id), quadro);
      if (!destinoListaId) return;
      const t = encontrarTarefa(taskId, quadro);
      if (!t || t.listaId === destinoListaId) return;
      try {
        await api.tarefaAtualizar(token, taskId, { listaId: destinoListaId });
        await queryClient.invalidateQueries({ queryKey: ['quadro', token, workspaceAtivo] });
      } catch {
        /* noop */
      }
    },
    [token, workspaceAtivo, quadro, queryClient],
  );

  useEffect(() => {
    if (!tarefaPainel || !quadro.length) return;
    const atual = encontrarTarefa(tarefaPainel.id, quadro);
    if (atual && atual.atualizadoEm !== tarefaPainel.atualizadoEm) {
      setTarefaPainel(atual);
      setTituloEdicao(atual.titulo);
      setDescEdicao(atual.descricao ?? '');
    }
  }, [quadro, tarefaPainel]);

  const abrirModalNovaTarefa = (listaId: string) => {
    setListaIdNovaTarefa(listaId);
    setModalCriar(true);
  };

  if (!token || !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-950/80 shadow-xl shadow-red-950/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-950/40 text-red-500">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl tracking-tight text-white">TaskFlow</CardTitle>
            <CardDescription>Kanban com histórico e comentários</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex rounded-lg bg-black p-1">
              <Button
                type="button"
                variant={abaAuth === 'login' ? 'secondary' : 'ghost'}
                className={`flex-1 ${
                  abaAuth === 'login'
                    ? 'bg-red-950/60 text-red-100 hover:bg-red-900/70'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => setAbaAuth('login')}
              >
                Entrar
              </Button>
              <Button
                type="button"
                variant={abaAuth === 'cadastro' ? 'secondary' : 'ghost'}
                className={`flex-1 ${
                  abaAuth === 'cadastro'
                    ? 'bg-red-950/60 text-red-100 hover:bg-red-900/70'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => setAbaAuth('cadastro')}
              >
                Cadastro
              </Button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                mutacaoAuth.mutate();
              }}
            >
              {abaAuth === 'cadastro' ? (
                <div className="space-y-2">
                  <Label htmlFor="auth-nome" className="text-zinc-400">
                    Nome
                  </Label>
                  <Input
                    id="auth-nome"
                    className="border-zinc-800 bg-black text-white focus-visible:border-red-900/60"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required={abaAuth === 'cadastro'}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="auth-email" className="text-zinc-400">
                  E-mail
                </Label>
                <Input
                  id="auth-email"
                  type="email"
                  className="border-zinc-800 bg-black text-white focus-visible:border-red-900/60"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-senha" className="text-zinc-400">
                  Senha
                </Label>
                <Input
                  id="auth-senha"
                  type="password"
                  className="border-zinc-800 bg-black text-white focus-visible:border-red-900/60"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {erroAuth ? <p className="text-sm text-red-400">{erroAuth}</p> : null}
              <Button
                type="submit"
                disabled={mutacaoAuth.isPending}
                className="w-full bg-red-950 font-semibold text-red-100 hover:bg-red-900"
              >
                {mutacaoAuth.isPending ? 'Aguarde…' : abaAuth === 'login' ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen text-zinc-100">
      <aside className="flex w-64 flex-col border-r border-zinc-900 bg-black/60">
        <div className="border-b border-zinc-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-red-900/90">TaskFlow</p>
          <p className="mt-1 truncate text-sm font-medium text-white">{usuario.nome}</p>
          <p className="truncate text-xs text-zinc-500">{usuario.email}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full gap-2 border-zinc-800 text-xs text-zinc-400 hover:border-red-950 hover:text-red-300"
            onClick={() => mutacaoLogout.mutate()}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 text-xs font-semibold text-zinc-500">Workspaces</p>
          <div className="mb-3 flex gap-1">
            <Input
              placeholder="Novo workspace"
              className="h-8 min-w-0 flex-1 border-zinc-800 bg-black text-xs focus-visible:border-red-900/50"
              value={novoWorkspace}
              onChange={(e) => setNovoWorkspace(e.target.value)}
            />
            <Button
              type="button"
              size="icon-sm"
              disabled={!novoWorkspace.trim() || mutacaoWorkspace.isPending}
              className="shrink-0 bg-red-950/50 text-red-200 hover:bg-red-900/60"
              onClick={() => mutacaoWorkspace.mutate()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="mb-3 flex gap-1">
            <Input
              placeholder="ID para entrar"
              className="h-8 min-w-0 flex-1 border-zinc-800 bg-black text-xs focus-visible:border-red-900/50"
              value={workspaceConvite}
              onChange={(e) => setWorkspaceConvite(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={!workspaceConvite.trim() || mutacaoEntrar.isPending}
              className="shrink-0 whitespace-nowrap border-zinc-700 text-[10px] text-zinc-400 hover:border-red-900/50"
              onClick={() => mutacaoEntrar.mutate()}
            >
              Entrar
            </Button>
          </div>
          <ul className="space-y-1">
            {workspaces.map((w) => (
              <li key={w.id}>
                <Button
                  type="button"
                  variant="ghost"
                  className={`h-auto w-full justify-start px-3 py-2 text-sm ${
                    workspaceAtivo === w.id
                      ? 'bg-red-950/40 text-red-100 hover:bg-red-950/50 hover:text-red-100'
                      : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                  }`}
                  onClick={() => setWorkspaceAtivo(w.id)}
                >
                  {w.nome}
                  {w._count ? (
                    <span className="ml-1 text-xs text-zinc-600">({w._count.tarefas})</span>
                  ) : null}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-900 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {workspaces.find((w) => w.id === workspaceAtivo)?.nome ?? 'Selecione um workspace'}
            </h2>
            <p className="text-xs text-zinc-500">
              Listas dinâmicas · arraste pelo ícone ⋮ · clique no cartão ou no lápis para editar · lixeira
              exclui (com confirmação)
            </p>
          </div>
          {workspaceAtivo && idTodo ? (
            <Button
              type="button"
              className="gap-2 bg-red-950 px-4 text-red-100 hover:bg-red-900"
              onClick={() => abrirModalNovaTarefa(idTodo)}
            >
              <Plus className="h-4 w-4" />
              Nova tarefa
            </Button>
          ) : null}
        </header>

        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          {!workspaceAtivo ? (
            <p className="text-center text-sm text-zinc-600">Escolha um workspace na barra lateral.</p>
          ) : carregandoQuadro ? (
            <p className="text-center text-sm text-zinc-500">Carregando quadro…</p>
          ) : (
            <DndContext
              sensors={sensores}
              collisionDetection={closestCorners}
              onDragStart={(e: DragStartEvent) => {
                const id = String(e.active.id);
                setTarefaArrastando(encontrarTarefa(id, quadro) ?? null);
              }}
              onDragCancel={() => setTarefaArrastando(null)}
              onDragEnd={(e) => void handleDragEnd(e)}
            >
              <div className="flex h-full items-start gap-3 pb-4">
                {quadro.map((lista) => (
                  <ColunaKanban
                    key={lista.id}
                    lista={lista}
                    onAddCard={() => abrirModalNovaTarefa(lista.id)}
                    onToggleConcluir={(t, slugColuna) => {
                      if (slugColuna === 'done' && idTodo) {
                        moverParaLista(t, idTodo);
                      } else if (idDone && slugColuna !== 'done') {
                        moverParaLista(t, idDone);
                      }
                    }}
                    onEditar={abrirPainel}
                    onExcluir={(t) => {
                      setTarefaAlvoExclusao(t);
                      setAlertaExcluirTarefaAberto(true);
                    }}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  className="h-14 w-14 shrink-0 rounded-xl border-dashed border-zinc-700 text-zinc-500 hover:border-red-900/50 hover:bg-zinc-900/30 hover:text-red-300"
                  title="Nova lista"
                  onClick={() => setModalNovaLista(true)}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
              <DragOverlay dropAnimation={null}>
                {tarefaArrastando ? <CartaoPreviewArraste tarefa={tarefaArrastando} /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </main>

      <Dialog
        open={modalCriar}
        onOpenChange={(open) => {
          if (!open) {
            setModalCriar(false);
            setListaIdNovaTarefa(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/70"
          className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-100 ring-zinc-800"
        >
          <DialogHeader>
            <DialogTitle className="text-white">Nova tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="nova-tarefa-titulo" className="text-zinc-500">
                Título
              </Label>
              <Input
                id="nova-tarefa-titulo"
                className="border-zinc-800 bg-black focus-visible:border-red-900/60"
                value={tituloNova}
                onChange={(e) => setTituloNova(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nova-tarefa-desc" className="text-zinc-500">
                Descrição (opcional)
              </Label>
              <Textarea
                id="nova-tarefa-desc"
                rows={3}
                className="resize-none border-zinc-800 bg-black focus-visible:border-red-900/60"
                value={descNova}
                onChange={(e) => setDescNova(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-4 border-0 bg-transparent p-0 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-400 hover:bg-zinc-900"
              onClick={() => {
                setModalCriar(false);
                setListaIdNovaTarefa(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!tituloNova.trim() || mutacaoCriarTarefa.isPending}
              className="bg-red-950 text-red-100 hover:bg-red-900"
              onClick={() => mutacaoCriarTarefa.mutate()}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalNovaLista} onOpenChange={(open) => !open && setModalNovaLista(false)}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/70"
          className="max-w-sm border-zinc-800 bg-zinc-950 text-zinc-100 ring-zinc-800"
        >
          <DialogHeader>
            <DialogTitle className="text-white">Nova lista</DialogTitle>
          </DialogHeader>
          <Input
            className="border-zinc-800 bg-black focus-visible:border-red-900/60"
            placeholder="Título da lista"
            value={tituloNovaLista}
            onChange={(e) => setTituloNovaLista(e.target.value)}
          />
          <DialogFooter className="mt-2 border-0 bg-transparent p-0 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-400 hover:bg-zinc-900"
              onClick={() => setModalNovaLista(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!tituloNovaLista.trim() || mutacaoNovaLista.isPending}
              className="bg-red-950 text-red-100 hover:bg-red-900"
              onClick={() => mutacaoNovaLista.mutate()}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!tarefaPainel}
        onOpenChange={(open) => {
          if (!open) {
            setTarefaPainel(null);
            setAlertaExcluirTarefaAberto(false);
            setTarefaAlvoExclusao(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/70"
          className="flex h-[86vh] max-h-[86vh] w-full max-w-6xl flex-col gap-0 overflow-hidden rounded-2xl border-zinc-800 bg-[#0c0c0c] p-0 text-zinc-100 ring-zinc-800 sm:max-w-6xl"
        >
          {tarefaPainel ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-zinc-800 p-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-red-900/90">
                    {nomeListaDaTarefa(tarefaPainel.id)}
                  </p>
                  <DialogTitle className="mt-1 text-xl font-semibold text-white">
                    Editar tarefa
                  </DialogTitle>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-zinc-500 hover:bg-zinc-900 hover:text-white"
                  aria-label="Fechar"
                  onClick={() => setTarefaPainel(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                <div className="flex min-h-0 flex-1 flex-col border-b border-zinc-800 p-4 lg:border-b-0 lg:border-r">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="painel-titulo" className="text-zinc-500">
                        Título
                      </Label>
                      <Input
                        id="painel-titulo"
                        className="border-zinc-800 bg-black focus-visible:border-red-900/60"
                        value={tituloEdicao}
                        onChange={(e) => setTituloEdicao(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="painel-desc" className="text-zinc-500">
                        Descrição
                      </Label>
                      <Textarea
                        id="painel-desc"
                        rows={10}
                        className="resize-none border-zinc-800 bg-black focus-visible:border-red-900/60"
                        placeholder="Adicione uma descrição mais detalhada…"
                        value={descEdicao}
                        onChange={(e) => setDescEdicao(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="bg-red-950 text-red-100 hover:bg-red-900"
                      disabled={mutacaoAtualizarTarefa.isPending}
                      onClick={() =>
                        mutacaoAtualizarTarefa.mutate({
                          id: tarefaPainel.id,
                          corpo: {
                            titulo: tituloEdicao.trim(),
                            descricao: descEdicao,
                          },
                        })
                      }
                    >
                      Salvar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-1 border-red-950/50 text-red-400 hover:bg-red-950/20"
                      onClick={() => {
                        setTarefaAlvoExclusao(tarefaPainel);
                        setAlertaExcluirTarefaAberto(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
                <div className="flex min-h-0 w-full flex-col lg:max-w-md lg:shrink-0">
                  <div className="border-b border-zinc-800 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
                        Comentários e atividade
                      </h4>
                      <Button
                        type="button"
                        size="xs"
                        variant="secondary"
                        className="bg-zinc-800 text-[11px] text-zinc-200 hover:bg-zinc-700"
                        onClick={() => setMostrarDetalhes((v) => !v)}
                      >
                        {mostrarDetalhes ? 'Ocultar detalhes' : 'Mostrar detalhes'}
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      className="mt-2 resize-none border-zinc-800 bg-black focus-visible:border-red-900/60"
                      placeholder="Escrever um comentário…"
                      value={textoComentario}
                      onChange={(e) => setTextoComentario(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="mt-2 bg-zinc-800 text-xs text-zinc-200 hover:bg-zinc-700"
                      disabled={!textoComentario.trim() || mutacaoComentario.isPending}
                      onClick={() => mutacaoComentario.mutate()}
                    >
                      Comentar
                    </Button>
                    <ScrollArea className="mt-4 h-56 pr-3">
                      <ul className="space-y-2 text-xs">
                        {comentarios === null ? (
                          <li className="text-zinc-600">Carregando…</li>
                        ) : comentarios.length === 0 ? (
                          <li className="text-zinc-600">Nenhum comentário ainda.</li>
                        ) : (
                          comentarios.map((c) => (
                            <li
                              key={c.id}
                              className="rounded border border-zinc-900 bg-black/40 px-2 py-2 text-zinc-300"
                            >
                              <span className="font-medium text-red-400/80">{c.usuario.nome}</span>
                              {comentarioEditandoId === c.id ? (
                                <div className="mt-1 space-y-2">
                                  <Textarea
                                    rows={3}
                                    className="resize-none border-zinc-700 bg-black text-xs focus-visible:border-red-900/60"
                                    value={textoComentarioEditando}
                                    onChange={(e) => setTextoComentarioEditando(e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      size="xs"
                                      variant="secondary"
                                      className="bg-zinc-800 text-[11px] text-zinc-200 hover:bg-zinc-700"
                                      disabled={
                                        !textoComentarioEditando.trim() ||
                                        mutacaoComentarioAtualizar.isPending
                                      }
                                      onClick={() =>
                                        mutacaoComentarioAtualizar.mutate({
                                          id: c.id,
                                          texto: textoComentarioEditando.trim(),
                                        })
                                      }
                                    >
                                      Salvar
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="xs"
                                      className="text-[11px] text-zinc-400 hover:bg-zinc-800"
                                      onClick={() => {
                                        setComentarioEditandoId(null);
                                        setTextoComentarioEditando('');
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-1 whitespace-pre-wrap">{c.texto}</p>
                              )}
                              {c.usuarioId === usuario.id && comentarioEditandoId !== c.id ? (
                                <div className="mt-1 flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-7 w-7 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                                    title="Editar comentário"
                                    onClick={() => {
                                      setComentarioEditandoId(c.id);
                                      setTextoComentarioEditando(c.texto);
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-7 w-7 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                                    title="Excluir comentário"
                                    onClick={() => setComentarioParaExcluir(c)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : null}
                            </li>
                          ))
                        )}
                      </ul>
                    </ScrollArea>
                    {!mostrarDetalhes && eventoCriacao ? (
                      <div className="mt-4 rounded border border-zinc-900 bg-black/40 px-2 py-2 text-xs text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-3.5 w-3.5 text-zinc-500" />
                          <span>
                            <span className="font-medium text-zinc-200">
                              {eventoCriacao.usuario.nome}
                            </span>{' '}
                            adicionou este cartão
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {formatarDataHoraAbsoluta(eventoCriacao.criadoEm)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  {mostrarDetalhes ? (
                    <ScrollArea className="min-h-0 flex-1 p-4">
                      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-900/80">
                        <History className="h-3.5 w-3.5 shrink-0 text-red-900/60" aria-hidden />
                        Histórico
                      </h4>
                      {historico === null ? (
                        <p className="mt-2 text-xs text-zinc-600">Carregando…</p>
                      ) : historico.length === 0 ? (
                        <p className="mt-2 text-xs text-zinc-600">Sem eventos ainda.</p>
                      ) : (
                        <ul className="mt-2 space-y-2 text-xs">
                          {historico.map((h) => {
                            const IconeAcao = iconeTipoHistorico(h.acao);
                            return (
                              <li
                                key={h.id}
                                className="rounded border border-zinc-900 bg-black/50 px-2 py-1.5 text-zinc-400"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-500">
                                    <IconeAcao className="h-3 w-3" aria-hidden />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-red-400/90">{traduzirAcao(h.acao)}</span>
                                    {h.valorAnterior != null || h.valorNovo != null ? (
                                      <span className="text-zinc-500">
                                        {' '}
                                        {traduzirValor(h.valorAnterior)} →{' '}
                                        {traduzirValor(h.valorNovo)}
                                      </span>
                                    ) : null}
                                    <div className="text-[10px] text-zinc-600">
                                      {h.usuario.nome} ·{' '}
                                      {formatarDataHoraAbsoluta(h.criadoEm)}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </ScrollArea>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!comentarioParaExcluir}
        onOpenChange={(open) => !open && setComentarioParaExcluir(null)}
      >
        <AlertDialogContent
          overlayClassName="bg-black/75"
          className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-100 ring-zinc-800"
        >
          <AlertDialogHeader className="text-left sm:text-left">
            <AlertDialogTitle className="text-white">Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Deseja realmente excluir este comentário?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {comentarioParaExcluir ? (
            <div className="rounded border border-zinc-800 bg-black/40 px-3 py-2 text-xs text-zinc-300">
              {comentarioParaExcluir.texto}
            </div>
          ) : null}
          <AlertDialogFooter className="border-0 bg-transparent sm:justify-end">
            <AlertDialogCancel className="border-zinc-700 bg-transparent text-zinc-400 hover:bg-zinc-900">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="border border-red-950/60 bg-red-950/30 text-red-300 hover:bg-red-950/50"
              disabled={mutacaoComentarioDeletar.isPending}
              onClick={() =>
                comentarioParaExcluir &&
                mutacaoComentarioDeletar.mutate(comentarioParaExcluir.id)
              }
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={alertaExcluirTarefaAberto}
        onOpenChange={(open) => {
          setAlertaExcluirTarefaAberto(open);
          if (!open) setTarefaAlvoExclusao(null);
        }}
      >
        <AlertDialogContent
          overlayClassName="bg-black/75"
          className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-100 ring-zinc-800"
        >
          <AlertDialogHeader className="text-left sm:text-left">
            <AlertDialogTitle className="text-white">Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cartão será removido do quadro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-0 bg-transparent sm:justify-end">
            <AlertDialogCancel className="border-zinc-700 bg-transparent text-zinc-400 hover:bg-zinc-900">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="border border-red-950/60 bg-red-950/30 text-red-300 hover:bg-red-950/50"
              disabled={mutacaoDeletar.isPending}
              onClick={() =>
                tarefaAlvoExclusao && mutacaoDeletar.mutate(tarefaAlvoExclusao.id)
              }
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
