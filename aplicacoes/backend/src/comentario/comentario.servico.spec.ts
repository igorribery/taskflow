import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  comoPrisma,
  criarPrismaMock,
  PrismaMock,
} from '../../test/utilitarios/mock-prisma';
import { HistoricoServico } from '../historico/historico.servico';
import { ComentarioServico } from './comentario.servico';

describe('ComentarioServico', () => {
  let prisma: PrismaMock;
  let historico: jest.Mocked<Pick<HistoricoServico, 'registrar' | 'listarDaTarefa'>>;
  let servico: ComentarioServico;

  beforeEach(() => {
    prisma = criarPrismaMock();
    historico = {
      registrar: jest.fn().mockResolvedValue({}),
      listarDaTarefa: jest.fn(),
    };
    servico = new ComentarioServico(comoPrisma(prisma), historico as unknown as HistoricoServico);
  });

  function tarefaAcessivel() {
    prisma.tarefa.findUnique.mockResolvedValue({ id: 't1' });
    prisma.tarefa.findFirst.mockResolvedValue({ id: 't1' });
  }

  describe('listar', () => {
    it('deve retornar comentários quando usuário tem acesso', async () => {
      tarefaAcessivel();
      prisma.comentarioTarefa.findMany.mockResolvedValue([{ id: 'c1' }]);

      const resultado = await servico.listar('t1', 'u1');

      expect(resultado).toHaveLength(1);
    });

    it('deve lançar NotFoundException quando tarefa não existe', async () => {
      prisma.tarefa.findUnique.mockResolvedValue(null);
      prisma.tarefa.findFirst.mockResolvedValue(null);

      await expect(servico.listar('t1', 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException quando usuário não é membro', async () => {
      prisma.tarefa.findUnique.mockResolvedValue({ id: 't1' });
      prisma.tarefa.findFirst.mockResolvedValue(null);

      await expect(servico.listar('t1', 'u1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('criar', () => {
    it('deve criar comentário e registrar histórico com preview', async () => {
      tarefaAcessivel();
      prisma.comentarioTarefa.create.mockResolvedValue({
        id: 'c1',
        texto: 'ok',
      });

      const resultado = await servico.criar('t1', 'u1', '   ok   ');

      expect(resultado.id).toBe('c1');
      const args = prisma.comentarioTarefa.create.mock.calls[0][0];
      expect(args.data.texto).toBe('ok');
      expect(historico.registrar).toHaveBeenCalledWith({
        tarefaId: 't1',
        usuarioId: 'u1',
        acao: 'COMENTARIO_ADICIONADO',
        valorNovo: 'ok',
      });
    });

    it('deve truncar preview do histórico para 120 caracteres', async () => {
      tarefaAcessivel();
      const textoLongo = 'x'.repeat(200);
      prisma.comentarioTarefa.create.mockResolvedValue({
        id: 'c1',
        texto: textoLongo,
      });

      await servico.criar('t1', 'u1', textoLongo);

      const valorNovo = historico.registrar.mock.calls[0][0].valorNovo as string;
      expect(valorNovo.endsWith('…')).toBe(true);
      expect(valorNovo.length).toBe(121);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar comentário do próprio usuário', async () => {
      prisma.comentarioTarefa.findUnique.mockResolvedValue({
        id: 'c1',
        tarefaId: 't1',
        usuarioId: 'u1',
      });
      tarefaAcessivel();
      prisma.comentarioTarefa.update.mockResolvedValue({ id: 'c1', texto: 'novo' });

      const resultado = await servico.atualizar('c1', 'u1', '  novo  ');

      expect(resultado.texto).toBe('novo');
      const args = prisma.comentarioTarefa.update.mock.calls[0][0];
      expect(args.data.texto).toBe('novo');
    });

    it('deve lançar NotFoundException quando comentário não existe', async () => {
      prisma.comentarioTarefa.findUnique.mockResolvedValue(null);

      await expect(servico.atualizar('c1', 'u1', 'x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException quando não é autor', async () => {
      prisma.comentarioTarefa.findUnique.mockResolvedValue({
        id: 'c1',
        tarefaId: 't1',
        usuarioId: 'outro',
      });
      tarefaAcessivel();

      await expect(servico.atualizar('c1', 'u1', 'x')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('deletar', () => {
    it('deve deletar comentário do próprio usuário', async () => {
      prisma.comentarioTarefa.findUnique.mockResolvedValue({
        id: 'c1',
        tarefaId: 't1',
        usuarioId: 'u1',
      });
      tarefaAcessivel();
      prisma.comentarioTarefa.delete.mockResolvedValue({});

      const resultado = await servico.deletar('c1', 'u1');

      expect(prisma.comentarioTarefa.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
      expect(resultado.mensagem).toContain('excluído');
    });

    it('deve lançar ForbiddenException quando não é autor', async () => {
      prisma.comentarioTarefa.findUnique.mockResolvedValue({
        id: 'c1',
        tarefaId: 't1',
        usuarioId: 'outro',
      });
      tarefaAcessivel();

      await expect(servico.deletar('c1', 'u1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
