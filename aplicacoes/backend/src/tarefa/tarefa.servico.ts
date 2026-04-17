import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HistoricoServico } from '../historico/historico.servico';
import { ClientePrisma } from '../infraestrutura/banco/cliente-prisma';
import { ListaServico } from '../lista/lista.servico';
import { WorkspaceServico } from '../workspace/workspace.servico';
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto';
import { CriarTarefaDto } from './dto/criar-tarefa.dto';

@Injectable()
export class TarefaServico {
  constructor(
    private readonly prisma: ClientePrisma,
    private readonly workspaceServico: WorkspaceServico,
    private readonly listaServico: ListaServico,
    private readonly historicoServico: HistoricoServico,
  ) {}

  async criar(workspaceId: string, usuarioId: string, dto: CriarTarefaDto) {
    let listaId = dto.listaId;
    if (!listaId) {
      const [, listaPadraoId] = await Promise.all([
        this.workspaceServico.verificarAcesso(workspaceId, usuarioId),
        this.listaServico.buscarIdListaPorSlug(workspaceId, 'todo'),
      ]);
      listaId = listaPadraoId;
    } else {
      await Promise.all([
        this.workspaceServico.verificarAcesso(workspaceId, usuarioId),
        this.listaServico.garantirListaNoWorkspace(listaId, workspaceId),
      ]);
    }

    const tarefa = await this.prisma.tarefa.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        listaId,
        workspaceId,
        criadorId: usuarioId,
      },
      include: {
        criador: { select: { id: true, nome: true, email: true } },
        lista: { select: { id: true, titulo: true, slug: true, ordem: true } },
      },
    });

    await this.historicoServico.registrar({
      tarefaId: tarefa.id,
      usuarioId,
      acao: 'CRIADA',
      valorNovo: tarefa.titulo,
    });

    return tarefa;
  }

  async atualizar(
    tarefaId: string,
    usuarioId: string,
    dto: AtualizarTarefaDto,
  ) {
    const tarefa = await this.buscarTarefaComAcesso(tarefaId, usuarioId);

    const registros: Promise<unknown>[] = [];

    if (dto.listaId && dto.listaId !== tarefa.listaId) {
      await this.listaServico.garantirListaNoWorkspace(
        dto.listaId,
        tarefa.workspaceId,
      );
      const [antiga, nova] = await Promise.all([
        this.prisma.listaKanban.findUnique({ where: { id: tarefa.listaId } }),
        this.prisma.listaKanban.findUnique({ where: { id: dto.listaId } }),
      ]);
      registros.push(
        this.historicoServico.registrar({
          tarefaId,
          usuarioId,
          acao: 'LISTA_ALTERADA',
          valorAnterior: antiga?.titulo ?? tarefa.listaId,
          valorNovo: nova?.titulo ?? dto.listaId,
        }),
      );
    }

    if (dto.titulo && dto.titulo !== tarefa.titulo) {
      registros.push(
        this.historicoServico.registrar({
          tarefaId,
          usuarioId,
          acao: 'TITULO_ALTERADO',
          valorAnterior: tarefa.titulo,
          valorNovo: dto.titulo,
        }),
      );
    }

    if ('descricao' in dto && dto.descricao !== tarefa.descricao) {
      registros.push(
        this.historicoServico.registrar({
          tarefaId,
          usuarioId,
          acao: 'DESCRICAO_ALTERADA',
          valorAnterior: tarefa.descricao ?? '',
          valorNovo: dto.descricao ?? '',
        }),
      );
    }

    const [tarefaAtualizada] = await Promise.all([
      this.prisma.tarefa.update({
        where: { id: tarefaId },
        data: {
          titulo: dto.titulo,
          descricao: dto.descricao,
          listaId: dto.listaId,
          ordem: dto.ordem,
        },
        include: {
          criador: { select: { id: true, nome: true, email: true } },
          lista: { select: { id: true, titulo: true, slug: true, ordem: true } },
        },
      }),
      ...registros,
    ]);

    return tarefaAtualizada;
  }

  async deletar(tarefaId: string, usuarioId: string) {
    const tarefa = await this.buscarTarefaComAcesso(tarefaId, usuarioId);

    await this.historicoServico.registrar({
      tarefaId,
      usuarioId,
      acao: 'DELETADA',
      valorAnterior: tarefa.titulo,
    });

    await this.prisma.tarefa.delete({ where: { id: tarefaId } });

    return { mensagem: 'Tarefa deletada com sucesso.' };
  }

  async buscarHistorico(tarefaId: string, usuarioId: string) {
    const tarefa = await this.buscarTarefaComAcesso(tarefaId, usuarioId);
    return this.historicoServico.listarDaTarefa(tarefa.id);
  }

  private async buscarTarefaComAcesso(tarefaId: string, usuarioId: string) {
    const tarefa = await this.prisma.tarefa.findFirst({
      where: {
        id: tarefaId,
        workspace: {
          membros: {
            some: { usuarioId },
          },
        },
      },
    });

    if (!tarefa) {
      const tarefaExiste = await this.prisma.tarefa.findUnique({
        where: { id: tarefaId },
        select: { id: true },
      });
      if (!tarefaExiste) {
        throw new NotFoundException('Tarefa não encontrada.');
      }
      throw new ForbiddenException('Acesso negado a esta tarefa.');
    }

    return tarefa;
  }
}
