import type { ListaKanban, Tarefa } from '@/tipos/api';

export function encontrarTarefa(
  taskId: string,
  quadro: ListaKanban[] | undefined,
): Tarefa | undefined {
  if (!quadro) return undefined;
  for (const lista of quadro) {
    const tarefa = lista.tarefas.find((t) => t.id === taskId);
    if (tarefa) return tarefa;
  }
  return undefined;
}

export function resolverListaDestino(
  overId: string,
  quadro: ListaKanban[],
): string | null {
  if (quadro.some((l) => l.id === overId)) return overId;
  for (const lista of quadro) {
    if (lista.tarefas.some((t) => t.id === overId)) return lista.id;
  }
  return null;
}

export function idListaConcluido(quadro: ListaKanban[]): string | undefined {
  return quadro.find((l) => l.slug === 'done')?.id;
}

export function idListaPorSlug(
  quadro: ListaKanban[],
  slug: string,
): string | undefined {
  return quadro.find((l) => l.slug === slug)?.id;
}
