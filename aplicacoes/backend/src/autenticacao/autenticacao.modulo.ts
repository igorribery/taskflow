import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BancoModulo } from '../infraestrutura/banco/banco.modulo';
import { AutenticacaoControlador } from './autenticacao.controlador';
import { AutenticacaoServico } from './autenticacao.servico';
import { EstrategiaJwt } from './estrategia-jwt';
import { GuardaJwt } from './guarda-jwt';

@Module({
  imports: [
    BancoModulo,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SEGREDO as string,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AutenticacaoControlador],
  providers: [AutenticacaoServico, EstrategiaJwt, GuardaJwt],
  exports: [EstrategiaJwt, GuardaJwt, JwtModule],
})
export class AutenticacaoModulo {}
