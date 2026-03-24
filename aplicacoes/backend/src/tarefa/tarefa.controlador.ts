import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GuardaJwt } from '../autenticacao/guarda-jwt';
import { UsuarioAtual, UsuarioAutenticado } from '../autenticacao/usuario-atual.decorator';
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto';
import { CriarTarefaDto } from './dto/criar-tarefa.dto';
import { TarefaServico } from './tarefa.servico';

@Controller()
@UseGuards(GuardaJwt)
export class TarefaControlador {
  constructor(private readonly servico: TarefaServico) {}

  // POST /workspaces/:workspaceId/tarefas
  @Post('workspaces/:workspaceId/tarefas')
  criar(
    @Param('workspaceId') workspaceId: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: CriarTarefaDto,
  ) {
    return this.servico.criar(workspaceId, usuario.id, dto);
  }

  // GET /workspaces/:workspaceId/tarefas
  @Get('workspaces/:workspaceId/tarefas')
  listar(
    @Param('workspaceId') workspaceId: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.servico.listarPorWorkspace(workspaceId, usuario.id);
  }

  // PATCH /tarefas/:id
  @Patch('tarefas/:id')
  atualizar(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: AtualizarTarefaDto,
  ) {
    return this.servico.atualizar(id, usuario.id, dto);
  }

  // DELETE /tarefas/:id
  @Delete('tarefas/:id')
  deletar(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.servico.deletar(id, usuario.id);
  }

  // GET /tarefas/:id/historico
  @Get('tarefas/:id/historico')
  historico(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.servico.buscarHistorico(id, usuario.id);
  }
}
