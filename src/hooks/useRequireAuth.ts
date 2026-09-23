import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useAuth } from "./useAuth";

/** Garde côté client : renvoie vers l'authentification si aucune session. */
export function useRequireAuth() {
  const { session, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  return { session, user, loading };
}
