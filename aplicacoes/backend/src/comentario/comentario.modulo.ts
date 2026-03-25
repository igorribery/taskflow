import { Module } from '@nestjs/common';
import { HistoricoModulo } from '../historico/historico.modulo';
import { ComentarioServico } from './comentario.servico';

@Module({
  imports: [HistoricoModulo],
  providers: [ComentarioServico],
  exports: [ComentarioServico],
})
export class ComentarioModulo {}
