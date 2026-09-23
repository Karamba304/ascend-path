import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { analyzeObjective } from "@/lib/engine/objective-analyzer";
import { DOMAIN_LABEL, type Domain, type ResourceTag } from "@/lib/domain/types";
import { questionsFor, resourcesFor, WEEKDAYS } from "@/lib/onboarding/questions";
import { createObjective } from "@/lib/api/app.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Définis ton objectif — ASCEND" },
      { name: "description", content: "Décris ton objectif, réponds à une évaluation adaptée, et reçois ta première journée." },
      { property: "og:title", content: "Définis ton objectif — ASCEND" },
      { property: "og:description", content: "Une évaluation courte et utile, puis ta première journée de missions." },
    ],
  }),
  component: Onboarding,
});

type Answers = Record<string, string | string[]>;

const STEPS = [
  "objectif",
  "domaine",
  "evaluation",
  "debut",
  "temps",
  "ressources",
  "resume",
] as const;

function Onboarding() {
  const { loading } = useRequireAuth();
  const navigate = useNavigate();
  const create = useServerFn(createObjective);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<Domain | null>(null);
  const [discipline, setDiscipline] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [startChoice, setStartChoice] = useState<"aujourdhui" | "demain" | "date">("aujourdhui");
  const [customStart, setCustomStart] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [days, setDays] = useState<string[]>(["lun", "mar", "mer", "jeu", "ven"]);
  const [resources, setResources] = useState<ResourceTag[]>([]);

  const analysis = useMemo(() => (title.trim().length > 2 ? analyzeObjective(title) : null), [title]);
  const effectiveDomain = domain ?? analysis?.domain ?? "complexe";
  const effectiveDiscipline = discipline ?? analysis?.discipline ?? null;
  const questions = useMemo(
    () => questionsFor(effectiveDomain, effectiveDiscipline),
    [effectiveDomain, effectiveDiscipline],
  );
  const resourceOptions = useMemo(() => resourcesFor(effectiveDomain), [effectiveDomain]);

  const startDate =
    startChoice === "aujourdhui"
      ? isoDay(0)
      : startChoice === "demain"
        ? isoDay(1)
        : customStart || isoDay(0);

  const mutation = useMutation({
    mutationFn: async () =>
      create({
        data: {
          title: title.trim(),
          domain: effectiveDomain,
          discipline: effectiveDiscipline,
          startDate,
          targetDate: targetDate || null,
          dailyMinutes,
          weeklyMinutes: dailyMinutes * Math.max(1, days.length),
          availableDays: days,
          resources,
          answers,
        },
      }),
    onSuccess: () => {
      toast.success("Ta progression est créée.");
      navigate({ to: "/today" });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Création impossible."),
  });

  if (loading) return null;

  const canContinue = (() => {
    if (step === 0) return title.trim().length > 4;
    if (step === 3) return startChoice !== "date" || Boolean(customStart);
    if (step === 4) return days.length > 0 && dailyMinutes >= 5;
    if (step === 5) return resources.length > 0;
    return true;
  })();

  return (
    <div className="min-h-screen bg-background grid-backdrop px-5 py-8">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center gap-2">
          {STEPS.map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full",
                index <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="panel mt-6 animate-rise p-5 sm:p-7">
          {step === 0 ? (
            <Section
              title="Quel est ton objectif ?"
              subtitle="Écris-le avec tes mots. Aucune liste imposée."
            >
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={4}
                placeholder="Ex : je veux devenir footballeur professionnel / apprendre l'espagnol / réussir mon bac"
                className="input-base resize-none"
              />
            </Section>
          ) : null}

          {step === 1 ? (
            <Section
              title="Voici comment je comprends ton objectif"
              subtitle="Tu peux corriger : c'est ce choix qui détermine tes missions."
            >
              <div className="space-y-2">
                {(Object.keys(DOMAIN_LABEL) as Domain[]).map((value) => (
                  <Choice
                    key={value}
                    selected={effectiveDomain === value}
                    label={DOMAIN_LABEL[value]}
                    onClick={() => setDomain(value)}
                  />
                ))}
              </div>
              {effectiveDiscipline ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Discipline détectée : <span className="text-foreground">{effectiveDiscipline}</span>{" "}
                  <button
                    onClick={() => setDiscipline("")}
                    className="ml-2 underline underline-offset-4"
                  >
                    ce n'est pas ça
                  </button>
                </p>
              ) : null}
            </Section>
          ) : null}

          {step === 2 ? (
            <Section
              title="Évaluation"
              subtitle="Uniquement les questions utiles pour construire tes missions."
            >
              <div className="space-y-6">
                {questions.map((question) => (
                  <div key={question.id}>
                    <p className="text-sm font-medium">{question.label}</p>
                    {question.help ? (
                      <p className="mt-1 text-xs text-muted-foreground">{question.help}</p>
                    ) : null}

                    {question.type === "text" ? (
                      <input
                        className="input-base mt-2"
                        value={(answers[question.id] as string) ?? ""}
                        onChange={(e) =>
                          setAnswers({ ...answers, [question.id]: e.target.value })
                        }
                      />
                    ) : null}

                    {question.type === "choice" ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(question.options ?? []).map((option) => (
                          <Pill
                            key={option.value}
                            label={option.label}
                            selected={answers[question.id] === option.value}
                            onClick={() =>
                              setAnswers({ ...answers, [question.id]: option.value })
                            }
                          />
                        ))}
                      </div>
                    ) : null}

                    {question.type === "multi" ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(question.options ?? []).map((option) => {
                          const current = (answers[question.id] as string[]) ?? [];
                          const selected = current.includes(option.value);
                          return (
                            <Pill
                              key={option.value}
                              label={option.label}
                              selected={selected}
                              onClick={() =>
                                setAnswers({
                                  ...answers,
                                  [question.id]: selected
                                    ? current.filter((v) => v !== option.value)
                                    : [...current, option.value],
                                })
                              }
                            />
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {step === 3 ? (
            <Section
              title="Quand commences-tu ?"
              subtitle="Avant cette date, aucune mission n'est générée et rien ne peut être manqué."
            >
              <div className="space-y-2">
                <Choice
                  selected={startChoice === "aujourdhui"}
                  label="Aujourd'hui"
                  onClick={() => setStartChoice("aujourdhui")}
                />
                <Choice
                  selected={startChoice === "demain"}
                  label="Demain"
                  onClick={() => setStartChoice("demain")}
                />
                <Choice
                  selected={startChoice === "date"}
                  label="Une date précise"
                  onClick={() => setStartChoice("date")}
                />
                {startChoice === "date" ? (
                  <input
                    type="date"
                    className="input-base"
                    value={customStart}
                    min={isoDay(0)}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                ) : null}
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium">Une échéance ? (facultatif)</p>
                <input
                  type="date"
                  className="input-base mt-2"
                  value={targetDate}
                  min={isoDay(1)}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </Section>
          ) : null}

          {step === 4 ? (
            <Section title="Ton temps" subtitle="Le temps disponible n'est pas un objectif à remplir.">
              <p className="text-sm font-medium">Temps par jour : {dailyMinutes} min</p>
              <input
                type="range"
                min={10}
                max={180}
                step={5}
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--primary)]"
              />
              <p className="mt-6 text-sm font-medium">Jours disponibles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <Pill
                    key={day.value}
                    label={day.label}
                    selected={days.includes(day.value)}
                    onClick={() =>
                      setDays(
                        days.includes(day.value)
                          ? days.filter((d) => d !== day.value)
                          : [...days, day.value],
                      )
                    }
                  />
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Soit environ {dailyMinutes * Math.max(1, days.length)} min par semaine.
              </p>
            </Section>
          ) : null}

          {step === 5 ? (
            <Section
              title="De quoi disposes-tu ?"
              subtitle="Une mission impossible dans ton contexte ne te sera jamais proposée."
            >
              <div className="flex flex-wrap gap-2">
                {resourceOptions.map((option) => (
                  <Pill
                    key={option.value}
                    label={option.label}
                    selected={resources.includes(option.value)}
                    onClick={() =>
                      setResources(
                        resources.includes(option.value)
                          ? resources.filter((r) => r !== option.value)
                          : [...resources, option.value],
                      )
                    }
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {step === 6 ? (
            <Section title="Résumé" subtitle="Tout est modifiable en revenant en arrière.">
              <dl className="space-y-3 text-sm">
                <Row label="Objectif" value={title} />
                <Row label="Domaine" value={DOMAIN_LABEL[effectiveDomain]} />
                {effectiveDiscipline ? <Row label="Discipline" value={effectiveDiscipline} /> : null}
                <Row label="Début" value={startDate} />
                <Row label="Échéance" value={targetDate || "aucune"} />
                <Row label="Temps par jour" value={`${dailyMinutes} min`} />
                <Row label="Jours" value={days.join(", ") || "—"} />
                <Row
                  label="Ressources"
                  value={
                    resources
                      .map((r) => resourceOptions.find((o) => o.value === r)?.label ?? r)
                      .join(", ") || "—"
                  }
                />
              </dl>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                <Check className="size-4" />
                {mutation.isPending ? "Création…" : "CRÉER MA PROGRESSION"}
              </button>
            </Section>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground disabled:opacity-40"
          >
            <ArrowLeft className="size-4" /> Retour
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canContinue}
              className="flex items-center gap-2 rounded-lg bg-surface-strong px-4 py-2 text-sm disabled:opacity-40"
            >
              Continuer <ArrowRight className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-xl font-bold sm:text-2xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Choice({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
        selected ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

function Pill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm transition-colors",
        selected ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function isoDay(offset: number): string {
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
}
