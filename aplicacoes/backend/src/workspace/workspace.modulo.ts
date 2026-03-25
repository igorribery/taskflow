import { Module } from '@nestjs/common';
import { AutenticacaoModulo } from '../autenticacao/autenticacao.modulo';
import { ListaModulo } from '../lista/lista.modulo';
import { WorkspaceControlador } from './workspace.controlador';
import { WorkspaceServico } from './workspace.servico';

@Module({
  imports: [AutenticacaoModulo, ListaModulo],
  controllers: [WorkspaceControlador],
  providers: [WorkspaceServico],
  exports: [WorkspaceServico],
})
export class WorkspaceModulo {}
