import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "../lib/api";

type User = {
  id: number;
  email: string;
  name: string;
  emailVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const res = await apiFetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status < 500) setUser(null);
        return;
      }

      const data = await res.json();
      setUser(data);
    } catch (error) {
      console.error("Could not check authentication:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
