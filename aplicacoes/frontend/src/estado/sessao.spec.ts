import type { Usuario } from '@/tipos/api';
import { useSessao } from './sessao';

const usuarioFake: Usuario = {
  id: 'u1',
  nome: 'Igor',
  email: 'igor@ex.com',
  criadoEm: '2026-04-17T00:00:00.000Z',
};

describe('useSessao (Zustand)', () => {
  beforeEach(() => {
    useSessao.setState({ token: null, usuario: null });
  });

  it('inicia sem token e sem usuário', () => {
    const estado = useSessao.getState();
    expect(estado.token).toBeNull();
    expect(estado.usuario).toBeNull();
  });

  it('definirSessao preenche token e usuário', () => {
    useSessao.getState().definirSessao('tok-123', usuarioFake);

    const estado = useSessao.getState();
    expect(estado.token).toBe('tok-123');
    expect(estado.usuario).toEqual(usuarioFake);
  });

  it('limpar restaura o estado inicial', () => {
    useSessao.getState().definirSessao('tok', usuarioFake);
    useSessao.getState().limpar();

    const estado = useSessao.getState();
    expect(estado.token).toBeNull();
    expect(estado.usuario).toBeNull();
  });
});
