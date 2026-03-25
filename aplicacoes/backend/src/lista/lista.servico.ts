import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientePrisma } from '../infraestrutura/banco/cliente-prisma';

@Injectable()
export class ListaServico {
  constructor(private readonly prisma: ClientePrisma) {}

  async obterQuadro(workspaceId: string, usuarioId: string) {
    await this.verificarMembroWorkspace(workspaceId, usuarioId);

    return this.prisma.listaKanban.findMany({
      where: { workspaceId },
      orderBy: { ordem: 'asc' },
      include: {
        tarefas: {
          orderBy: [{ ordem: 'asc' }, { criadoEm: 'asc' }],
          include: {
            criador: { select: { id: true, nome: true, email: true } },
          },
        },
      },
    });
  }

  async criar(workspaceId: string, usuarioId: string, titulo: string) {
    await this.verificarMembroWorkspace(workspaceId, usuarioId);

    const agg = await this.prisma.listaKanban.aggregate({
      where: { workspaceId },
      _max: { ordem: true },
    });
    const ordem = (agg._max.ordem ?? -1) + 1;

    return this.prisma.listaKanban.create({
      data: {
        workspaceId,
        titulo: titulo.trim(),
        ordem,
        slug: null,
      },
    });
  }

  async buscarIdListaPorSlug(workspaceId: string, slug: string) {
    const lista = await this.prisma.listaKanban.findFirst({
      where: { workspaceId, slug },
    });
    if (!lista) {
      throw new NotFoundException(`Lista "${slug}" não encontrada neste workspace.`);
    }
    return lista.id;
  }

  async garantirListaNoWorkspace(listaId: string, workspaceId: string) {
    const lista = await this.prisma.listaKanban.findFirst({
      where: { id: listaId, workspaceId },
    });
    if (!lista) {
      throw new NotFoundException('Lista não encontrada neste workspace.');
    }
    return lista;
  }

  private async verificarMembroWorkspace(workspaceId: string, usuarioId: string) {
    const membro = await this.prisma.workspaceMembro.findUnique({
      where: { workspaceId_usuarioId: { workspaceId, usuarioId } },
    });
    if (!membro) {
      throw new ForbiddenException('Acesso negado a este workspace.');
    }
  }
}
