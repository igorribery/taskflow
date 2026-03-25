import type {
  AuthResposta,
  Comentario,
  HistoricoItem,
  ListaKanban,
  Tarefa,
  WorkspaceListaItem,
} from '@/tipos/api';

const baseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

async function requisicao<T>(
  caminho: string,
  opcoes: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers: h, ...rest } = opcoes;
  const headers = new Headers(h);
  if (!headers.has('Content-Type') && rest.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(`${baseUrl()}${caminho}`, { ...rest, headers });
  if (!res.ok) {
    let mensagem = res.statusText;
    try {
      const corpo = (await res.json()) as { message?: string | string[] };
      if (typeof corpo.message === 'string') mensagem = corpo.message;
      else if (Array.isArray(corpo.message)) mensagem = corpo.message.join(', ');
    } catch {
      /* ignore */
    }
    throw new Error(mensagem);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  cadastro: (corpo: { nome: string; email: string; senha: string }) =>
    requisicao<AuthResposta>('/auth/cadastro', { method: 'POST', body: JSON.stringify(corpo) }),

  login: (corpo: { email: string; senha: string }) =>
    requisicao<AuthResposta>('/auth/login', { method: 'POST', body: JSON.stringify(corpo) }),

  logout: (token: string) =>
    requisicao<{ mensagem: string }>('/auth/logout', {
      method: 'POST',
      token,
    }),

  workspacesListar: (token: string) =>
    requisicao<WorkspaceListaItem[]>('/workspaces', { token }),

  workspaceCriar: (token: string, nome: string) =>
    requisicao<WorkspaceListaItem>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ nome }),
      token,
    }),

  workspaceEntrar: (token: string, id: string) =>
    requisicao<{ mensagem: string }>(`/workspaces/${id}/entrar`, {
      method: 'POST',
      token,
    }),

  workspaceQuadro: (token: string, workspaceId: string) =>
    requisicao<ListaKanban[]>(`/workspaces/${workspaceId}/quadro`, { token }),

  listaCriar: (token: string, workspaceId: string, titulo: string) =>
    requisicao<ListaKanban>(`/workspaces/${workspaceId}/listas`, {
      method: 'POST',
      body: JSON.stringify({ titulo }),
      token,
    }),

  tarefaCriar: (
    token: string,
    workspaceId: string,
    corpo: { titulo: string; descricao?: string; listaId?: string },
  ) =>
    requisicao<Tarefa>(`/workspaces/${workspaceId}/tarefas`, {
      method: 'POST',
      body: JSON.stringify(corpo),
      token,
    }),

  tarefaAtualizar: (
    token: string,
    id: string,
    corpo: Partial<{ titulo: string; descricao: string; listaId: string; ordem: number }>,
  ) =>
    requisicao<Tarefa>(`/tarefas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(corpo),
      token,
    }),

  tarefaDeletar: (token: string, id: string) =>
    requisicao<{ mensagem: string }>(`/tarefas/${id}`, { method: 'DELETE', token }),

  historicoTarefa: (token: string, tarefaId: string) =>
    requisicao<HistoricoItem[]>(`/tarefas/${tarefaId}/historico`, { token }),

  comentariosListar: (token: string, tarefaId: string) =>
    requisicao<Comentario[]>(`/tarefas/${tarefaId}/comentarios`, { token }),

  comentarioCriar: (token: string, tarefaId: string, texto: string) =>
    requisicao<Comentario>(`/tarefas/${tarefaId}/comentarios`, {
      method: 'POST',
      body: JSON.stringify({ texto }),
      token,
    }),

  comentarioAtualizar: (token: string, comentarioId: string, texto: string) =>
    requisicao<Comentario>(`/comentarios/${comentarioId}`, {
      method: 'PATCH',
      body: JSON.stringify({ texto }),
      token,
    }),

  comentarioDeletar: (token: string, comentarioId: string) =>
    requisicao<{ mensagem: string }>(`/comentarios/${comentarioId}`, {
      method: 'DELETE',
      token,
    }),
};
