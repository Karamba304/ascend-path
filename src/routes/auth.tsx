import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search["mode"] === "login" ? ("login" as const) : ("signup" as const),
  }),
  head: () => ({
    meta: [
      { title: "Créer ton compte — ASCEND" },
      { name: "description", content: "Crée ton compte ASCEND et commence ta progression dès aujourd'hui." },
      { property: "og:title", content: "Créer ton compte — ASCEND" },
      { property: "og:description", content: "Inscription immédiate, sans vérification d'email." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useAuth();

  const [isLogin, setIsLogin] = useState(mode === "login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionLoading && session) navigate({ to: "/today" });
  }, [session, sessionLoading, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/today" });
      } else {
        if (username.trim().length < 2) throw new Error("Choisis un pseudo d'au moins 2 caractères.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/today`,
            data: { username: username.trim() },
          },
        });
        if (error) throw error;
        navigate({ to: "/onboarding" });
      }
    } catch (error) {
      toast.error(translateAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background grid-backdrop px-5 py-12">
      <div className="panel w-full max-w-md animate-rise p-6 sm:p-8">
        <Link to="/" className="font-display text-xs font-bold tracking-[0.3em] text-primary">
          ASCEND
        </Link>
        <h1 className="mt-5 font-display text-2xl font-bold">
          {isLogin ? "Content de te revoir" : "Créer ton compte"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isLogin
            ? "Reprends ta progression là où tu l'as laissée."
            : "Pas de vérification d'email : tu commences immédiatement."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {!isLogin ? (
            <Field label="Pseudo">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="nickname"
                className="input-base"
                placeholder="ton pseudo"
              />
            </Field>
          ) : null}
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input-base"
              placeholder="toi@exemple.com"
            />
          </Field>
          <Field label="Mot de passe">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="input-base"
              placeholder="au moins 6 caractères"
            />
          </Field>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary py-3 font-display text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "…" : isLogin ? "SE CONNECTER" : "CRÉER MON COMPTE"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin((v) => !v)}
          className="mt-5 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {isLogin ? "Pas encore de compte ? Créer un compte" : "J'ai déjà un compte"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function translateAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (message.includes("already registered")) return "Un compte existe déjà avec cet email.";
  if (message.includes("Password should be")) return "Mot de passe trop court (6 caractères minimum).";
  return message;
}
