import { traduzirAcao, traduzirValor } from './historico';

describe('traduzirAcao', () => {
  it('traduz ações conhecidas', () => {
    expect(traduzirAcao('CRIADA')).toBe('Criada');
    expect(traduzirAcao('STATUS_ALTERADO')).toBe('Status alterado');
    expect(traduzirAcao('LISTA_ALTERADA')).toBe('Lista alterada');
    expect(traduzirAcao('TITULO_ALTERADO')).toBe('Título alterado');
    expect(traduzirAcao('DESCRICAO_ALTERADA')).toBe('Descrição alterada');
    expect(traduzirAcao('DELETADA')).toBe('Excluída');
    expect(traduzirAcao('COMENTARIO_ADICIONADO')).toBe('Comentário adicionado');
  });

  it('retorna a string original para ações desconhecidas', () => {
    expect(traduzirAcao('ALGUMA_COISA')).toBe('ALGUMA_COISA');
  });
});

describe('traduzirValor', () => {
  it('retorna traço para valores vazios', () => {
    expect(traduzirValor(null)).toBe('—');
    expect(traduzirValor(undefined)).toBe('—');
    expect(traduzirValor('')).toBe('—');
  });

  it('traduz slugs de listas', () => {
    expect(traduzirValor('TODO')).toBe('A fazer');
    expect(traduzirValor('todo')).toBe('A fazer');
    expect(traduzirValor('DOING')).toBe('Em andamento');
    expect(traduzirValor('doing')).toBe('Em andamento');
    expect(traduzirValor('DONE')).toBe('Concluído');
    expect(traduzirValor('done')).toBe('Concluído');
  });

  it('retorna o valor original (sem trim extra) para textos livres', () => {
    expect(traduzirValor('  meu titulo  ')).toBe('meu titulo');
    expect(traduzirValor('Outra coisa')).toBe('Outra coisa');
  });
});
