import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AutenticacaoServico } from './autenticacao.servico';
import { CadastroDto } from './dto/cadastro.dto';
import { LoginDto } from './dto/login.dto';
import { GuardaJwt } from './guarda-jwt';
import { UsuarioAtual, UsuarioAutenticado } from './usuario-atual.decorator';

@Controller('auth')
export class AutenticacaoControlador {
  constructor(private readonly servico: AutenticacaoServico) {}

  @Post('cadastro')
  cadastrar(@Body() dto: CadastroDto) {
    return this.servico.cadastrar(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.servico.login(dto);
  }

  @Post('logout')
  @UseGuards(GuardaJwt)
  logout(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return {
      mensagem: `Até logo, ${usuario.nome}! Logout realizado com sucesso.`,
    };
  }
}
