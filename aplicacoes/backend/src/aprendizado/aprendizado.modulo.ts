import { Module } from '@nestjs/common';
import { AprendizadoControlador } from './aprendizado.controlador';
import { AprendizadoServico } from './aprendizado.servico';
import { RagServico } from './rag/rag.servico';

@Module({
  controllers: [AprendizadoControlador],
  providers: [RagServico, AprendizadoServico],
})
export class AprendizadoModulo {}
