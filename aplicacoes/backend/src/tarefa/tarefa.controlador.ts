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
import { ComentarioServico } from '../comentario/comentario.servico';
import { AtualizarComentarioDto } from '../comentario/dto/atualizar-comentario.dto';
import { CriarComentarioDto } from '../comentario/dto/criar-comentario.dto';
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto';
import { CriarTarefaDto } from './dto/criar-tarefa.dto';
import { TarefaServico } from './tarefa.servico';

@Controller()
@UseGuards(GuardaJwt)
export class TarefaControlador {
  constructor(
    private readonly servico: TarefaServico,
    private readonly comentarioServico: ComentarioServico,
  ) {}

  @Post('workspaces/:workspaceId/tarefas')
  criar(
    @Param('workspaceId') workspaceId: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: CriarTarefaDto,
  ) {
    return this.servico.criar(workspaceId, usuario.id, dto);
  }

  @Patch('tarefas/:id')
  atualizar(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: AtualizarTarefaDto,
  ) {
    return this.servico.atualizar(id, usuario.id, dto);
  }

  @Delete('tarefas/:id')
  deletar(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.servico.deletar(id, usuario.id);
  }

  @Get('tarefas/:id/historico')
  historico(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.servico.buscarHistorico(id, usuario.id);
  }

  @Get('tarefas/:id/comentarios')
  listarComentarios(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.comentarioServico.listar(id, usuario.id);
  }

  @Post('tarefas/:id/comentarios')
  criarComentario(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: CriarComentarioDto,
  ) {
    return this.comentarioServico.criar(id, usuario.id, dto.texto);
  }

  @Patch('comentarios/:id')
  atualizarComentario(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: AtualizarComentarioDto,
  ) {
    return this.comentarioServico.atualizar(id, usuario.id, dto.texto);
  }

  @Delete('comentarios/:id')
  deletarComentario(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.comentarioServico.deletar(id, usuario.id);
  }
}
