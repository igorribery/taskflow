import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HistoricoServico } from '../historico/historico.servico';
import { ClientePrisma } from '../infraestrutura/banco/cliente-prisma';

@Injectable()
export class ComentarioServico {
  constructor(
    private readonly prisma: ClientePrisma,
    private readonly historicoServico: HistoricoServico,
  ) {}

  async listar(tarefaId: string, usuarioId: string) {
    await this.verificarAcessoTarefa(tarefaId, usuarioId);

    return this.prisma.comentarioTarefa.findMany({
      where: { tarefaId },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { criadoEm: 'asc' },
    });
  }

  async criar(tarefaId: string, usuarioId: string, texto: string) {
    await this.verificarAcessoTarefa(tarefaId, usuarioId);

    const comentario = await this.prisma.comentarioTarefa.create({
      data: {
        tarefaId,
        usuarioId,
        texto: texto.trim(),
      },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });

    const preview =
      comentario.texto.length > 120
        ? `${comentario.texto.slice(0, 120)}…`
        : comentario.texto;

    await this.historicoServico.registrar({
      tarefaId,
      usuarioId,
      acao: 'COMENTARIO_ADICIONADO',
      valorNovo: preview,
    });

    return comentario;
  }

  async atualizar(comentarioId: string, usuarioId: string, texto: string) {
    const comentario = await this.prisma.comentarioTarefa.findUnique({
      where: { id: comentarioId },
    });

    if (!comentario) {
      throw new NotFoundException('Comentário não encontrado.');
    }

    await this.verificarAcessoTarefa(comentario.tarefaId, usuarioId);

    if (comentario.usuarioId !== usuarioId) {
      throw new ForbiddenException('Você só pode editar seus próprios comentários.');
    }

    return this.prisma.comentarioTarefa.update({
      where: { id: comentarioId },
      data: { texto: texto.trim() },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  async deletar(comentarioId: string, usuarioId: string) {
    const comentario = await this.prisma.comentarioTarefa.findUnique({
      where: { id: comentarioId },
    });

    if (!comentario) {
      throw new NotFoundException('Comentário não encontrado.');
    }

    await this.verificarAcessoTarefa(comentario.tarefaId, usuarioId);

    if (comentario.usuarioId !== usuarioId) {
      throw new ForbiddenException('Você só pode excluir seus próprios comentários.');
    }

    await this.prisma.comentarioTarefa.delete({ where: { id: comentarioId } });
    return { mensagem: 'Comentário excluído com sucesso.' };
  }

  private async verificarAcessoTarefa(tarefaId: string, usuarioId: string) {
    const tarefa = await this.prisma.tarefa.findUnique({
      where: { id: tarefaId },
    });

    if (!tarefa) {
      throw new NotFoundException('Tarefa não encontrada.');
    }

    const membro = await this.prisma.workspaceMembro.findUnique({
      where: {
        workspaceId_usuarioId: {
          workspaceId: tarefa.workspaceId,
          usuarioId,
        },
      },
    });

    if (!membro) {
      throw new ForbiddenException('Acesso negado a esta tarefa.');
    }
  }
}
