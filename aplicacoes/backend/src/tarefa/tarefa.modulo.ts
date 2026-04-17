import { Module } from '@nestjs/common';
import { AutenticacaoModulo } from '../autenticacao/autenticacao.modulo';
import { ComentarioModulo } from '../comentario/comentario.modulo';
import { HistoricoModulo } from '../historico/historico.modulo';
import { ListaModulo } from '../lista/lista.modulo';
import { WorkspaceModulo } from '../workspace/workspace.modulo';
import { TarefaControlador } from './tarefa.controlador';
import { TarefaServico } from './tarefa.servico';

@Module({
  imports: [
    AutenticacaoModulo,
    WorkspaceModulo,
    HistoricoModulo,
    ListaModulo,
    ComentarioModulo,
  ],
  controllers: [TarefaControlador],
  providers: [TarefaServico],
})
export class TarefaModulo {}
