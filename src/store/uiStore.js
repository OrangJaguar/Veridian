import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  immersiveChrome: false,
  setImmersiveChrome: (immersive) => set({ immersiveChrome: immersive }),
}));
