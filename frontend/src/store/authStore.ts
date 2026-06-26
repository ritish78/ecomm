import { AuthState } from "@/types/user.types";
import { create } from "zustand";

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isRestoring: true,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
  setRestoring: (value) => set({ isRestoring: value }),
}));
