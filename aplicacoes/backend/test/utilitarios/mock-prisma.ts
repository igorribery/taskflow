import type { ClientePrisma } from '../../src/infraestrutura/banco/cliente-prisma';

type ModelosMockados =
  | 'usuario'
  | 'workspace'
  | 'workspaceMembro'
  | 'listaKanban'
  | 'tarefa'
  | 'comentarioTarefa'
  | 'historicoTarefa';

type MetodosModelo =
  | 'create'
  | 'findUnique'
  | 'findFirst'
  | 'findMany'
  | 'update'
  | 'delete'
  | 'aggregate';

export type PrismaMock = {
  [M in ModelosModelo]: Record<MetodosModelo, jest.Mock>;
} & Pick<ClientePrisma, never>;

type ModelosModelo = ModelosMockados;

function criarModeloMock(): Record<MetodosModelo, jest.Mock> {
  return {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  };
}

export function criarPrismaMock(): PrismaMock {
  return {
    usuario: criarModeloMock(),
    workspace: criarModeloMock(),
    workspaceMembro: criarModeloMock(),
    listaKanban: criarModeloMock(),
    tarefa: criarModeloMock(),
    comentarioTarefa: criarModeloMock(),
    historicoTarefa: criarModeloMock(),
  };
}

export function comoPrisma(mock: PrismaMock): ClientePrisma {
  return mock as unknown as ClientePrisma;
}
