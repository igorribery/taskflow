-- AlterEnum
ALTER TYPE "AcaoHistorico" ADD VALUE 'LISTA_ALTERADA';
ALTER TYPE "AcaoHistorico" ADD VALUE 'COMENTARIO_ADICIONADO';

-- CreateTable
CREATE TABLE "ListaKanban" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT,

    CONSTRAINT "ListaKanban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComentarioTarefa" (
    "id" TEXT NOT NULL,
    "tarefaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComentarioTarefa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ListaKanban" ADD CONSTRAINT "ListaKanban_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioTarefa" ADD CONSTRAINT "ComentarioTarefa_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComentarioTarefa" ADD CONSTRAINT "ComentarioTarefa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Tarefa" ADD COLUMN "listaId" TEXT;

-- Listas padrão por workspace (estilo Trello)
INSERT INTO "ListaKanban" ("id", "workspaceId", "titulo", "ordem", "slug")
SELECT gen_random_uuid()::text, w."id", 'A fazer', 0, 'todo'
FROM "Workspace" w;

INSERT INTO "ListaKanban" ("id", "workspaceId", "titulo", "ordem", "slug")
SELECT gen_random_uuid()::text, w."id", 'Em andamento', 1, 'doing'
FROM "Workspace" w;

INSERT INTO "ListaKanban" ("id", "workspaceId", "titulo", "ordem", "slug")
SELECT gen_random_uuid()::text, w."id", 'Concluído', 2, 'done'
FROM "Workspace" w;

-- Migrar tarefas existentes (status -> lista)
UPDATE "Tarefa" t
SET "listaId" = l."id"
FROM "ListaKanban" l
WHERE l."workspaceId" = t."workspaceId"
  AND (
    (t."status" = 'TODO' AND l."slug" = 'todo')
    OR (t."status" = 'DOING' AND l."slug" = 'doing')
    OR (t."status" = 'DONE' AND l."slug" = 'done')
  );

UPDATE "Tarefa" t
SET "listaId" = (
  SELECT l."id" FROM "ListaKanban" l
  WHERE l."workspaceId" = t."workspaceId" AND l."slug" = 'todo'
  LIMIT 1
)
WHERE t."listaId" IS NULL;

ALTER TABLE "Tarefa" ALTER COLUMN "listaId" SET NOT NULL;

ALTER TABLE "Tarefa" DROP COLUMN "status";

DROP TYPE "StatusTarefa";

ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_listaId_fkey" FOREIGN KEY ("listaId") REFERENCES "ListaKanban"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ListaKanban_workspaceId_ordem_idx" ON "ListaKanban"("workspaceId", "ordem");
CREATE INDEX "ComentarioTarefa_tarefaId_criadoEm_idx" ON "ComentarioTarefa"("tarefaId", "criadoEm");
