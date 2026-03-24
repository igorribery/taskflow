import { Global, Module } from '@nestjs/common';
import { ClientePrisma } from './cliente-prisma';

@Global()
@Module({
  providers: [ClientePrisma],
  exports: [ClientePrisma],
})
export class BancoModulo {}
