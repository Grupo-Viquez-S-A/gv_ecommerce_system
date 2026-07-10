import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext.js";

import {
  getActiveSession,
  onAuthStateChange,
  getCorporateUserData,
  signOut,
} from "../services/loginService";

function isPasswordResetRoute() {
  const basePath =
    import.meta.env.BASE_URL === "/"
      ? ""
      : import.meta.env.BASE_URL.replace(/\/$/, "");

  return window.location.pathname === `${basePath}/restablecer-contrasena`;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const mustChangePassword =
    session?.user?.app_metadata?.must_change_password === true;

  const loadUserData = useCallback(async (session) => {
    if (!session?.user || isPasswordResetRoute()) {
      setUser(null);
      return;
    }
    const { data, error } = await getCorporateUserData(session.user.id, session.user.email);
    if (error) {
      console.error("Error cargando datos corporativos:", error);
      await signOut();
      setSession(null);
      setUser(null);
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
    mustChangePassword,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


