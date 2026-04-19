export interface Usuario {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
}

export interface AuthResposta {
  usuario: Usuario;
  token: string;
}

export interface WorkspaceListaItem {
  id: string;
  nome: string;
  criadoEm: string;
  papel: string;
  _count?: { tarefas: number; membros: number };
}

export interface CriadorResumo {
  id: string;
  nome: string;
  email: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
  workspaceId: string;
  listaId: string;
  criadorId: string;
  criadoEm: string;
  atualizadoEm: string;
  criador: CriadorResumo;
  lista?: { id: string; titulo: string; slug: string | null; ordem: number };
  _count?: { comentarios: number };
}

/** Listas do quadro com tarefas aninhadas (GET /workspaces/:id/quadro) */
export interface ListaKanban {
  id: string;
  workspaceId: string;
  titulo: string;
  ordem: number;
  slug: string | null;
  tarefas: Tarefa[];
}

export interface HistoricoItem {
  id: string;
  tarefaId: string;
  usuarioId: string;
  acao: string;
  valorAnterior: string | null;
  valorNovo: string | null;
  criadoEm: string;
  usuario: CriadorResumo;
}

export interface Comentario {
  id: string;
  tarefaId: string;
  usuarioId: string;
  texto: string;
  criadoEm: string;
  usuario: CriadorResumo;
}

export type PapelMensagemChatAprendizado = 'usuario' | 'assistente' | 'sistema';

export interface MensagemChatAprendizado {
  papel: PapelMensagemChatAprendizado;
  conteudo: string;
}

export interface ChatAprendizadoResposta {
  resposta: string;
}

export interface RagStatusResposta {
  trechosIndexados: number;
  raiz: string;
}

export interface RagReindexResposta {
  trechosIndexados: number;
  arquivosLidos: number;
}
