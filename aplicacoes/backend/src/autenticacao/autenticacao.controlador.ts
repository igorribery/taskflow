import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AutenticacaoServico } from './autenticacao.servico';
import { CadastroDto } from './dto/cadastro.dto';
import { LoginDto } from './dto/login.dto';
import { GuardaJwt } from './guarda-jwt';
import { UsuarioAtual, UsuarioAutenticado } from './usuario-atual.decorator';

@Controller('auth')
export class AutenticacaoControlador {
  constructor(private readonly servico: AutenticacaoServico) {}

  @Post('cadastro')
  cadastrar(
    @Body() dto: Partial<CadastroDto>,
    @Headers('authorization') authorization?: string,
  ) {
    const credenciais = extrairCredenciaisBasic(authorization);
    return this.servico.cadastrar({
      nome: validarTexto(dto.nome, 'O nome é obrigatório.'),
      email: validarTexto(dto.email ?? credenciais?.email, 'Informe um e-mail válido.'),
      senha: validarTexto(dto.senha ?? credenciais?.senha, 'A senha é obrigatória.'),
    });
  }

  @Post('login')
  login(
    @Body() dto: Partial<LoginDto> | undefined,
    @Headers('authorization') authorization?: string,
  ) {
    const credenciais = extrairCredenciaisBasic(authorization);
    return this.servico.login({
      email: validarTexto(dto?.email ?? credenciais?.email, 'Informe um e-mail válido.'),
      senha: validarTexto(dto?.senha ?? credenciais?.senha, 'A senha é obrigatória.'),
    });
  }

  @Post('logout')
  @UseGuards(GuardaJwt)
  logout(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return {
      mensagem: `Até logo, ${usuario.nome}! Logout realizado com sucesso.`,
    };
  }
}

function validarTexto(valor: string | undefined, mensagem: string): string {
  if (!valor?.trim()) {
    throw new BadRequestException(mensagem);
  }
  return valor.trim();
}

function extrairCredenciaisBasic(
  authorization: string | undefined,
): { email: string; senha: string } | null {
  if (!authorization?.startsWith('Basic ')) return null;

  try {
    const decodificado = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
    const separador = decodificado.indexOf(':');
    if (separador <= 0) return null;

    return {
      email: decodificado.slice(0, separador),
      senha: decodificado.slice(separador + 1),
    };
  } catch {
    return null;
  }
}
