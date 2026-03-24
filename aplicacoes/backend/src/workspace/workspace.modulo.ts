import { Module } from '@nestjs/common';
import { AutenticacaoModulo } from '../autenticacao/autenticacao.modulo';
import { WorkspaceControlador } from './workspace.controlador';
import { WorkspaceServico } from './workspace.servico';

@Module({
  imports: [AutenticacaoModulo],
  controllers: [WorkspaceControlador],
  providers: [WorkspaceServico],
  exports: [WorkspaceServico],
})
export class WorkspaceModulo {}
