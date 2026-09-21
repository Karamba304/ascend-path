import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  Domain,
  MissionHistoryEntry,
  ObjectiveProfile,
  ResourceTag,
} from "@/lib/domain/types";
import { XP_BY_DIFFICULTY, type Difficulty } from "@/lib/domain/xp";
import { planDay, type DayPlan } from "@/lib/engine/day-planner";
import { usageToday } from "@/lib/engine/load-engine";

export type Db = SupabaseClient<Database>;
export type ObjectiveRow = Database["public"]["Tables"]["objectives"]["Row"];
export type MissionRow = Database["public"]["Tables"]["missions"]["Row"];

export const DAILY_XP_CAP = 900;
export const MAX_MISSIONS_PER_DAY = 5;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function weekdayKey(dateIso: string): string {
  const days = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  return days[new Date(`${dateIso}T12:00:00Z`).getUTCDay()]!;
}

interface ObjectiveParameters {
  discipline?: string | null;
  ambitious?: boolean;
  resources?: ResourceTag[];
  answers?: Record<string, string | string[]>;
}

export function objectiveParameters(objective: ObjectiveRow): ObjectiveParameters {
  return (objective.objective_parameters ?? {}) as ObjectiveParameters;
}

/** Profil de progression (niveau PERSONNEL — jamais le niveau XP de l'app). */
export async function loadProfileLevels(
  db: Db,
  objective: ObjectiveRow,
): Promise<ObjectiveProfile> {
  const { data } = await db
    .from("personal_levels")
    .select("metric, value, date")
    .eq("objective_id", objective.id)
    .order("date", { ascending: false });

  const latest = new Map<string, number>();
  for (const row of data ?? []) {
    if (!latest.has(row.metric)) latest.set(row.metric, Number(row.value));
  }

  const params = objectiveParameters(objective);
  return {
    domain: objective.domain as Domain,
    discipline: params.discipline ?? null,
    ambitious: params.ambitious ?? false,
    levels: [...latest.entries()].map(([metric, value]) => ({ metric, value })),
  };
}

/** Historique utilisé par le moteur (feedback, rotation, charge). */
export async function loadHistory(db: Db, userId: string): Promise<MissionHistoryEntry[]> {
  const since = new Date(Date.now() - 45 * 86_400_000).toISOString();
  const { data } = await db
    .from("mission_results")
    .select(
      "completion_date, final_status, perceived_difficulty, not_done_reason, missions(id, title, skill, family, difficulty, duration, constraints)",
    )
    .eq("user_id", userId)
    .gte("completion_date", since)
    .order("completion_date", { ascending: true });

  return (data ?? [])
    .filter((row) => row.missions)
    .map((row) => {
      const mission = row.missions as unknown as MissionRow;
      const constraints = (mission.constraints ?? {}) as { intensity?: number };
      return {
        templateId: templateIdOf(mission),
        skill: mission.skill,
        family: mission.family,
        date: row.completion_date,
        difficulty: mission.difficulty as Difficulty,
        intensity: constraints.intensity ?? 3,
        finalStatus: row.final_status === "done" ? "done" : row.final_status === "deleted" ? "deleted" : "not_done",
        perceivedDifficulty: row.perceived_difficulty,
        duration: mission.duration,
      } satisfies MissionHistoryEntry;
    });
}

function templateIdOf(mission: MissionRow): string | null {
  const constraints = (mission.constraints ?? {}) as { templateId?: string };
  return constraints.templateId ?? null;
}

export interface GenerationResult {
  plan: DayPlan;
  inserted: MissionRow[];
  skipped: "avant_date_de_debut" | "jour_non_disponible" | "deja_genere" | null;
}

/**
 * Génère la journée si elle n'existe pas encore. Idempotent : une seule
 * génération par jour et par objectif (pas de doublons au refresh).
 */
export async function ensureDayPlan(input: {
  db: Db;
  userId: string;
  objective: ObjectiveRow;
  date?: string;
  force?: boolean;
  availableMinutesToday?: number;
  unavailable?: ResourceTag[];
}): Promise<GenerationResult | null> {
  const date = input.date ?? todayIso();

  if (date < input.objective.start_date) {
    return { plan: emptyPlan(), inserted: [], skipped: "avant_date_de_debut" };
  }

  const days = input.objective.available_days ?? [];
  if (days.length > 0 && !days.includes(weekdayKey(date))) {
    return { plan: emptyPlan(), inserted: [], skipped: "jour_non_disponible" };
  }

  const { data: existing } = await input.db
    .from("missions")
    .select("*")
    .eq("objective_id", input.objective.id)
    .eq("date", date);

  const alive = (existing ?? []).filter((m) => m.status !== "deleted");
  if (alive.length > 0 && !input.force) {
    return { plan: emptyPlan(), inserted: [], skipped: "deja_genere" };
  }

  const profile = await loadProfileLevels(input.db, input.objective);
  const history = await loadHistory(input.db, input.userId);
  const params = objectiveParameters(input.objective);

  const doneToday = alive
    .filter((m) => m.status === "done")
    .map((m) => ({
      duration: m.duration,
      intensity: ((m.constraints ?? {}) as { intensity?: number }).intensity ?? 3,
      difficulty: m.difficulty as Difficulty,
    }));

  const plan = planDay({
    date,
    profile,
    resources: params.resources ?? [],
    dailyMinutes: input.objective.daily_time ?? 30,
    history,
    targetDate: input.objective.target_date,
    unavailable: input.unavailable ?? [],
    availableMinutesToday: input.availableMinutesToday ?? input.objective.daily_time ?? 30,
    usedToday: usageToday(doneToday),
    excludeTemplateIds: alive.map((m) => templateIdOf(m) ?? "").filter(Boolean),
    maxMissions: Math.max(1, MAX_MISSIONS_PER_DAY - alive.length),
  });

  if (plan.missions.length === 0) return { plan, inserted: [], skipped: null };

  const rows = plan.missions.map((m) => ({
    user_id: input.userId,
    objective_id: input.objective.id,
    date,
    title: m.title,
    description: m.description,
    reason: m.reason,
    family: m.family,
    skill: m.skill,
    duration: m.duration,
    difficulty: m.difficulty as Database["public"]["Enums"]["mission_difficulty"],
    // Le serveur est la seule autorité sur l'XP : barème fixe, jamais choisi.
    xp: XP_BY_DIFFICULTY[m.difficulty],
    steps: m.steps,
    constraints: { templateId: m.templateId, intensity: m.intensity, requires: m.requires },
    prerequisites: {},
    source: "engine",
    status: "todo" as const,
  }));

  const { data: inserted, error } = await input.db.from("missions").insert(rows).select("*");
  if (error) throw new Error(error.message);

  return { plan, inserted: inserted ?? [], skipped: null };
}

export function emptyPlan(): DayPlan {
  return {
    missions: [],
    budget: {
      availableMinutes: 0,
      consumedMinutes: 0,
      remainingMinutes: 0,
      availableLoad: 0,
      consumedLoad: 0,
      remainingLoad: 0,
      recentLoad: 0,
    },
    contextSentence: "",
    recoveryIncluded: false,
    feasibility: null,
    rejected: [],
  };
}

/** XP gagnée aujourd'hui, pour la protection contre le farming artificiel. */
export async function xpEarnedToday(db: Db, userId: string): Promise<number> {
  const start = `${todayIso()}T00:00:00.000Z`;
  const { data } = await db
    .from("xp_events")
    .select("amount")
    .eq("user_id", userId)
    .gte("date", start);
  return (data ?? []).reduce((acc, row) => acc + Number(row.amount), 0);
}
