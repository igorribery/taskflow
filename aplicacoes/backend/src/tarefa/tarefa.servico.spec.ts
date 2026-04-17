import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  comoPrisma,
  criarPrismaMock,
  PrismaMock,
} from '../../test/utilitarios/mock-prisma';
import { HistoricoServico } from '../historico/historico.servico';
import { ListaServico } from '../lista/lista.servico';
import { WorkspaceServico } from '../workspace/workspace.servico';
import { TarefaServico } from './tarefa.servico';

describe('TarefaServico', () => {
  let prisma: PrismaMock;
  let workspace: jest.Mocked<Pick<WorkspaceServico, 'verificarAcesso'>>;
  let lista: jest.Mocked<
    Pick<ListaServico, 'buscarIdListaPorSlug' | 'garantirListaNoWorkspace'>
  >;
  let historico: jest.Mocked<Pick<HistoricoServico, 'registrar' | 'listarDaTarefa'>>;
  let servico: TarefaServico;

  beforeEach(() => {
    prisma = criarPrismaMock();
    workspace = { verificarAcesso: jest.fn().mockResolvedValue({ id: 'm1' }) };
    lista = {
      buscarIdListaPorSlug: jest.fn(),
      garantirListaNoWorkspace: jest.fn(),
    };
    historico = {
      registrar: jest.fn().mockResolvedValue({}),
      listarDaTarefa: jest.fn().mockResolvedValue([]),
    };

    servico = new TarefaServico(
      comoPrisma(prisma),
      workspace as unknown as WorkspaceServico,
      lista as unknown as ListaServico,
      historico as unknown as HistoricoServico,
    );
  });

  describe('criar', () => {
    it('deve usar lista padrão "todo" quando listaId não é informado', async () => {
      lista.buscarIdListaPorSlug.mockResolvedValue('l-todo');
      prisma.tarefa.create.mockResolvedValue({
        id: 't1',
        titulo: 'Nova',
        listaId: 'l-todo',
      });

      const resultado = await servico.criar('w1', 'u1', { titulo: 'Nova' });

      expect(lista.buscarIdListaPorSlug).toHaveBeenCalledWith('w1', 'todo');
      expect(lista.garantirListaNoWorkspace).not.toHaveBeenCalled();
      expect(historico.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'CRIADA', valorNovo: 'Nova' }),
      );
      expect(resultado.id).toBe('t1');
    });

    it('deve validar listaId informado', async () => {
      lista.garantirListaNoWorkspace.mockResolvedValue({ id: 'l1' } as never);
      prisma.tarefa.create.mockResolvedValue({
        id: 't1',
        titulo: 'T',
        listaId: 'l1',
      });

      await servico.criar('w1', 'u1', { titulo: 'T', listaId: 'l1' });

      expect(lista.garantirListaNoWorkspace).toHaveBeenCalledWith('l1', 'w1');
      expect(lista.buscarIdListaPorSlug).not.toHaveBeenCalled();
    });
  });

  describe('atualizar', () => {
    it('deve registrar histórico de título, descrição e lista quando há alterações', async () => {
      prisma.tarefa.findFirst.mockResolvedValue({
        id: 't1',
        titulo: 'Antigo',
        descricao: 'Desc antiga',
        listaId: 'l1',
        workspaceId: 'w1',
      });
      lista.garantirListaNoWorkspace.mockResolvedValue({ id: 'l2' } as never);
      prisma.listaKanban.findUnique
        .mockResolvedValueOnce({ id: 'l1', titulo: 'A fazer' })
        .mockResolvedValueOnce({ id: 'l2', titulo: 'Em andamento' });
      prisma.tarefa.update.mockResolvedValue({ id: 't1' });

      await servico.atualizar('t1', 'u1', {
        titulo: 'Novo',
        descricao: 'Desc nova',
        listaId: 'l2',
      });

      const acoes = historico.registrar.mock.calls.map((c) => c[0].acao);
      expect(acoes).toEqual(
        expect.arrayContaining([
          'LISTA_ALTERADA',
          'TITULO_ALTERADO',
          'DESCRICAO_ALTERADA',
        ]),
      );
    });

    it('não deve registrar histórico quando nada muda', async () => {
      prisma.tarefa.findFirst.mockResolvedValue({
        id: 't1',
        titulo: 'Igual',
        descricao: 'desc',
        listaId: 'l1',
        workspaceId: 'w1',
      });
      prisma.tarefa.update.mockResolvedValue({ id: 't1' });

      await servico.atualizar('t1', 'u1', { titulo: 'Igual' });

      expect(historico.registrar).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando tarefa não existe', async () => {
      prisma.tarefa.findFirst.mockResolvedValue(null);
      prisma.tarefa.findUnique.mockResolvedValue(null);

      await expect(
        servico.atualizar('t1', 'u1', { titulo: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deve lançar ForbiddenException quando não é membro do workspace', async () => {
      prisma.tarefa.findFirst.mockResolvedValue(null);
      prisma.tarefa.findUnique.mockResolvedValue({ id: 't1' });

      await expect(
        servico.atualizar('t1', 'u1', { titulo: 'x' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('deletar', () => {
    it('deve registrar histórico e deletar a tarefa', async () => {
      prisma.tarefa.findFirst.mockResolvedValue({
        id: 't1',
        titulo: 'Antiga',
        workspaceId: 'w1',
        listaId: 'l1',
      });
      prisma.tarefa.delete.mockResolvedValue({ id: 't1' });

      const resultado = await servico.deletar('t1', 'u1');

      expect(historico.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'DELETADA', valorAnterior: 'Antiga' }),
      );
      expect(prisma.tarefa.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
      expect(resultado.mensagem).toContain('deletada');
    });
  });

  describe('buscarHistorico', () => {
    it('deve delegar para HistoricoServico.listarDaTarefa', async () => {
      prisma.tarefa.findFirst.mockResolvedValue({
        id: 't1',
        workspaceId: 'w1',
        listaId: 'l1',
        titulo: 't',
      });

      await servico.buscarHistorico('t1', 'u1');

      expect(historico.listarDaTarefa).toHaveBeenCalledWith('t1');
    });
  });
});
