import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASCEND — ton système de progression personnalisée" },
      {
        name: "description",
        content:
          "Définis n'importe quel objectif, reçois chaque jour des missions adaptées à ton niveau, ton temps et tes contraintes.",
      },
      { property: "og:title", content: "ASCEND — ton système de progression personnalisée" },
      {
        property: "og:description",
        content: "Un objectif libre, une évaluation adaptée, des missions qui évoluent avec toi.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && session && splashDone) navigate({ to: "/today" });
  }, [loading, session, splashDone, navigate]);

  if (!splashDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background grid-backdrop">
        <div className="animate-pulse-ring text-center">
          <p className="font-display text-4xl font-bold tracking-[0.3em] text-primary text-glow">
            ASCEND
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.4em] text-muted-foreground">
            système de progression
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background grid-backdrop px-5 py-12">
      <div className="mx-auto w-full max-w-xl animate-rise">
        <p className="font-display text-sm font-bold tracking-[0.3em] text-primary">ASCEND</p>
        <h1 className="mt-8 font-display text-4xl font-bold leading-tight sm:text-5xl">
          Ton objectif. Ta progression. Chaque jour.
        </h1>
        <p className="mt-5 text-base text-muted-foreground">
          Écris l'objectif que tu veux vraiment atteindre. ASCEND l'analyse, évalue ton point de
          départ, puis construit chaque journée avec des missions qui ont une raison d'exister —
          adaptées à ton niveau, ton temps et tes contraintes réelles.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
          <li>• Des missions choisies, jamais du remplissage.</li>
          <li>• Une difficulté qui suit tes tendances, pas une seule mauvaise journée.</li>
          <li>• De l'XP et des niveaux qui mesurent ta progression dans l'app, jamais ta valeur.</li>
        </ul>
      </div>

      <div className="mx-auto mt-10 w-full max-w-xl space-y-3">
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="block w-full rounded-xl bg-primary py-3.5 text-center font-display text-sm font-semibold tracking-wide text-primary-foreground"
        >
          COMMENCER
        </Link>
        <Link
          to="/auth"
          search={{ mode: "login" }}
          className="block w-full rounded-xl border border-border py-3.5 text-center text-sm text-foreground"
        >
          SE CONNECTER
        </Link>
        <p className="pt-2 text-center text-xs text-muted-foreground">
          ASCEND t'accompagne, sans jamais promettre que l'objectif sera atteint.
        </p>
      </div>
    </div>
  );
}
