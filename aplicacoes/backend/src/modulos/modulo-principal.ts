import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutenticacaoModulo } from '../autenticacao/autenticacao.modulo';
import { BancoModulo } from '../infraestrutura/banco/banco.modulo';
import { TarefaModulo } from '../tarefa/tarefa.modulo';
import { WorkspaceModulo } from '../workspace/workspace.modulo';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BancoModulo,
    AutenticacaoModulo,
    WorkspaceModulo,
    TarefaModulo,
  ],
})
export class ModuloPrincipal {}
