import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  comoPrisma,
  criarPrismaMock,
  PrismaMock,
} from '../../test/utilitarios/mock-prisma';
import { ListaServico } from './lista.servico';

describe('ListaServico', () => {
  let prisma: PrismaMock;
  let servico: ListaServico;

  beforeEach(() => {
    prisma = criarPrismaMock();
    servico = new ListaServico(comoPrisma(prisma));
  });

  describe('obterQuadro', () => {
    it('deve retornar listas com tarefas quando usuário é membro', async () => {
      prisma.workspaceMembro.findUnique.mockResolvedValue({ id: 'm1' });
      prisma.listaKanban.findMany.mockResolvedValue([
        { id: 'l1', titulo: 'A fazer', tarefas: [] },
      ]);

      const resultado = await servico.obterQuadro('w1', 'u1');

      expect(resultado).toHaveLength(1);
      expect(prisma.listaKanban.findMany).toHaveBeenCalledTimes(1);
    });

    it('deve lançar ForbiddenException quando usuário não é membro', async () => {
      prisma.workspaceMembro.findUnique.mockResolvedValue(null);

      await expect(servico.obterQuadro('w1', 'u1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.listaKanban.findMany).not.toHaveBeenCalled();
    });
  });

  describe('criar', () => {
    it('deve criar nova lista com ordem incrementada', async () => {
      prisma.workspaceMembro.findUnique.mockResolvedValue({ id: 'm1' });
      prisma.listaKanban.aggregate.mockResolvedValue({ _max: { ordem: 2 } });
      prisma.listaKanban.create.mockResolvedValue({
        id: 'l9',
        titulo: 'Revisão',
        ordem: 3,
        slug: null,
      });

      const resultado = await servico.criar('w1', 'u1', '  Revisão  ');

      expect(resultado.id).toBe('l9');
      const args = prisma.listaKanban.create.mock.calls[0][0];
      expect(args.data.ordem).toBe(3);
      expect(args.data.titulo).toBe('Revisão');
      expect(args.data.slug).toBeNull();
    });

    it('deve iniciar ordem em 0 quando não há listas', async () => {
      prisma.workspaceMembro.findUnique.mockResolvedValue({ id: 'm1' });
      prisma.listaKanban.aggregate.mockResolvedValue({ _max: { ordem: null } });
      prisma.listaKanban.create.mockResolvedValue({ id: 'l1' });

      await servico.criar('w1', 'u1', 'Nova');

      const args = prisma.listaKanban.create.mock.calls[0][0];
      expect(args.data.ordem).toBe(0);
    });
  });

  describe('buscarIdListaPorSlug', () => {
    it('deve retornar id quando encontra', async () => {
      prisma.listaKanban.findFirst.mockResolvedValue({ id: 'l1' });

      const id = await servico.buscarIdListaPorSlug('w1', 'todo');

      expect(id).toBe('l1');
    });

    it('deve lançar NotFoundException quando não encontra', async () => {
      prisma.listaKanban.findFirst.mockResolvedValue(null);

      await expect(
        servico.buscarIdListaPorSlug('w1', 'todo'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('garantirListaNoWorkspace', () => {
    it('deve retornar lista quando pertence ao workspace', async () => {
      prisma.listaKanban.findFirst.mockResolvedValue({ id: 'l1', workspaceId: 'w1' });

      const lista = await servico.garantirListaNoWorkspace('l1', 'w1');

      expect(lista.id).toBe('l1');
    });

    it('deve lançar NotFoundException quando não pertence ao workspace', async () => {
      prisma.listaKanban.findFirst.mockResolvedValue(null);

      await expect(
        servico.garantirListaNoWorkspace('l1', 'w1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
