import {
  comoPrisma,
  criarPrismaMock,
  PrismaMock,
} from '../../test/utilitarios/mock-prisma';
import { HistoricoServico } from './historico.servico';

describe('HistoricoServico', () => {
  let prisma: PrismaMock;
  let servico: HistoricoServico;

  beforeEach(() => {
    prisma = criarPrismaMock();
    servico = new HistoricoServico(comoPrisma(prisma));
  });

  describe('registrar', () => {
    it('deve persistir histórico com os campos informados', async () => {
      prisma.historicoTarefa.create.mockResolvedValue({ id: 'h1' });

      const resultado = await servico.registrar({
        tarefaId: 't1',
        usuarioId: 'u1',
        acao: 'CRIADA',
        valorNovo: 'Nova tarefa',
      });

      expect(resultado).toEqual({ id: 'h1' });
      expect(prisma.historicoTarefa.create).toHaveBeenCalledWith({
        data: {
          tarefaId: 't1',
          usuarioId: 'u1',
          acao: 'CRIADA',
          valorAnterior: undefined,
          valorNovo: 'Nova tarefa',
        },
      });
    });
  });

  describe('listarDaTarefa', () => {
    it('deve listar histórico ordenado por criadoEm asc', async () => {
      prisma.historicoTarefa.findMany.mockResolvedValue([]);

      await servico.listarDaTarefa('t1');

      const args = prisma.historicoTarefa.findMany.mock.calls[0][0];
      expect(args.where).toEqual({ tarefaId: 't1' });
      expect(args.orderBy).toEqual({ criadoEm: 'asc' });
    });
  });
});
