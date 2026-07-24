import { create } from 'zustand';

export interface ImageTransferState {
  image: string | null;
  setImage: (dataUrl: string | null) => void;
}

export const useImageTransfer = create<ImageTransferState>((set) => ({
  image: null,
  setImage: (image) => set({ image }),
}));
