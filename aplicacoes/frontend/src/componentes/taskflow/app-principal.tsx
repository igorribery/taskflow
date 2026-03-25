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
  CheckCircle2,
  Circle,
  Clock3,
  GripVertical,
  LayoutGrid,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { useSessao } from '@/estado/sessao';
import { api } from '@/servicos/api-taskflow';
import type { Comentario, HistoricoItem, ListaKanban, Tarefa } from '@/tipos/api';

dayjs.extend(relativeTime);
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

function tempoRelativo(dataIso: string): string {
  const texto = dayjs(dataIso).fromNow();
  return texto.startsWith('em ') ? texto : `há ${texto.replace(/^há\s+/, '')}`;
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
}: {
  tarefa: Tarefa;
  slugLista: string | null;
  onConcluir: () => void;
  onEditar: () => void;
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
      className={`flex w-full max-w-[280px] gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 p-2 text-left shadow-sm transition-[border-color,background-color] duration-100 hover:border-red-900/60 hover:bg-zinc-900 ${
        isDragging ? 'pointer-events-none' : ''
      }`}
    >
      <button
        type="button"
        className="touch-none shrink-0 cursor-grab rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-red-400/80 active:cursor-grabbing"
        {...listeners}
        {...attributes}
        aria-label="Arrastar tarefa"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onConcluir();
        }}
        className="shrink-0 rounded p-0.5 text-zinc-500 hover:text-emerald-500/90"
        title={estaConcluida ? 'Reabrir (voltar à primeira lista)' : 'Marcar como concluída'}
      >
        {estaConcluida ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <p className="min-w-0 flex-1 py-0.5 text-sm font-medium leading-snug text-zinc-100">
        {tarefa.titulo}
      </p>
      {tarefa.descricao ? (
        <span className="sr-only">{tarefa.descricao}</span>
      ) : null}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEditar();
        }}
        className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-300"
        title="Editar cartão"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}

function ColunaKanban({
  lista,
  onAddCard,
  onToggleConcluir,
  onEditar,
}: {
  lista: ListaKanban;
  onAddCard: () => void;
  onToggleConcluir: (t: Tarefa, slugLista: string | null) => void;
  onEditar: (t: Tarefa) => void;
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
        <span className="rounded bg-black/60 px-2 py-0.5 text-xs text-zinc-500">
          {lista.tarefas.length}
        </span>
      </div>
      <div className="flex min-h-[120px] flex-col gap-2">
        {lista.tarefas.map((t) => (
          <CartaoTarefa
            key={t.id}
            tarefa={t}
            slugLista={lista.slug}
            onConcluir={() => onToggleConcluir(t, lista.slug)}
            onEditar={() => onEditar(t)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onAddCard}
        className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-zinc-700 py-2 pl-2 text-left text-sm text-zinc-500 transition hover:border-red-900/40 hover:bg-black/40 hover:text-zinc-300"
      >
        <Plus className="h-4 w-4 shrink-0" />
        Adicionar cartão
      </button>
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
    onSuccess: () => {
      setTarefaPainel(null);
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-xl shadow-red-950/20">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-950/40 text-red-500">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">TaskFlow</h1>
            <p className="mt-1 text-sm text-zinc-500">Kanban com histórico e comentários</p>
          </div>
          <div className="mb-4 flex rounded-lg bg-black p-1">
            <button
              type="button"
              onClick={() => setAbaAuth('login')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                abaAuth === 'login'
                  ? 'bg-red-950/60 text-red-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setAbaAuth('cadastro')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                abaAuth === 'cadastro'
                  ? 'bg-red-950/60 text-red-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Cadastro
            </button>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              mutacaoAuth.mutate();
            }}
          >
            {abaAuth === 'cadastro' ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Nome</label>
                <input
                  className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-red-900/60"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required={abaAuth === 'cadastro'}
                />
              </div>
            ) : null}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">E-mail</label>
              <input
                type="email"
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-red-900/60"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Senha</label>
              <input
                type="password"
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-red-900/60"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {erroAuth ? <p className="text-sm text-red-400">{erroAuth}</p> : null}
            <button
              type="submit"
              disabled={mutacaoAuth.isPending}
              className="w-full rounded-lg bg-red-950 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-900 disabled:opacity-50"
            >
              {mutacaoAuth.isPending ? 'Aguarde…' : abaAuth === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-100">
      <aside className="flex w-64 flex-col border-r border-zinc-900 bg-black/60">
        <div className="border-b border-zinc-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-red-900/90">TaskFlow</p>
          <p className="mt-1 truncate text-sm font-medium text-white">{usuario.nome}</p>
          <p className="truncate text-xs text-zinc-500">{usuario.email}</p>
          <button
            type="button"
            onClick={() => mutacaoLogout.mutate()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 py-2 text-xs text-zinc-400 transition hover:border-red-950 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 text-xs font-semibold text-zinc-500">Workspaces</p>
          <div className="mb-3 flex gap-1">
            <input
              placeholder="Novo workspace"
              className="min-w-0 flex-1 rounded border border-zinc-800 bg-black px-2 py-1.5 text-xs outline-none focus:border-red-900/50"
              value={novoWorkspace}
              onChange={(e) => setNovoWorkspace(e.target.value)}
            />
            <button
              type="button"
              disabled={!novoWorkspace.trim() || mutacaoWorkspace.isPending}
              onClick={() => mutacaoWorkspace.mutate()}
              className="rounded bg-red-950/50 px-2 text-red-200 hover:bg-red-900/60 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-3 flex gap-1">
            <input
              placeholder="ID para entrar"
              className="min-w-0 flex-1 rounded border border-zinc-800 bg-black px-2 py-1.5 text-xs outline-none focus:border-red-900/50"
              value={workspaceConvite}
              onChange={(e) => setWorkspaceConvite(e.target.value)}
            />
            <button
              type="button"
              disabled={!workspaceConvite.trim() || mutacaoEntrar.isPending}
              onClick={() => mutacaoEntrar.mutate()}
              className="whitespace-nowrap rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-400 hover:border-red-900/50"
            >
              Entrar
            </button>
          </div>
          <ul className="space-y-1">
            {workspaces.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => setWorkspaceAtivo(w.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    workspaceAtivo === w.id
                      ? 'bg-red-950/40 text-red-100'
                      : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                  }`}
                >
                  {w.nome}
                  {w._count ? (
                    <span className="ml-1 text-xs text-zinc-600">({w._count.tarefas})</span>
                  ) : null}
                </button>
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
              Listas dinâmicas · arraste cartões · ícone de lápis abre o painel
            </p>
          </div>
          {workspaceAtivo && idTodo ? (
            <button
              type="button"
              onClick={() => abrirModalNovaTarefa(idTodo)}
              className="flex items-center gap-2 rounded-lg bg-red-950 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-900"
            >
              <Plus className="h-4 w-4" />
              Nova tarefa
            </button>
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
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setModalNovaLista(true)}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500 transition hover:border-red-900/50 hover:bg-zinc-900/30 hover:text-red-300"
                  title="Nova lista"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>
              <DragOverlay dropAnimation={null}>
                {tarefaArrastando ? <CartaoPreviewArraste tarefa={tarefaArrastando} /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </main>

      {modalCriar ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Nova tarefa</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Título</label>
                <input
                  className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-red-900/60"
                  value={tituloNova}
                  onChange={(e) => setTituloNova(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Descrição (opcional)</label>
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-red-900/60"
                  value={descNova}
                  onChange={(e) => setDescNova(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalCriar(false);
                  setListaIdNovaTarefa(null);
                }}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!tituloNova.trim() || mutacaoCriarTarefa.isPending}
                onClick={() => mutacaoCriarTarefa.mutate()}
                className="rounded-lg bg-red-950 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-900 disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalNovaLista ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Nova lista</h3>
            <input
              className="mt-4 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-red-900/60"
              placeholder="Título da lista"
              value={tituloNovaLista}
              onChange={(e) => setTituloNovaLista(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalNovaLista(false)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!tituloNovaLista.trim() || mutacaoNovaLista.isPending}
                onClick={() => mutacaoNovaLista.mutate()}
                className="rounded-lg bg-red-950 px-4 py-2 text-sm text-red-100 hover:bg-red-900 disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tarefaPainel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c0c] shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800 p-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-red-900/90">
                  {nomeListaDaTarefa(tarefaPainel.id)}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">Editar tarefa</h3>
              </div>
              <button
                type="button"
                onClick={() => setTarefaPainel(null)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div className="flex min-h-0 flex-1 flex-col border-b border-zinc-800 p-4 lg:border-b-0 lg:border-r">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Título</label>
                    <input
                      className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-red-900/60"
                      value={tituloEdicao}
                      onChange={(e) => setTituloEdicao(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Descrição</label>
                    <textarea
                      rows={10}
                      className="w-full resize-none rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-red-900/60"
                      placeholder="Adicione uma descrição mais detalhada…"
                      value={descEdicao}
                      onChange={(e) => setDescEdicao(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      mutacaoAtualizarTarefa.mutate({
                        id: tarefaPainel.id,
                        corpo: {
                          titulo: tituloEdicao.trim(),
                          descricao: descEdicao,
                        },
                      })
                    }
                    disabled={mutacaoAtualizarTarefa.isPending}
                    className="rounded-lg bg-red-950 px-4 py-2 text-sm text-red-100 hover:bg-red-900 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Excluir esta tarefa?')) mutacaoDeletar.mutate(tarefaPainel.id);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-red-950/50 px-4 py-2 text-sm text-red-400 hover:bg-red-950/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
                </div>
              </div>
              <div className="flex min-h-0 w-full flex-col lg:max-w-md lg:shrink-0">
                <div className="border-b border-zinc-800 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Comentários e atividade
                    </h4>
                    <button
                      type="button"
                      onClick={() => setMostrarDetalhes((v) => !v)}
                      className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700"
                    >
                      {mostrarDetalhes ? 'Ocultar detalhes' : 'Mostrar detalhes'}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    className="mt-2 w-full resize-none rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-red-900/60"
                    placeholder="Escrever um comentário…"
                    value={textoComentario}
                    onChange={(e) => setTextoComentario(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={!textoComentario.trim() || mutacaoComentario.isPending}
                    onClick={() => mutacaoComentario.mutate()}
                    className="mt-2 rounded-lg bg-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                  >
                    Comentar
                  </button>
                  <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto text-xs">
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
                              <textarea
                                rows={3}
                                className="w-full resize-none rounded border border-zinc-700 bg-black px-2 py-1 text-xs outline-none focus:border-red-900/60"
                                value={textoComentarioEditando}
                                onChange={(e) => setTextoComentarioEditando(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="rounded bg-zinc-800 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-700"
                                  onClick={() =>
                                    mutacaoComentarioAtualizar.mutate({
                                      id: c.id,
                                      texto: textoComentarioEditando.trim(),
                                    })
                                  }
                                  disabled={
                                    !textoComentarioEditando.trim() ||
                                    mutacaoComentarioAtualizar.isPending
                                  }
                                >
                                  Salvar
                                </button>
                                <button
                                  type="button"
                                  className="rounded px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800"
                                  onClick={() => {
                                    setComentarioEditandoId(null);
                                    setTextoComentarioEditando('');
                                  }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 whitespace-pre-wrap">{c.texto}</p>
                          )}
                          {c.usuarioId === usuario.id && comentarioEditandoId !== c.id ? (
                            <div className="mt-1 flex gap-3 text-[11px]">
                              <button
                                type="button"
                                className="text-zinc-400 hover:text-zinc-200"
                                onClick={() => {
                                  setComentarioEditandoId(c.id);
                                  setTextoComentarioEditando(c.texto);
                                }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="text-red-400 hover:text-red-300"
                                onClick={() => setComentarioParaExcluir(c)}
                              >
                                Excluir
                              </button>
                            </div>
                          ) : null}
                          <p className="mt-1 text-[10px] text-zinc-600">
                            {tempoRelativo(c.criadoEm)}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                  {!mostrarDetalhes && eventoCriacao ? (
                    <div className="mt-4 rounded border border-zinc-900 bg-black/40 px-2 py-2 text-xs text-zinc-300">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-3.5 w-3.5 text-zinc-500" />
                        <span>
                          <span className="font-medium text-zinc-200">{eventoCriacao.usuario.nome}</span>{' '}
                          adicionou este cartão
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {tempoRelativo(eventoCriacao.criadoEm)}
                      </p>
                    </div>
                  ) : null}
                </div>
                {mostrarDetalhes ? (
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-red-900/80">
                    Histórico
                  </h4>
                  {historico === null ? (
                    <p className="mt-2 text-xs text-zinc-600">Carregando…</p>
                  ) : historico.length === 0 ? (
                    <p className="mt-2 text-xs text-zinc-600">Sem eventos ainda.</p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-xs">
                      {historico.map((h) => (
                        <li
                          key={h.id}
                          className="rounded border border-zinc-900 bg-black/50 px-2 py-1.5 text-zinc-400"
                        >
                          <span className="text-red-400/90">{traduzirAcao(h.acao)}</span>
                          {h.valorAnterior != null || h.valorNovo != null ? (
                            <span className="text-zinc-500">
                              {' '}
                              {traduzirValor(h.valorAnterior)} → {traduzirValor(h.valorNovo)}
                            </span>
                          ) : null}
                          <div className="text-[10px] text-zinc-600">
                            {h.usuario.nome} · {tempoRelativo(h.criadoEm)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {comentarioParaExcluir ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <h4 className="text-base font-semibold text-white">Excluir comentário?</h4>
            <p className="mt-2 text-sm text-zinc-400">
              Esta ação não pode ser desfeita. Deseja realmente excluir este comentário?
            </p>
            <div className="mt-4 rounded border border-zinc-800 bg-black/40 px-3 py-2 text-xs text-zinc-300">
              {comentarioParaExcluir.texto}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComentarioParaExcluir(null)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => mutacaoComentarioDeletar.mutate(comentarioParaExcluir.id)}
                disabled={mutacaoComentarioDeletar.isPending}
                className="rounded-lg border border-red-950/60 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-950/50 disabled:opacity-50"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
