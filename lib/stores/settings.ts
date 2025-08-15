import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MediaPlayer } from '../types';

export interface SettingsState {
  smartOrder: boolean;
  hideTrash: boolean;
  mediaPlayer: MediaPlayer;
  setSmartOrder: (smartOrder: boolean) => void;
  setHideTrash: (hideTrash: boolean) => void;
  setMediaPlayer: (mediaPlayer: MediaPlayer) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      smartOrder: false,
      hideTrash: false,
      mediaPlayer: MediaPlayer.EMBED,
      setSmartOrder: (smartOrder) => set({ smartOrder }),
      setHideTrash: (hideTrash) => set({ hideTrash }),
      setMediaPlayer: (mediaPlayer) => set({ mediaPlayer }),
    }),
    {
      name: 'debridui-settings',
    }
  )
);