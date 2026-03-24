import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusTarefa } from '@prisma/client';
import { HistoricoServico } from '../historico/historico.servico';
import { ClientePrisma } from '../infraestrutura/banco/cliente-prisma';
import { WorkspaceServico } from '../workspace/workspace.servico';
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto';
import { CriarTarefaDto } from './dto/criar-tarefa.dto';

@Injectable()
export class TarefaServico {
  constructor(
    private readonly prisma: ClientePrisma,
    private readonly workspaceServico: WorkspaceServico,
    private readonly historicoServico: HistoricoServico,
  ) {}

  async criar(workspaceId: string, usuarioId: string, dto: CriarTarefaDto) {
    await this.workspaceServico.verificarAcesso(workspaceId, usuarioId);

    const tarefa = await this.prisma.tarefa.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        status: dto.status ?? StatusTarefa.TODO,
        workspaceId,
        criadorId: usuarioId,
      },
      include: { criador: { select: { id: true, nome: true, email: true } } },
    });

    await this.historicoServico.registrar({
      tarefaId: tarefa.id,
      usuarioId,
      acao: 'CRIADA',
      valorNovo: tarefa.titulo,
    });

    return tarefa;
  }

  async listarPorWorkspace(workspaceId: string, usuarioId: string) {
    await this.workspaceServico.verificarAcesso(workspaceId, usuarioId);

    const tarefas = await this.prisma.tarefa.findMany({
      where: { workspaceId },
      include: { criador: { select: { id: true, nome: true, email: true } } },
      orderBy: [{ status: 'asc' }, { ordem: 'asc' }, { criadoEm: 'asc' }],
    });

    // Agrupa por status para retorno estilo kanban
    const kanban: Record<StatusTarefa, typeof tarefas> = {
      TODO: [],
      DOING: [],
      DONE: [],
    };

    for (const tarefa of tarefas) {
      kanban[tarefa.status].push(tarefa);
    }

    return kanban;
  }

  async atualizar(
    tarefaId: string,
    usuarioId: string,
    dto: AtualizarTarefaDto,
  ) {
    const tarefa = await this.buscarTarefaComAcesso(tarefaId, usuarioId);

    const registros: Promise<unknown>[] = [];

    if (dto.status && dto.status !== tarefa.status) {
      registros.push(
        this.historicoServico.registrar({
          tarefaId,
          usuarioId,
          acao: 'STATUS_ALTERADO',
          valorAnterior: tarefa.status,
          valorNovo: dto.status,
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
          status: dto.status,
          ordem: dto.ordem,
        },
        include: { criador: { select: { id: true, nome: true, email: true } } },
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
    const tarefa = await this.prisma.tarefa.findUnique({
      where: { id: tarefaId },
    });

    if (!tarefa) {
      throw new NotFoundException('Tarefa não encontrada.');
    }

    const temAcesso = await this.prisma.workspaceMembro.findUnique({
      where: {
        workspaceId_usuarioId: {
          workspaceId: tarefa.workspaceId,
          usuarioId,
        },
      },
    });

    if (!temAcesso) {
      throw new ForbiddenException('Acesso negado a esta tarefa.');
    }

    return tarefa;
  }
}
