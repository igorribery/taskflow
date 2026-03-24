import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ClientePrisma } from '../infraestrutura/banco/cliente-prisma';
import { CadastroDto } from './dto/cadastro.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AutenticacaoServico {
  constructor(
    private readonly prisma: ClientePrisma,
    private readonly jwt: JwtService,
  ) {}

  async cadastrar(dto: CadastroDto) {
    const existe = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existe) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);

    const usuario = await this.prisma.usuario.create({
      data: { nome: dto.nome, email: dto.email, senha: senhaHash },
      select: { id: true, nome: true, email: true, criadoEm: true },
    });

    return { usuario, token: this.assinarToken(usuario.id, usuario.email) };
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senha);

    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        criadoEm: usuario.criadoEm,
      },
      token: this.assinarToken(usuario.id, usuario.email),
    };
  }

  private assinarToken(sub: string, email: string): string {
    return this.jwt.sign({ sub, email });
  }
}
