import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GuardaJwt } from '../autenticacao/guarda-jwt';
import { UsuarioAtual, UsuarioAutenticado } from '../autenticacao/usuario-atual.decorator';
import { CriarWorkspaceDto } from './dto/criar-workspace.dto';
import { WorkspaceServico } from './workspace.servico';

@Controller('workspaces')
@UseGuards(GuardaJwt)
export class WorkspaceControlador {
  constructor(private readonly servico: WorkspaceServico) {}

  @Post()
  criar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: CriarWorkspaceDto,
  ) {
    return this.servico.criar(usuario.id, dto);
  }

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listarDoUsuario(usuario.id);
  }

  @Get(':id')
  buscar(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.servico.buscarPorId(id, usuario.id);
  }

  @Post(':id/entrar')
  entrar(
    @Param('id') id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.servico.entrar(id, usuario.id);
  }
}
