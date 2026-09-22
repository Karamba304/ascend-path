import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { levelFromXp, XP_BY_DIFFICULTY, type Difficulty } from "@/lib/domain/xp";
import type { ResourceTag } from "@/lib/domain/types";
import { buildInitialProfile, dimensionsFor } from "@/lib/engine/profile-manager";
import { analyzeObjective } from "@/lib/engine/objective-analyzer";
import { classifyChange, findAdaptation, shrinkToFit } from "@/lib/engine/context-adapter";
import { buildLoadBudget, usageToday } from "@/lib/engine/load-engine";
import { levelDelta } from "@/lib/engine/feedback-learner";
import {
  DAILY_XP_CAP,
  ensureDayPlan,
  loadHistory,
  loadProfileLevels,
  objectiveParameters,
  todayIso,
  weekdayKey,
  type Db,
  type MissionRow,
  type ObjectiveRow,
} from "./engine.server";

const RESOURCES = [
  "terrain",
  "salle",
  "ballon",
  "materiel_sport",
  "espace_interieur",
  "exterieur",
  "ordinateur",
  "internet",
  "livre",
  "audio",
  "partenaire",
  "calme",
  "cahier",
] as const;

const DOMAINS = [
  "sport",
  "langues",
  "etudes",
  "programmation",
  "lecture",
  "mental",
  "creation",
  "habitudes",
  "quantitatif",
  "complexe",
] as const;

/* ------------------------------------------------------------------ */
/* Lecture du jour                                                     */
/* ------------------------------------------------------------------ */

export const getSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;

    const { data: profile } = await db
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const { data: objective } = await db
      .from("objectives")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (!objective) {
      return { profile, objective: null, missions: [], budget: null, context: null, levels: [], nextTest: null };
    }

    const date = todayIso();
    let skipped: string | null = null;
    try {
      const generation = await ensureDayPlan({ db, userId, objective, date });
      skipped = generation?.skipped ?? null;
    } catch (error) {
      console.error("[engine] génération impossible", error);
    }

    const { data: missions } = await db
      .from("missions")
      .select("*")
      .eq("objective_id", objective.id)
      .eq("date", date)
      .neq("status", "deleted")
      .order("created_at", { ascending: true });

    const list = missions ?? [];
    const history = await loadHistory(db, userId);
    const profileLevels = await loadProfileLevels(db, objective);

    const done = list
      .filter((m) => m.status === "done")
      .map((m) => ({
        duration: m.duration,
        intensity: intensityOf(m),
        difficulty: m.difficulty as Difficulty,
      }));

    const budget = buildLoadBudget({
      availableMinutes: objective.daily_time ?? 30,
      dailyMinutes: objective.daily_time ?? 30,
      history,
      usedToday: usageToday(done),
    });

    const { data: nextTest } = await db
      .from("tests")
      .select("*")
      .eq("objective_id", objective.id)
      .eq("status", "planned")
      .order("planned_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    return {
      profile,
      objective,
      missions: list,
      budget,
      levels: profileLevels.levels,
      nextTest,
      context: {
        skipped,
        startsLater: date < objective.start_date,
        dayOff:
          (objective.available_days ?? []).length > 0 &&
          !(objective.available_days ?? []).includes(weekdayKey(date)),
      },
    };
  });

/* ------------------------------------------------------------------ */
/* Création de l'objectif (fin d'onboarding)                           */
/* ------------------------------------------------------------------ */

const createObjectiveSchema = z.object({
  title: z.string().min(3).max(300),
  domain: z.enum(DOMAINS).optional(),
  discipline: z.string().max(60).nullable().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  dailyMinutes: z.number().int().min(5).max(360),
  weeklyMinutes: z.number().int().min(5).max(3000).nullable().optional(),
  availableDays: z.array(z.string()).max(7),
  resources: z.array(z.enum(RESOURCES)).max(20),
  answers: z.record(z.union([z.string(), z.array(z.string())])).default({}),
});

export const createObjective = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createObjectiveSchema.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;

    const analysis = analyzeObjective(data.title);
    const domain = data.domain ?? analysis.domain;
    const discipline = data.discipline ?? analysis.discipline;

    // Un seul objectif actif en bêta.
    await db.from("objectives").update({ status: "paused" }).eq("user_id", userId).eq("status", "active");

    const { data: objective, error } = await db
      .from("objectives")
      .insert({
        user_id: userId,
        title: data.title,
        domain,
        type: analysis.ambitious ? "ambitieux" : "standard",
        start_date: data.startDate,
        target_date: data.targetDate ?? null,
        daily_time: data.dailyMinutes,
        weekly_time: data.weeklyMinutes ?? data.dailyMinutes * Math.max(1, data.availableDays.length),
        available_days: data.availableDays,
        status: "active",
        objective_parameters: {
          discipline,
          ambitious: analysis.ambitious,
          resources: data.resources,
          answers: data.answers,
        },
      })
      .select("*")
      .single();

    if (error || !objective) throw new Error(error?.message ?? "Création impossible");

    const profile = buildInitialProfile({
      domain,
      discipline: discipline ?? null,
      ambitious: analysis.ambitious,
      answers: data.answers,
    });

    await db.from("personal_levels").insert(
      profile.levels.map((l) => ({
        user_id: userId,
        objective_id: objective.id,
        metric: l.metric,
        value: l.value,
        origin: "declaration",
      })),
    );

    // Premier test de référence planifié à deux semaines.
    const plannedDate = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
    await db.from("tests").insert({
      user_id: userId,
      objective_id: objective.id,
      title: "Première évaluation de référence",
      metric: dimensionsFor(domain, discipline ?? null)[0] ?? "progression",
      planned_date: plannedDate,
      status: "planned",
    });

    // Challenge simple de la semaine.
    await db.from("challenges").insert({
      user_id: userId,
      objective_id: objective.id,
      title: "Réaliser 4 sessions cette semaine",
      description: "Quatre missions terminées avant la fin de la semaine.",
      required_progress: 4,
      xp_reward: 500,
      condition: { type: "missions_done", window: "week" },
      status: "active",
      end_date: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
    });

    return { objectiveId: objective.id };
  });

/* ------------------------------------------------------------------ */
/* Cycle de vie d'une mission                                          */
/* ------------------------------------------------------------------ */

export const startMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ missionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    const { data: mission } = await db
      .from("missions")
      .select("*")
      .eq("id", data.missionId)
      .maybeSingle();
    if (!mission) throw new Error("Mission introuvable");
    if (mission.status === "done") return { status: mission.status };

    await db.from("missions").update({ status: "in_progress" }).eq("id", mission.id);
    return { status: "in_progress" as const };
  });

const completeSchema = z.object({
  missionId: z.string().uuid(),
  perceivedDifficulty: z.enum(["trop_facile", "comme_prevu", "trop_difficile"]).nullable().optional(),
  comment: z.string().max(1000).nullable().optional(),
  actualDuration: z.number().int().min(1).max(600).nullable().optional(),
});

export const completeMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => completeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;

    const { data: mission } = await db
      .from("missions")
      .select("*")
      .eq("id", data.missionId)
      .maybeSingle();
    if (!mission) throw new Error("Mission introuvable");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Idempotence : une mission ne peut jamais être validée deux fois.
    const { data: existingResult } = await supabaseAdmin
      .from("mission_results")
      .select("id, final_status")
      .eq("mission_id", mission.id)
      .maybeSingle();

    const { data: profileBefore } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!profileBefore) throw new Error("Profil introuvable");

    if (existingResult && existingResult.final_status === "done") {
      // On autorise seulement l'ajout du feedback manquant.
      if (data.perceivedDifficulty) {
        await supabaseAdmin
          .from("mission_results")
          .update({
            perceived_difficulty: data.perceivedDifficulty,
            comment: data.comment ?? null,
          })
          .eq("id", existingResult.id);
      }
      return {
        alreadyDone: true,
        xpAwarded: 0,
        totalXp: profileBefore.total_xp,
        appLevel: profileBefore.app_level,
        leveledUp: false,
        capped: false,
      };
    }

    // XP : barème serveur uniquement, jamais la valeur envoyée par le client.
    const barème = XP_BY_DIFFICULTY[mission.difficulty as Difficulty];
    const earnedToday = await xpToday(supabaseAdmin as unknown as Db, userId);
    const capped = earnedToday >= DAILY_XP_CAP;
    const xpAwarded = capped ? 0 : Math.min(barème, DAILY_XP_CAP - earnedToday);

    await supabaseAdmin
      .from("missions")
      .update({ status: "done" })
      .eq("id", mission.id);

    await supabaseAdmin.from("mission_results").insert({
      user_id: userId,
      mission_id: mission.id,
      final_status: "done",
      perceived_difficulty: data.perceivedDifficulty ?? null,
      comment: data.comment ?? null,
      actual_duration: data.actualDuration ?? mission.duration,
      performance_data: {},
    });

    if (xpAwarded > 0) {
      await supabaseAdmin.from("xp_events").insert({
        user_id: userId,
        mission_id: mission.id,
        amount: xpAwarded,
        source: "mission",
      });
    }

    const totalXp = profileBefore.total_xp + xpAwarded;
    const newLevel = levelFromXp(totalXp);
    const leveledUp = newLevel > profileBefore.app_level;

    const streak = nextStreak(profileBefore.last_login, profileBefore.current_streak);
    await supabaseAdmin
      .from("profiles")
      .update({
        total_xp: totalXp,
        app_level: newLevel,
        current_streak: streak,
        best_streak: Math.max(profileBefore.best_streak, streak),
        last_login: new Date().toISOString(),
      })
      .eq("id", userId);

    if (leveledUp) {
      await supabaseAdmin.from("level_events").insert({
        user_id: userId,
        old_level: profileBefore.app_level,
        new_level: newLevel,
      });
    }

    // Niveau PERSONNEL : ajusté séparément du niveau XP de l'application.
    if (mission.skill) {
      const delta = levelDelta({
        finalStatus: "done",
        perceivedDifficulty: data.perceivedDifficulty ?? null,
      });
      if (delta !== 0) {
        const { data: last } = await supabaseAdmin
          .from("personal_levels")
          .select("value")
          .eq("objective_id", mission.objective_id)
          .eq("metric", mission.skill)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();
        const base = Number(last?.value ?? 25);
        await supabaseAdmin.from("personal_levels").insert({
          user_id: userId,
          objective_id: mission.objective_id,
          metric: mission.skill,
          value: Math.min(98, base + delta),
          origin: "mission",
        });
      }
    }

    await advanceChallenges(supabaseAdmin as unknown as Db, userId);

    return {
      alreadyDone: false,
      xpAwarded,
      totalXp,
      appLevel: newLevel,
      leveledUp,
      capped,
    };
  });

const notDoneSchema = z.object({
  missionId: z.string().uuid(),
  reason: z.enum([
    "pas_assez_de_temps",
    "trop_difficile",
    "trop_facile",
    "impossible_actuellement",
    "hors_objectif",
    "autre",
  ]),
  comment: z.string().max(1000).nullable().optional(),
  redoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  wantReplacement: z.boolean().default(false),
});

export const markMissionNotDone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => notDoneSchema.parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;

    const { data: mission } = await db
      .from("missions")
      .select("*")
      .eq("id", data.missionId)
      .maybeSingle();
    if (!mission) throw new Error("Mission introuvable");

    const reschedule = Boolean(data.redoDate);
    // Aucune XP n'est jamais retirée.
    await db
      .from("missions")
      .update({
        status: reschedule ? "todo" : "deleted",
        date: data.redoDate ?? mission.date,
        deleted_reason: reschedule ? null : data.reason,
      })
      .eq("id", mission.id);

    await db.from("mission_results").insert({
      user_id: userId,
      mission_id: mission.id,
      final_status: reschedule ? "not_done" : "deleted",
      not_done_reason: data.reason,
      comment: data.comment ?? null,
      performance_data: {},
    });

    let replacement: MissionRow | null = null;
    if (data.wantReplacement) {
      replacement = await buildReplacement(db, userId, mission);
    }

    return { rescheduled: reschedule, replacement };
  });

/* ------------------------------------------------------------------ */
/* Contexte qui change / régénération                                  */
/* ------------------------------------------------------------------ */

const adaptSchema = z.object({
  unavailable: z.array(z.enum(RESOURCES)).max(20).default([]),
  availableMinutesToday: z.number().int().min(5).max(360).nullable().optional(),
});

export const adaptToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => adaptSchema.parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;
    const date = todayIso();

    const objective = await activeObjective(db, userId);
    if (!objective) throw new Error("Aucun objectif actif");

    const params = objectiveParameters(objective);
    const resources = params.resources ?? [];
    const unavailable = data.unavailable as ResourceTag[];

    const { data: missions } = await db
      .from("missions")
      .select("*")
      .eq("objective_id", objective.id)
      .eq("date", date)
      .in("status", ["todo", "in_progress"]);

    const pending = missions ?? [];
    const doneMinutes = await minutesDoneToday(db, objective.id, date);
    const remainingMinutes = Math.max(
      0,
      (data.availableMinutesToday ?? objective.daily_time ?? 30) - doneMinutes,
    );

    const severity = classifyChange({
      missions: pending.map(toPlanned),
      unavailable,
      remainingMinutes,
    });

    if (severity === "majeur") {
      // Reconstruction de la journée restante.
      for (const mission of pending) {
        await db
          .from("missions")
          .update({ status: "deleted", deleted_reason: "contexte_modifie" })
          .eq("id", mission.id);
      }
      const result = await ensureDayPlan({
        db,
        userId,
        objective,
        date,
        force: true,
        availableMinutesToday: remainingMinutes,
        unavailable,
      });
      return { severity, rebuilt: true, adapted: result?.inserted.length ?? 0 };
    }

    let adapted = 0;
    for (const mission of pending) {
      const planned = toPlanned(mission);
      const blocked = planned.requires.some((r) => unavailable.includes(r));

      if (!blocked && planned.duration <= remainingMinutes) continue;

      if (!blocked) {
        const shrunk = shrinkToFit(planned, remainingMinutes);
        if (shrunk) {
          await db.from("missions").update({ duration: shrunk.duration }).eq("id", mission.id);
          adapted += 1;
          continue;
        }
      }

      const alternative = findAdaptation(planned, { resources, unavailable, remainingMinutes });
      if (!alternative) continue;

      const difficulty = mission.difficulty as Difficulty;
      const duration = Math.max(5, Math.min(alternative.baseDuration, remainingMinutes));
      await db
        .from("missions")
        .update({
          title: alternative.title,
          description: alternative.description,
          reason: alternative.purpose,
          family: alternative.family,
          skill: alternative.skill,
          duration,
          steps: alternative.steps ?? [],
          constraints: {
            templateId: alternative.id,
            intensity: alternative.intensity,
            requires: alternative.requires,
          },
          source: "context_adapter",
        })
        .eq("id", mission.id);

      await db.from("context_adaptations").insert({
        user_id: userId,
        original_mission_id: mission.id,
        reason: "contexte_modifie",
        context: { unavailable, remainingMinutes, difficulty },
      });
      adapted += 1;
    }

    return { severity, rebuilt: false, adapted };
  });

export const regenerateToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;
    const objective = await activeObjective(db, userId);
    if (!objective) throw new Error("Aucun objectif actif");
    const date = todayIso();

    const { data: pending } = await db
      .from("missions")
      .select("id")
      .eq("objective_id", objective.id)
      .eq("date", date)
      .in("status", ["todo", "in_progress"]);

    for (const mission of pending ?? []) {
      await db
        .from("missions")
        .update({ status: "deleted", deleted_reason: "regeneration" })
        .eq("id", mission.id);
    }

    const result = await ensureDayPlan({ db, userId, objective, date, force: true });
    return { created: result?.inserted.length ?? 0 };
  });

/* ------------------------------------------------------------------ */
/* Progression, historique, tests, paramètres                          */
/* ------------------------------------------------------------------ */

export const getProgression = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;

    const { data: profile } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
    const objective = await activeObjective(db, userId);

    const { data: levelEvents } = await db
      .from("level_events")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    const { data: xpEvents } = await db
      .from("xp_events")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(60);

    let levels: { metric: string; value: number }[] = [];
    let tests: Database_Tests = [];
    let missionStats = { done: 0, notDone: 0, deleted: 0, minutes: 0 };

    if (objective) {
      const profileLevels = await loadProfileLevels(db, objective);
      levels = profileLevels.levels;

      const { data: testRows } = await db
        .from("tests")
        .select("*")
        .eq("objective_id", objective.id)
        .order("planned_date", { ascending: true });
      tests = testRows ?? [];

      const { data: missions } = await db
        .from("missions")
        .select("status, duration")
        .eq("objective_id", objective.id);
      for (const mission of missions ?? []) {
        if (mission.status === "done") {
          missionStats.done += 1;
          missionStats.minutes += mission.duration;
        } else if (mission.status === "not_done") missionStats.notDone += 1;
        else if (mission.status === "deleted") missionStats.deleted += 1;
      }
    }

    const { data: challenges } = await db
      .from("challenges")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });

    return {
      profile,
      objective,
      levelEvents: levelEvents ?? [],
      xpEvents: xpEvents ?? [],
      levels,
      tests,
      challenges: challenges ?? [],
      missionStats,
    };
  });

type Database_Tests = { id: string; title: string; metric: string | null; result: number | null; unit: string | null; planned_date: string | null; completed_date: string | null; status: string }[];

export const getHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;

    const { data: results } = await db
      .from("mission_results")
      .select(
        "id, completion_date, final_status, perceived_difficulty, not_done_reason, comment, missions(title, skill, family, difficulty, duration, xp)",
      )
      .eq("user_id", userId)
      .order("completion_date", { ascending: false })
      .limit(120);

    const { data: xpEvents } = await db
      .from("xp_events")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(120);

    const { data: levelEvents } = await db
      .from("level_events")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    const { data: tests } = await db
      .from("tests")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "done")
      .order("completed_date", { ascending: false });

    return {
      results: results ?? [],
      xpEvents: xpEvents ?? [],
      levelEvents: levelEvents ?? [],
      tests: tests ?? [],
    };
  });

export const getTests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;
    const objective = await activeObjective(db, userId);
    if (!objective) return { objective: null, tests: [], levels: [] };

    const { data: tests } = await db
      .from("tests")
      .select("*")
      .eq("objective_id", objective.id)
      .order("planned_date", { ascending: false });

    const profileLevels = await loadProfileLevels(db, objective);
    return { objective, tests: tests ?? [], levels: profileLevels.levels };
  });

const testSchema = z.object({
  testId: z.string().uuid().nullable().optional(),
  title: z.string().min(2).max(160),
  metric: z.string().min(1).max(60),
  result: z.number().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  record: z.boolean().default(true),
  /** Niveau personnel déclaré après le test (0-100), optionnel. */
  personalLevel: z.number().int().min(0).max(100).nullable().optional(),
});

export const saveTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => testSchema.parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;
    const objective = await activeObjective(db, userId);
    if (!objective) throw new Error("Aucun objectif actif");

    const payload = {
      user_id: userId,
      objective_id: objective.id,
      title: data.title,
      metric: data.metric,
      result: data.result ?? null,
      unit: data.unit ?? null,
      planned_date: data.plannedDate ?? null,
      completed_date: data.record ? new Date().toISOString() : null,
      status: (data.record ? "done" : "planned") as "done" | "planned",
    };

    if (data.testId) {
      await db.from("tests").update(payload).eq("id", data.testId);
    } else {
      await db.from("tests").insert(payload);
    }

    if (data.record && data.personalLevel !== null && data.personalLevel !== undefined) {
      await db.from("personal_levels").insert({
        user_id: userId,
        objective_id: objective.id,
        metric: data.metric,
        value: data.personalLevel,
        origin: "test",
      });
    }

    return { ok: true };
  });

const settingsSchema = z.object({
  username: z.string().min(2).max(40).optional(),
  settings: z
    .object({
      notifications: z.boolean().optional(),
      reminders: z.boolean().optional(),
      theme: z.enum(["sombre", "clair"]).optional(),
      langue: z.enum(["fr", "en"]).optional(),
      dailyMinutes: z.number().int().min(5).max(360).optional(),
    })
    .optional(),
  dailyMinutes: z.number().int().min(5).max(360).optional(),
  availableDays: z.array(z.string()).max(7).optional(),
});

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => settingsSchema.parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;

    if (data.username || data.settings) {
      const { data: current } = await db
        .from("profiles")
        .select("settings")
        .eq("id", userId)
        .maybeSingle();
      const merged = { ...((current?.settings ?? {}) as object), ...(data.settings ?? {}) };
      const update: Record<string, unknown> = { settings: merged };
      if (data.username) update.username = data.username;
      await db.from("profiles").update(update as never).eq("id", userId);
    }

    if (data.dailyMinutes || data.availableDays) {
      const objective = await activeObjective(db, userId);
      if (objective) {
        const update: { daily_time?: number; available_days?: string[] } = {};
        if (data.dailyMinutes) update.daily_time = data.dailyMinutes;
        if (data.availableDays) update.available_days = data.availableDays;
        await db.from("objectives").update(update).eq("id", objective.id);
      }
    }

    return { ok: true };
  });

export const deleteAccountData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Helpers serveur                                                     */
/* ------------------------------------------------------------------ */

async function activeObjective(db: Db, userId: string): Promise<ObjectiveRow | null> {
  const { data } = await db
    .from("objectives")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .maybeSingle();
  return data ?? null;
}

async function xpToday(db: Db, userId: string): Promise<number> {
  const start = `${todayIso()}T00:00:00.000Z`;
  const { data } = await db
    .from("xp_events")
    .select("amount")
    .eq("user_id", userId)
    .gte("date", start);
  return (data ?? []).reduce((acc, row) => acc + Number(row.amount), 0);
}

async function minutesDoneToday(db: Db, objectiveId: string, date: string): Promise<number> {
  const { data } = await db
    .from("missions")
    .select("duration")
    .eq("objective_id", objectiveId)
    .eq("date", date)
    .eq("status", "done");
  return (data ?? []).reduce((acc, m) => acc + m.duration, 0);
}

function intensityOf(mission: MissionRow): number {
  return ((mission.constraints ?? {}) as { intensity?: number }).intensity ?? 3;
}

function toPlanned(mission: MissionRow) {
  const constraints = (mission.constraints ?? {}) as {
    templateId?: string;
    intensity?: number;
    requires?: ResourceTag[];
  };
  return {
    templateId: constraints.templateId ?? "",
    title: mission.title,
    description: mission.description ?? "",
    reason: mission.reason ?? "",
    family: (mission.family ?? "pratique") as never,
    skill: mission.skill ?? "",
    duration: mission.duration,
    difficulty: mission.difficulty as Difficulty,
    xp: mission.xp,
    steps: (mission.steps ?? []) as string[],
    requires: constraints.requires ?? [],
    intensity: constraints.intensity ?? 3,
  };
}

/** Mission de remplacement compatible avec le temps et la charge restants. */
async function buildReplacement(
  db: Db,
  userId: string,
  mission: MissionRow,
): Promise<MissionRow | null> {
  const { data: objective } = await db
    .from("objectives")
    .select("*")
    .eq("id", mission.objective_id)
    .maybeSingle();
  if (!objective) return null;

  const doneMinutes = await minutesDoneToday(db, objective.id, mission.date);
  const remaining = Math.max(0, (objective.daily_time ?? 30) - doneMinutes);
  if (remaining < 5) return null;

  const result = await ensureDayPlan({
    db,
    userId,
    objective,
    date: todayIso(),
    force: true,
    availableMinutesToday: remaining,
  });

  const created = result?.inserted?.[0] ?? null;
  if (created) {
    await db
      .from("missions")
      .update({ replaced_mission_id: mission.id, source: "replacement" })
      .eq("id", created.id);
    await db.from("context_adaptations").insert({
      user_id: userId,
      original_mission_id: mission.id,
      replacement_mission_id: created.id,
      reason: mission.deleted_reason ?? "non_terminee",
      context: { remaining },
    });
  }
  return created;
}

/** Streak : au moins une mission terminée dans la journée. */
function nextStreak(lastLogin: string | null, current: number): number {
  if (!lastLogin) return Math.max(1, current);
  const last = lastLogin.slice(0, 10);
  const today = todayIso();
  if (last === today) return Math.max(1, current);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (last === yesterday) return current + 1;
  return 1;
}

async function advanceChallenges(db: Db, userId: string): Promise<void> {
  const { data: challenges } = await db
    .from("challenges")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");

  for (const challenge of challenges ?? []) {
    const progress = challenge.current_progress + 1;
    const completed = progress >= challenge.required_progress;
    await db
      .from("challenges")
      .update({
        current_progress: progress,
        status: completed ? "completed" : "active",
      })
      .eq("id", challenge.id);

    if (completed && challenge.xp_reward > 0) {
      const earned = await xpToday(db, userId);
      const grant = Math.max(0, Math.min(challenge.xp_reward, DAILY_XP_CAP - earned));
      if (grant > 0) {
        await db.from("xp_events").insert({
          user_id: userId,
          challenge_id: challenge.id,
          amount: grant,
          source: "challenge",
        });
        const { data: profile } = await db
          .from("profiles")
          .select("total_xp, app_level")
          .eq("id", userId)
          .maybeSingle();
        if (!profile) continue;
        const totalXp = profile.total_xp + grant;
        await db
          .from("profiles")
          .update({ total_xp: totalXp, app_level: levelFromXp(totalXp) })
          .eq("id", userId);
      }
    }
  }
}
