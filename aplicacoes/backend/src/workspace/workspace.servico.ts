import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientePrisma } from '../infraestrutura/banco/cliente-prisma';
import { CriarWorkspaceDto } from './dto/criar-workspace.dto';

@Injectable()
export class WorkspaceServico {
  constructor(private readonly prisma: ClientePrisma) {}

  async criar(usuarioId: string, dto: CriarWorkspaceDto) {
    const workspace = await this.prisma.workspace.create({
      data: {
        nome: dto.nome,
        membros: {
          create: { usuarioId, papel: 'DONO' },
        },
        listas: {
          create: [
            { titulo: 'A fazer', ordem: 0, slug: 'todo' },
            { titulo: 'Em andamento', ordem: 1, slug: 'doing' },
            { titulo: 'Concluído', ordem: 2, slug: 'done' },
          ],
        },
      },
      include: { membros: { include: { usuario: { select: { id: true, nome: true, email: true } } } } },
    });

    return workspace;
  }

  async listarDoUsuario(usuarioId: string) {
    const membros = await this.prisma.workspaceMembro.findMany({
      where: { usuarioId },
      include: {
        workspace: {
          include: {
            _count: { select: { tarefas: true, membros: true } },
          },
        },
      },
      orderBy: { entradoEm: 'asc' },
    });

    return membros.map((m) => ({
      ...m.workspace,
      papel: m.papel,
    }));
  }

  async buscarPorId(workspaceId: string, usuarioId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        membros: {
          some: { usuarioId },
        },
      },
      include: {
        membros: {
          include: {
            usuario: { select: { id: true, nome: true, email: true } },
          },
        },
        _count: { select: { tarefas: true } },
      },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace não encontrado.');
    }
    return workspace;
  }

  async entrar(workspaceId: string, usuarioId: string) {
    const [workspace, jaEMembro] = await Promise.all([
      this.prisma.workspace.findUnique({
        where: { id: workspaceId },
      }),
      this.prisma.workspaceMembro.findUnique({
        where: { workspaceId_usuarioId: { workspaceId, usuarioId } },
      }),
    ]);

    if (!workspace) {
      throw new NotFoundException('Workspace não encontrado.');
    }

    if (jaEMembro) {
      throw new ConflictException('Você já é membro deste workspace.');
    }

    try {
      await this.prisma.workspaceMembro.create({
        data: { workspaceId, usuarioId, papel: 'MEMBRO' },
      });
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        throw new ConflictException('Você já é membro deste workspace.');
      }
      throw erro;
    }

    return { mensagem: 'Você entrou no workspace com sucesso.', workspace };
  }

  async verificarAcesso(workspaceId: string, usuarioId: string) {
    const membro = await this.prisma.workspaceMembro.findUnique({
      where: { workspaceId_usuarioId: { workspaceId, usuarioId } },
    });

    if (!membro) {
      throw new ForbiddenException('Acesso negado a este workspace.');
    }

    return membro;
  }
}
