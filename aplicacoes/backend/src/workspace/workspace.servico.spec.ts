import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  comoPrisma,
  criarPrismaMock,
  PrismaMock,
} from '../../test/utilitarios/mock-prisma';
import { WorkspaceServico } from './workspace.servico';

describe('WorkspaceServico', () => {
  let prisma: PrismaMock;
  let servico: WorkspaceServico;

  beforeEach(() => {
    prisma = criarPrismaMock();
    servico = new WorkspaceServico(comoPrisma(prisma));
  });

  describe('criar', () => {
    it('deve criar workspace com dono e listas padrão', async () => {
      prisma.workspace.create.mockResolvedValue({
        id: 'w1',
        nome: 'Meu Projeto',
        membros: [],
      });

      const resultado = await servico.criar('u1', { nome: 'Meu Projeto' });

      expect(resultado.id).toBe('w1');
      const args = prisma.workspace.create.mock.calls[0][0];
      expect(args.data.nome).toBe('Meu Projeto');
      expect(args.data.membros.create).toEqual({ usuarioId: 'u1', papel: 'DONO' });
      const slugs = args.data.listas.create.map((l: { slug: string }) => l.slug);
      expect(slugs).toEqual(['todo', 'doing', 'done']);
    });
  });

  describe('listarDoUsuario', () => {
    it('deve retornar workspaces achatados com papel', async () => {
      prisma.workspaceMembro.findMany.mockResolvedValue([
        {
          papel: 'DONO',
          workspace: { id: 'w1', nome: 'A', _count: { tarefas: 3, membros: 1 } },
        },
        {
          papel: 'MEMBRO',
          workspace: { id: 'w2', nome: 'B', _count: { tarefas: 0, membros: 5 } },
        },
      ]);

      const resultado = await servico.listarDoUsuario('u1');

      expect(resultado).toHaveLength(2);
      expect(resultado[0]).toMatchObject({ id: 'w1', papel: 'DONO' });
      expect(resultado[1]).toMatchObject({ id: 'w2', papel: 'MEMBRO' });
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar workspace quando o usuário é membro', async () => {
      prisma.workspace.findFirst.mockResolvedValue({ id: 'w1', nome: 'A' });

      const resultado = await servico.buscarPorId('w1', 'u1');

      expect(resultado.id).toBe('w1');
    });

    it('deve lançar NotFoundException quando workspace não existe ou o usuário não é membro', async () => {
      prisma.workspace.findFirst.mockResolvedValue(null);

      await expect(servico.buscarPorId('w1', 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('entrar', () => {
    it('deve adicionar o usuário como membro', async () => {
      prisma.workspace.findUnique.mockResolvedValue({ id: 'w1', nome: 'A' });
      prisma.workspaceMembro.findUnique.mockResolvedValue(null);
      prisma.workspaceMembro.create.mockResolvedValue({});

      const resultado = await servico.entrar('w1', 'u1');

      expect(prisma.workspaceMembro.create).toHaveBeenCalledWith({
        data: { workspaceId: 'w1', usuarioId: 'u1', papel: 'MEMBRO' },
      });
      expect(resultado.mensagem).toContain('entrou no workspace');
    });

    it('deve lançar NotFoundException quando o workspace não existe', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);
      prisma.workspaceMembro.findUnique.mockResolvedValue(null);

      await expect(servico.entrar('w1', 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deve lançar ConflictException quando já é membro', async () => {
      prisma.workspace.findUnique.mockResolvedValue({ id: 'w1', nome: 'A' });
      prisma.workspaceMembro.findUnique.mockResolvedValue({ id: 'm1' });

      await expect(servico.entrar('w1', 'u1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('verificarAcesso', () => {
    it('deve retornar membro quando usuário é membro', async () => {
      prisma.workspaceMembro.findUnique.mockResolvedValue({
        id: 'm1',
        papel: 'MEMBRO',
      });

      const membro = await servico.verificarAcesso('w1', 'u1');

      expect(membro.id).toBe('m1');
    });

    it('deve lançar ForbiddenException quando usuário não é membro', async () => {
      prisma.workspaceMembro.findUnique.mockResolvedValue(null);

      await expect(servico.verificarAcesso('w1', 'u1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
