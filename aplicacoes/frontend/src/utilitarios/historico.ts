export function traduzirAcao(acao: string): string {
  const mapa: Record<string, string> = {
    CRIADA: 'Criada',
    STATUS_ALTERADO: 'Status alterado',
    LISTA_ALTERADA: 'Lista alterada',
    TITULO_ALTERADO: 'Título alterado',
    DESCRICAO_ALTERADA: 'Descrição alterada',
    DELETADA: 'Excluída',
    COMENTARIO_ADICIONADO: 'Comentário adicionado',
  };
  return mapa[acao] ?? acao;
}

export function traduzirValor(valor: string | null | undefined): string {
  if (!valor) return '—';
  const v = valor.trim();
  const upper = v.toUpperCase();
  const lower = v.toLowerCase();

  if (upper === 'TODO' || lower === 'todo') return 'A fazer';
  if (upper === 'DOING' || lower === 'doing') return 'Em andamento';
  if (upper === 'DONE' || lower === 'done') return 'Concluído';

  return v;
}
