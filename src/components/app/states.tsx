import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function LoadingPanel({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="panel flex items-center justify-center gap-3 p-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="panel p-6">
      <h3 className="font-display text-base font-semibold">Ça n'a pas chargé</h3>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Réessayer
        </button>
      ) : null}
    </div>
  );
}

export function EmptyPanel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="panel p-6 text-center">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {children ? <div className="mt-2 text-sm text-muted-foreground">{children}</div> : null}
    </div>
  );
}
