import { useEstadoInterface } from './estado-interface';

describe('useEstadoInterface (Zustand)', () => {
  beforeEach(() => {
    useEstadoInterface.setState({ menuAberto: true });
  });

  it('inicia com menu aberto', () => {
    expect(useEstadoInterface.getState().menuAberto).toBe(true);
  });

  it('alternarMenu inverte o estado', () => {
    useEstadoInterface.getState().alternarMenu();
    expect(useEstadoInterface.getState().menuAberto).toBe(false);

    useEstadoInterface.getState().alternarMenu();
    expect(useEstadoInterface.getState().menuAberto).toBe(true);
  });
});
