import { Injectable } from '@nestjs/common';
import { AcaoHistorico } from '@prisma/client';
import { ClientePrisma } from '../infraestrutura/banco/cliente-prisma';

interface RegistrarHistoricoParams {
  tarefaId: string;
  usuarioId: string;
  acao: AcaoHistorico;
  valorAnterior?: string;
  valorNovo?: string;
}

@Injectable()
export class HistoricoServico {
  constructor(private readonly prisma: ClientePrisma) {}

  async registrar(params: RegistrarHistoricoParams) {
    return this.prisma.historicoTarefa.create({
      data: {
        tarefaId: params.tarefaId,
        usuarioId: params.usuarioId,
        acao: params.acao,
        valorAnterior: params.valorAnterior,
        valorNovo: params.valorNovo,
      },
    });
  }

  async listarDaTarefa(tarefaId: string) {
    return this.prisma.historicoTarefa.findMany({
      where: { tarefaId },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { criadoEm: 'asc' },
    });
  }
}
