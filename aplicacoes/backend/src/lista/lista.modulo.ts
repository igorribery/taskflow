import { Module } from '@nestjs/common';
import { ListaServico } from './lista.servico';

@Module({
  providers: [ListaServico],
  exports: [ListaServico],
})
export class ListaModulo {}
