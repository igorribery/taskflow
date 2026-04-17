import type { ListaKanban, Tarefa } from '@/tipos/api';
import {
  encontrarTarefa,
  idListaConcluido,
  idListaPorSlug,
  resolverListaDestino,
} from './kanban';

function criarTarefa(id: string, extra: Partial<Tarefa> = {}): Tarefa {
  return {
    id,
    titulo: `Tarefa ${id}`,
    descricao: null,
    ordem: 0,
    workspaceId: 'w1',
    listaId: 'l1',
    criadorId: 'u1',
    criadoEm: '2026-04-17T12:00:00.000Z',
    atualizadoEm: '2026-04-17T12:00:00.000Z',
    criador: { id: 'u1', nome: 'Igor', email: 'igor@ex.com' },
    ...extra,
  };
}

function criarQuadro(): ListaKanban[] {
  return [
    {
      id: 'l1',
      workspaceId: 'w1',
      titulo: 'A fazer',
      ordem: 0,
      slug: 'todo',
      tarefas: [criarTarefa('t1', { listaId: 'l1' }), criarTarefa('t2', { listaId: 'l1' })],
    },
    {
      id: 'l2',
      workspaceId: 'w1',
      titulo: 'Em andamento',
      ordem: 1,
      slug: 'doing',
      tarefas: [criarTarefa('t3', { listaId: 'l2' })],
    },
    {
      id: 'l3',
      workspaceId: 'w1',
      titulo: 'Concluído',
      ordem: 2,
      slug: 'done',
      tarefas: [],
    },
  ];
}

describe('utilitarios/kanban', () => {
  describe('encontrarTarefa', () => {
    it('retorna a tarefa quando existe em alguma lista', () => {
      const quadro = criarQuadro();
      expect(encontrarTarefa('t3', quadro)?.id).toBe('t3');
    });

    it('retorna undefined quando tarefa não existe', () => {
      expect(encontrarTarefa('inexistente', criarQuadro())).toBeUndefined();
    });

    it('retorna undefined quando quadro é indefinido', () => {
      expect(encontrarTarefa('t1', undefined)).toBeUndefined();
    });
  });

  describe('resolverListaDestino', () => {
    const quadro = criarQuadro();

    it('retorna o próprio id quando overId é uma lista', () => {
      expect(resolverListaDestino('l2', quadro)).toBe('l2');
    });

    it('retorna o id da lista que contém a tarefa quando overId é uma tarefa', () => {
      expect(resolverListaDestino('t3', quadro)).toBe('l2');
    });

    it('retorna null quando overId não existe', () => {
      expect(resolverListaDestino('xyz', quadro)).toBeNull();
    });
  });

  describe('idListaConcluido', () => {
    it('retorna o id da lista com slug "done"', () => {
      expect(idListaConcluido(criarQuadro())).toBe('l3');
    });

    it('retorna undefined quando não há lista concluído', () => {
      const quadro = criarQuadro().filter((l) => l.slug !== 'done');
      expect(idListaConcluido(quadro)).toBeUndefined();
    });
  });

  describe('idListaPorSlug', () => {
    it('retorna id conforme slug', () => {
      expect(idListaPorSlug(criarQuadro(), 'doing')).toBe('l2');
      expect(idListaPorSlug(criarQuadro(), 'todo')).toBe('l1');
    });

    it('retorna undefined quando slug não existe', () => {
      expect(idListaPorSlug(criarQuadro(), 'revisao')).toBeUndefined();
    });
  });
});
