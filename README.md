# TaskFlow

Monorepo full stack para gestao de tarefas em quadro Kanban, com autenticacao JWT, workspaces, historico de mudancas, comentarios por tarefa e um chat de aprendizado com IA local via Ollama.

## Visao geral

O projeto esta organizado em duas aplicacoes:

- `aplicacoes/backend`: API RESTful com NestJS + Prisma + PostgreSQL + Redis.
- `aplicacoes/frontend`: interface web em Next.js + React + TypeScript + Tailwind.

Funcionalidades ja implementadas:

- Cadastro, login e logout com JWT.
- Criacao e participacao em workspaces.
- Quadro Kanban com listas e tarefas.
- Movimentacao/atualizacao de tarefas, inclusive drag and drop no frontend.
- Historico de alteracoes por tarefa.
- Comentarios em tarefas: criar, listar, editar e remover.
- Chat bot IA local com Ollama para aprendizado e consulta sobre o projeto.
- RAG em memoria para enriquecer respostas do chat com trechos indexados do repositorio.

## Stack utilizada

### Backend

- Node.js
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- class-validator / class-transformer
- Ollama, usado pelo modulo de aprendizado/IA local

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand
- dnd-kit
- Shadcn UI + Lucide
- Vaul, usado no drawer lateral do chat IA

## Estrutura do repositorio

```bash
taskflow/
|-- aplicacoes/
|   |-- backend/
|   |   |-- prisma/
|   |   |   |-- migrations/
|   |   |   `-- schema.prisma
|   |   `-- src/
|   |       |-- aprendizado/
|   |       |   |-- rag/
|   |       |   |-- aprendizado.controlador.ts
|   |       |   |-- aprendizado.modulo.ts
|   |       |   |-- aprendizado.servico.ts
|   |       |   `-- prompt-sistema-taskflow.ts
|   |       |-- autenticacao/
|   |       |-- workspace/
|   |       |-- tarefa/
|   |       |-- lista/
|   |       |-- comentario/
|   |       |-- historico/
|   |       |-- infraestrutura/
|   |       `-- modulos/
|   `-- frontend/
|       `-- src/
|           |-- app/
|           |-- componentes/
|           |   |-- aprendizado/
|           |   `-- taskflow/
|           |-- estado/
|           |-- servicos/
|           |-- tipos/
|           `-- utilitarios/
|-- package.json
`-- README.md
```

## Pre-requisitos

- Node.js 20+
- npm 10+
- PostgreSQL rodando localmente ou remoto
- Redis rodando localmente ou remoto
- Ollama instalado e rodando localmente, caso queira usar o chat IA

## Instalacao

Na raiz do monorepo:

```bash
npm install
```

## Configuracao de ambiente

### Backend (`aplicacoes/backend/.env`)

Use `aplicacoes/backend/.env.exemplo` como base:

```env
URL_BANCO_DADOS="postgresql://postgres:postgres@localhost:5432/taskflow"
URL_REDIS="redis://localhost:6379"
JWT_SEGREDO="seu-segredo-super-secreto-aqui"
PORTA=3001
URL_FRONTEND="http://localhost:3000"

# Ollama: chat IA local de aprendizado
OLLAMA_URL="http://127.0.0.1:11434"
OLLAMA_MODELO="llama3.2"

# RAG: embeddings locais usados para consultar trechos do repositorio
OLLAMA_MODELO_EMBEDDINGS="nomic-embed-text"

# Opcional: raiz do monorepo taskflow/
# RAG_CAMINHO_RAIZ="C:/caminho/para/taskflow"
```

### Frontend (`aplicacoes/frontend/.env.local`)

Use `aplicacoes/frontend/.env.local.exemplo` como base:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Chat bot IA com Ollama

O TaskFlow possui um modulo de aprendizado com chat local via Ollama. A implementacao nao depende de APIs externas: o backend chama o Ollama instalado na maquina pela URL configurada em `OLLAMA_URL`.

### Como funciona

- O frontend exibe um botao flutuante no canto inferior direito da tela.
- Ao clicar no botao, abre um drawer lateral com o painel `ChatAprendizadoPainel`.
- O painel envia mensagens para o backend usando `POST /aprendizado/chat`.
- O backend monta um prompt de sistema do TaskFlow, opcionalmente injeta contexto RAG e encaminha a conversa para `OLLAMA_URL/api/chat`.
- A resposta do Ollama volta para o frontend no formato `{ "resposta": "..." }`.
- O chat e voltado para aprendizado/desenvolvimento: nao exige JWT e nao altera dados do TaskFlow.

Arquivos principais:

- `aplicacoes/backend/src/aprendizado/aprendizado.modulo.ts`
- `aplicacoes/backend/src/aprendizado/aprendizado.controlador.ts`
- `aplicacoes/backend/src/aprendizado/aprendizado.servico.ts`
- `aplicacoes/backend/src/aprendizado/prompt-sistema-taskflow.ts`
- `aplicacoes/backend/src/aprendizado/rag/rag.servico.ts`
- `aplicacoes/frontend/src/componentes/aprendizado/chat-aprendizado-flutuante.tsx`
- `aplicacoes/frontend/src/componentes/aprendizado/chat-aprendizado-painel.tsx`
- `aplicacoes/frontend/src/servicos/api-taskflow.ts`

### Preparando o Ollama

Instale o Ollama e baixe o modelo de chat configurado no backend:

```bash
ollama pull llama3.2
```

Para usar RAG, baixe tambem o modelo de embeddings:

```bash
ollama pull nomic-embed-text
```

Confirme que o Ollama esta rodando em:

```text
http://127.0.0.1:11434
```

Se usar outro host ou porta, ajuste `OLLAMA_URL` no `.env` do backend.

### Variaveis do Ollama

- `OLLAMA_URL`: endereco base do Ollama. Padrao usado pelo codigo: `http://127.0.0.1:11434`.
- `OLLAMA_MODELO`: modelo padrao do chat. Padrao usado pelo codigo: `llama3.2`.
- `OLLAMA_MODELO_EMBEDDINGS`: modelo usado para gerar embeddings do RAG. Padrao usado pelo codigo: `nomic-embed-text`.
- `RAG_CAMINHO_RAIZ`: caminho opcional para a raiz do monorepo. Se nao for informado, o backend tenta detectar a raiz subindo pastas a partir do `cwd`.

### Rotas da IA

#### `POST /aprendizado/chat`

Envia uma conversa para o modelo local.

Exemplo de corpo:

```json
{
  "mensagens": [
    {
      "papel": "usuario",
      "conteudo": "Explique como funciona o quadro Kanban deste projeto."
    }
  ],
  "modelo": "llama3.2",
  "usarRag": true
}
```

Campos:

- `mensagens`: lista obrigatoria com ao menos uma mensagem.
- `mensagens[].papel`: `usuario`, `assistente` ou `sistema`.
- `mensagens[].conteudo`: texto da mensagem, limitado a 32000 caracteres.
- `modelo`: opcional; sobrescreve `OLLAMA_MODELO` apenas para aquela requisicao.
- `usarRag`: opcional; quando diferente de `false`, tenta incluir trechos indexados do repositorio no prompt.

Resposta:

```json
{
  "resposta": "Texto retornado pelo modelo local."
}
```

#### `GET /aprendizado/rag/status`

Retorna o estado atual do indice RAG em memoria.

Resposta:

```json
{
  "trechosIndexados": 0,
  "raiz": "C:/caminho/para/taskflow"
}
```

#### `POST /aprendizado/rag/reindex`

Rele os arquivos-chave do repositorio, gera embeddings pelo Ollama e atualiza o indice em memoria.

Resposta:

```json
{
  "trechosIndexados": 12,
  "arquivosLidos": 6
}
```

Arquivos indexados pelo RAG:

- `README.md`
- `.cursorrules`
- `aplicacoes/backend/prisma/schema.prisma`
- `aplicacoes/backend/src/modulos/modulo-principal.ts`
- `aplicacoes/backend/src/principal.ts`
- `aplicacoes/frontend/src/servicos/api-taskflow.ts`

Observacao: o indice RAG fica apenas em memoria. Ao reiniciar o backend, rode a indexacao novamente pelo botao "Indexar docs" no chat ou pela rota `POST /aprendizado/rag/reindex`.

## Banco de dados (Prisma)

Com o `.env` do backend configurado:

```bash
cd aplicacoes/backend
npx prisma generate
npx prisma migrate deploy
```

Se estiver em ambiente de desenvolvimento e quiser criar/aplicar migracoes novas:

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

Tambem e possivel iniciar o backend explicitamente:

```bash
npm run dev:backend
```

URLs padrao:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Ollama: `http://127.0.0.1:11434`

Para usar o chat IA em desenvolvimento:

1. Inicie o Ollama.
2. Rode `ollama pull llama3.2`.
3. Rode `ollama pull nomic-embed-text`, se quiser usar RAG.
4. Inicie backend e frontend.
5. Abra o frontend e clique no botao flutuante do assistente.
6. Opcionalmente clique em "Indexar docs" para ativar respostas com contexto do repositorio.

## Scripts disponiveis

### Raiz

- `npm run dev`: inicia backend (`workspace backend`)
- `npm run dev:frontend`: inicia frontend
- `npm run dev:backend`: inicia backend em modo desenvolvimento
- `npm run build`: build de todos os workspaces
- `npm run lint`: lint em todos os workspaces
- `npm test`: testes do backend e do frontend
- `npm run test:backend`: testes do backend
- `npm run test:frontend`: testes do frontend
- `npm run test:cov`: coverage do backend e do frontend

### Backend (`aplicacoes/backend`)

- `npm run start:dev`: backend com watch (`ts-node`)
- `npm run build`: compila TypeScript para `dist`
- `npm run start`: executa build compilado
- `npm run lint`: lint do backend
- `npm run test`: executa a suite de testes Jest
- `npm run test:watch`: Jest em watch mode
- `npm run test:cov`: Jest com coverage
- `npm run prisma -- <comando>`: comandos Prisma

### Frontend (`aplicacoes/frontend`)

- `npm run dev`: desenvolvimento Next.js
- `npm run build`: build de producao
- `npm run start`: sobe app em producao
- `npm run lint`: lint do frontend
- `npm run test`: executa a suite de testes Jest
- `npm run test:watch`: Jest em watch mode
- `npm run test:cov`: Jest com coverage

## Principais rotas da API

### Autenticacao

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

### Tarefas e comentarios

- `POST /workspaces/:workspaceId/tarefas`
- `PATCH /tarefas/:id`
- `DELETE /tarefas/:id`
- `GET /tarefas/:id/historico`
- `GET /tarefas/:id/comentarios`
- `POST /tarefas/:id/comentarios`
- `PATCH /comentarios/:id`
- `DELETE /comentarios/:id`

### Aprendizado / IA local

- `POST /aprendizado/chat`
- `GET /aprendizado/rag/status`
- `POST /aprendizado/rag/reindex`

## Estado atual do schema

O banco ja possui modelos para:

- `Usuario`
- `Workspace`
- `WorkspaceMembro`
- `ListaKanban`
- `Tarefa`
- `HistoricoTarefa`
- `ComentarioTarefa`

Alem dos enums:

- `Papel` (`DONO`, `MEMBRO`)
- `AcaoHistorico` (acoes de auditoria de tarefas)

## Testes automatizados

Backend e frontend tem suite Jest independente.

Rodando tudo a partir da raiz:

```bash
npm test
```

Rodando por area:

```bash
npm run test:backend
npm run test:frontend
```

### Backend

Stack: **Jest + ts-jest** com mocks do Prisma, sem PostgreSQL/Redis reais.

```bash
cd aplicacoes/backend
npm test
npm run test:watch
npm run test:cov
```

Testes em `*.spec.ts` ao lado de cada servico:

- `src/autenticacao/autenticacao.servico.spec.ts`
- `src/workspace/workspace.servico.spec.ts`
- `src/lista/lista.servico.spec.ts`
- `src/historico/historico.servico.spec.ts`
- `src/comentario/comentario.servico.spec.ts`
- `src/tarefa/tarefa.servico.spec.ts`

Helper de mock do Prisma: `test/utilitarios/mock-prisma.ts`.

### Frontend

Stack: **Jest + ts-jest + jest-environment-jsdom** com `@testing-library/react` disponivel para futuros testes de componente.

```bash
cd aplicacoes/frontend
npm test
npm run test:watch
npm run test:cov
```

Testes em `*.spec.ts` ao lado dos modulos:

- `src/utilitarios/kanban.spec.ts`: busca de tarefa, resolucao de lista de destino, lookup por slug
- `src/utilitarios/historico.spec.ts`: traducao de acoes e valores
- `src/servicos/api-taskflow.spec.ts`: cliente HTTP com `fetch` mockado
- `src/estado/sessao.spec.ts`: store Zustand de sessao
- `src/estado/estado-interface.spec.ts`: store Zustand de UI

## Observacoes

- O backend usa CORS liberando a origem definida em `URL_FRONTEND`.
- O frontend usa `NEXT_PUBLIC_API_URL` para apontar para a API.
- O modulo de aprendizado/IA local nao exige autenticacao e deve ser usado apenas em desenvolvimento/aprendizado.
- O RAG atual e em memoria; para persistencia futura, sera necessario armazenar embeddings em banco ou indice vetorial.
- O projeto esta em evolucao; novas rotas e modulos podem ser adicionados mantendo o padrao modular atual.
