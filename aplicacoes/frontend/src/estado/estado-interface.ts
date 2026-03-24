import { create } from 'zustand';

type EstadoInterface = {
  menuAberto: boolean;
  alternarMenu: () => void;
};

export const useEstadoInterface = create<EstadoInterface>((set) => ({
  menuAberto: true,
  alternarMenu: () => set((estadoAtual) => ({ menuAberto: !estadoAtual.menuAberto }))
}));
