import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '@/tipos/api';

interface EstadoSessao {
  token: string | null;
  usuario: Usuario | null;
  definirSessao: (token: string, usuario: Usuario) => void;
  limpar: () => void;
}

export const useSessao = create<EstadoSessao>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      definirSessao: (token, usuario) => set({ token, usuario }),
      limpar: () => set({ token: null, usuario: null }),
    }),
    { name: 'taskflow-sessao' },
  ),
);
