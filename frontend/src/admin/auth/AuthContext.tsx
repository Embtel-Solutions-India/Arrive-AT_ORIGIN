import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  twoFactorEnabled?: boolean;
}

export type LoginResponse = {
  requires2FA: boolean;
  requiresSetup?: boolean;
  twoFactorTicket?: string;
  user: AdminUser;
  token?: string;
};

export interface Setup2FAResponse {
  secret: string;
  manualEntryKey: string;
  otpauthUrl: string;
  qrCode: string;
  backupCodes: string[];
}

interface AuthValue {
  user: AdminUser | null;
  loading: boolean;
  can: (...permissions: string[]) => boolean;
  login: (input: { email: string; password: string; remember: boolean }) => Promise<LoginResponse>;
  verify2FA: (params: { twoFactorTicket: string; code: string; isRecoveryCode?: boolean }) => Promise<{ user: AdminUser; token: string }>;
  start2FASetup: (twoFactorTicket?: string) => Promise<Setup2FAResponse>;
  confirm2FASetup: (params: {
    twoFactorTicket?: string;
    secret: string;
    code: string;
    backupCodes: string[];
  }) => Promise<{ user: AdminUser; token?: string }>;
  logout: () => Promise<void>;
  setUser: (user: AdminUser | null) => void;
}

const AuthContext = createContext<AuthValue | null>(null);
const ME_KEY = ["admin", "me"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const me = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return (await api.get<{ user: AdminUser }>("/auth/me")).user;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSettled: () => {
      qc.setQueryData(ME_KEY, null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] === "admin" && q.queryKey[1] !== "me" });
    },
  });

  const user = me.data ?? null;

  const login = async (input: { email: string; password: string; remember: boolean }): Promise<LoginResponse> => {
    const data = await api.post<LoginResponse>("/auth/login", input);
    if (!data.requires2FA && data.user) {
      qc.setQueryData(ME_KEY, data.user);
    }
    return data;
  };

  const verify2FA = async (params: {
    twoFactorTicket: string;
    code: string;
    isRecoveryCode?: boolean;
  }): Promise<{ user: AdminUser; token: string }> => {
    const res = await api.post<{ user: AdminUser; token: string }>("/auth/2fa/verify", params);
    qc.setQueryData(ME_KEY, res.user);
    return res;
  };

  const start2FASetup = async (twoFactorTicket?: string): Promise<Setup2FAResponse> => {
    return api.post<Setup2FAResponse>("/auth/2fa/setup/start", { twoFactorTicket });
  };

  const confirm2FASetup = async (params: {
    twoFactorTicket?: string;
    secret: string;
    code: string;
    backupCodes: string[];
  }): Promise<{ user: AdminUser; token?: string }> => {
    const res = await api.post<{ user: AdminUser; token?: string }>("/auth/2fa/setup/confirm", params);
    if (res.user) {
      qc.setQueryData(ME_KEY, res.user);
    }
    return res;
  };

  const value: AuthValue = {
    user,
    loading: me.isLoading,
    can: (...permissions) => !!user && permissions.every((p) => user.permissions.includes(p)),
    login,
    verify2FA,
    start2FASetup,
    confirm2FASetup,
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    setUser: (u) => qc.setQueryData(ME_KEY, u),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
