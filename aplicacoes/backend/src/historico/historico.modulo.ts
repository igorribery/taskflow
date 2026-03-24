import { Module } from '@nestjs/common';
import { HistoricoServico } from './historico.servico';

@Module({
  providers: [HistoricoServico],
  exports: [HistoricoServico],
})
export class HistoricoModulo {}
