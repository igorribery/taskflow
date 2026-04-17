# TaskFlow

Monorepo full stack para gestão de tarefas em quadro Kanban, com autenticação JWT, workspaces, histórico de mudanças e comentários por tarefa.

## Visão geral

O projeto está organizado em duas aplicações:

- `aplicacoes/backend`: API RESTful com NestJS + Prisma + PostgreSQL + Redis.
- `aplicacoes/frontend`: interface web em Next.js + React + TypeScript + Tailwind.

Funcionalidades já implementadas:

- Cadastro, login e logout com JWT.
- Criação e participação em workspaces.
- Quadro Kanban com listas e tarefas.
- Movimentação/atualização de tarefas (inclusive drag and drop no frontend).
- Histórico de alterações por tarefa.
- Comentários em tarefas (criar, listar, editar e remover).

## Stack utilizada

### Backend

- Node.js
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- class-validator / class-transformer

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand
- dnd-kit
- Shadcn UI + Lucide

## Estrutura do repositório

```bash
taskflow/
├── aplicacoes/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── autenticacao/
│   │       ├── workspace/
│   │       ├── tarefa/
│   │       ├── lista/
│   │       ├── comentario/
│   │       ├── historico/
│   │       ├── infraestrutura/
│   │       └── modulos/
│   └── frontend/
│       └── src/
│           ├── app/
│           ├── componentes/
│           ├── estado/
│           ├── servicos/
│           ├── tipos/
│           └── utilitarios/
├── package.json
└── README.md
```

## Pré-requisitos

- Node.js 20+
- npm 10+
- PostgreSQL rodando localmente (ou remoto)
- Redis rodando localmente (ou remoto)

## Instalação

Na raiz do monorepo:

```bash
npm install
```

## Configuração de ambiente

### Backend (`aplicacoes/backend/.env`)

Use `aplicacoes/backend/.env.exemplo` como base:

```env
URL_BANCO_DADOS="postgresql://postgres:postgres@localhost:5432/taskflow"
URL_REDIS="redis://localhost:6379"
JWT_SEGREDO="seu-segredo-super-secreto-aqui"
PORTA=3001
URL_FRONTEND="http://localhost:3000"
```

### Frontend (`aplicacoes/frontend/.env.local`)

Use `aplicacoes/frontend/.env.local.exemplo` como base:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Banco de dados (Prisma)

Com o `.env` do backend configurado:

```bash
cd aplicacoes/backend
npx prisma generate
npx prisma migrate deploy
```

Se estiver em ambiente de desenvolvimento e quiser criar/aplicar migrações novas:

```bash
npx prisma migrate dev
```

## Executando o projeto

Na raiz do monorepo:

```bash
# inicia backend em watch mode
npm run dev

# inicia frontend
npm run dev:frontend
```

Também é possível iniciar o backend explicitamente:

```bash
npm run dev:backend
```

URLs padrão:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Scripts disponíveis

### Raiz

- `npm run dev`: inicia backend (`workspace backend`)
- `npm run dev:frontend`: inicia frontend
- `npm run dev:backend`: inicia backend em modo desenvolvimento
- `npm run build`: build de todos os workspaces
- `npm run lint`: lint em todos os workspaces

### Backend (`aplicacoes/backend`)

- `npm run start:dev`: backend com watch (`ts-node`)
- `npm run build`: compila TypeScript para `dist`
- `npm run start`: executa build compilado
- `npm run lint`: lint do backend
- `npm run test`: executa a suíte de testes Jest
- `npm run test:watch`: Jest em watch mode
- `npm run test:cov`: Jest com coverage
- `npm run prisma -- <comando>`: comandos Prisma

### Frontend (`aplicacoes/frontend`)

- `npm run dev`: desenvolvimento Next.js
- `npm run build`: build de produção
- `npm run start`: sobe app em produção
- `npm run lint`: lint do frontend
- `npm run test`: executa a suíte de testes Jest
- `npm run test:watch`: Jest em watch mode
- `npm run test:cov`: Jest com coverage

## Principais rotas da API

### Autenticação

- `POST /auth/cadastro`
- `POST /auth/login`
- `POST /auth/logout`

### Workspaces

- `POST /workspaces`
- `GET /workspaces`
- `GET /workspaces/:id`
- `POST /workspaces/:id/entrar`
- `GET /workspaces/:id/quadro`
- `POST /workspaces/:id/listas`

### Tarefas e comentários

- `POST /workspaces/:workspaceId/tarefas`
- `PATCH /tarefas/:id`
- `DELETE /tarefas/:id`
- `GET /tarefas/:id/historico`
- `GET /tarefas/:id/comentarios`
- `POST /tarefas/:id/comentarios`
- `PATCH /comentarios/:id`
- `DELETE /comentarios/:id`

## Estado atual do schema

O banco já possui modelos para:

- `Usuario`
- `Workspace`
- `WorkspaceMembro`
- `ListaKanban`
- `Tarefa`
- `HistoricoTarefa`
- `ComentarioTarefa`

Além dos enums:

- `Papel` (`DONO`, `MEMBRO`)
- `AcaoHistorico` (ações de auditoria de tarefas)

## Testes automatizados

Backend e frontend têm suíte Jest independente.

Rodando tudo a partir da raiz:

```bash
npm test
```

Rodando por área:

```bash
npm run test:backend
npm run test:frontend
```

### Backend

Stack: **Jest + ts-jest** com mocks do Prisma (sem PostgreSQL/Redis reais).

```bash
cd aplicacoes/backend
npm test
npm run test:watch
npm run test:cov
```

Testes em `*.spec.ts` ao lado de cada serviço:

- `src/autenticacao/autenticacao.servico.spec.ts`
- `src/workspace/workspace.servico.spec.ts`
- `src/lista/lista.servico.spec.ts`
- `src/historico/historico.servico.spec.ts`
- `src/comentario/comentario.servico.spec.ts`
- `src/tarefa/tarefa.servico.spec.ts`

Helper de mock do Prisma: `test/utilitarios/mock-prisma.ts`.

### Frontend

Stack: **Jest + ts-jest + jest-environment-jsdom** (com `@testing-library/react` disponível para futuros testes de componente).

```bash
cd aplicacoes/frontend
npm test
npm run test:watch
npm run test:cov
```

Testes em `*.spec.ts` ao lado dos módulos:

- `src/utilitarios/kanban.spec.ts` (busca de tarefa, resolução de lista de destino, lookup por slug)
- `src/utilitarios/historico.spec.ts` (tradução de ações e valores)
- `src/servicos/api-taskflow.spec.ts` (cliente HTTP com `fetch` mockado)
- `src/estado/sessao.spec.ts` (store Zustand de sessão)
- `src/estado/estado-interface.spec.ts` (store Zustand de UI)

## Observações

- O backend usa CORS liberando a origem definida em `URL_FRONTEND`.
- O frontend usa `NEXT_PUBLIC_API_URL` para apontar para a API.
- O projeto está em evolução; novas rotas e módulos podem ser adicionados mantendo o padrão modular atual.
