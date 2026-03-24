import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ClientePrisma } from '../infraestrutura/banco/cliente-prisma';

export interface PayloadJwt {
  sub: string;
  email: string;
}

@Injectable()
export class EstrategiaJwt extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: ClientePrisma) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SEGREDO ?? 'segredo-taskflow',
      ignoreExpiration: false,
    });
  }

  async validate(payload: PayloadJwt) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, nome: true, email: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    return usuario;
  }
}
