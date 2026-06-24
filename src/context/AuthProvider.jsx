import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext.js";
import {
  getActiveSession,
  onAuthStateChange,
  getCorporateUserData,
  signOut,
} from "../services/loginService";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    const { data, error } = await getCorporateUserData(session.user.id);
    if (error) {
      console.error("Error cargando datos corporativos:", error);
      setUser({
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.email?.split("@")[0] || "Usuario",
        role: null,
        department: null,
        companies: [],
        activeCompany: null,
        avatarUrl: null,
        isActive: true,
      });
    } else {
      setUser(data);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    getActiveSession().then(({ session }) => {
      if (!mounted) return;
      setSession(session);
      if (session) {
        loadUserData(session).then(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const subscription = onAuthStateChange((session) => {
      if (!mounted) return;
      setSession(session);
      if (session) {
        loadUserData(session);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setSession(null);
    setUser(null);
  }, []);

  const value = {
    session,
    user,
    loading,
    isAuthenticated: !!session,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
