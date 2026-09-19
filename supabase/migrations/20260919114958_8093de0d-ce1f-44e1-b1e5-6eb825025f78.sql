-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.objective_domain AS ENUM ('sport','langues','etudes','programmation','lecture','mental','creation','habitudes','quantitatif','complexe');
CREATE TYPE public.objective_status AS ENUM ('active','paused','completed','abandoned');
CREATE TYPE public.mission_difficulty AS ENUM ('tres_facile','facile','moyenne','difficile','tres_difficile');
CREATE TYPE public.mission_status AS ENUM ('todo','in_progress','done','not_done','deleted');
CREATE TYPE public.perceived_difficulty AS ENUM ('trop_facile','comme_prevu','trop_difficile');
CREATE TYPE public.test_status AS ENUM ('planned','done','skipped');
CREATE TYPE public.challenge_status AS ENUM ('active','completed','failed','expired');

-- UTIL
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  app_level INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Protect server-controlled profile columns from client updates
CREATE OR REPLACE FUNCTION public.protect_profile_progress()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('role', true) = 'authenticated' THEN
    NEW.total_xp := OLD.total_xp;
    NEW.app_level := OLD.app_level;
    NEW.current_streak := OLD.current_streak;
    NEW.best_streak := OLD.best_streak;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER profiles_protect_progress BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_progress();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'username',''), split_part(NEW.email, '@', 1), 'joueur'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- OBJECTIVES
CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  domain public.objective_domain NOT NULL,
  type TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  daily_time INTEGER,
  weekly_time INTEGER,
  available_days TEXT[] NOT NULL DEFAULT '{}',
  status public.objective_status NOT NULL DEFAULT 'active',
  objective_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX objectives_user_idx ON public.objectives (user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objectives TO authenticated;
GRANT ALL ON public.objectives TO service_role;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "objectives_own" ON public.objectives FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER objectives_updated_at BEFORE UPDATE ON public.objectives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PERSONAL LEVELS
CREATE TABLE public.personal_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  objective_id UUID NOT NULL REFERENCES public.objectives ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  origin TEXT,
  comment TEXT
);
CREATE INDEX personal_levels_objective_idx ON public.personal_levels (objective_id, metric, date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_levels TO authenticated;
GRANT ALL ON public.personal_levels TO service_role;
ALTER TABLE public.personal_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_levels_own" ON public.personal_levels FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TESTS
CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  objective_id UUID NOT NULL REFERENCES public.objectives ON DELETE CASCADE,
  title TEXT NOT NULL,
  metric TEXT,
  planned_date DATE,
  completed_date DATE,
  result NUMERIC,
  unit TEXT,
  status public.test_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tests_objective_idx ON public.tests (objective_id, status, planned_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tests TO authenticated;
GRANT ALL ON public.tests TO service_role;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tests_own" ON public.tests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- MISSIONS
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  objective_id UUID NOT NULL REFERENCES public.objectives ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT,
  date DATE NOT NULL,
  duration INTEGER NOT NULL,
  difficulty public.mission_difficulty NOT NULL,
  xp INTEGER NOT NULL,
  status public.mission_status NOT NULL DEFAULT 'todo',
  source TEXT,
  family TEXT,
  skill TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
  prerequisites JSONB NOT NULL DEFAULT '[]'::jsonb,
  deleted_reason TEXT,
  replaced_mission_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX missions_user_date_idx ON public.missions (user_id, date, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions_own" ON public.missions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER missions_updated_at BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MISSION RESULTS
CREATE TABLE public.mission_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions ON DELETE CASCADE,
  final_status public.mission_status NOT NULL,
  completion_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  actual_duration INTEGER,
  perceived_difficulty public.perceived_difficulty,
  not_done_reason TEXT,
  comment TEXT,
  performance_data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX mission_results_mission_idx ON public.mission_results (mission_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mission_results TO authenticated;
GRANT ALL ON public.mission_results TO service_role;
ALTER TABLE public.mission_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mission_results_own" ON public.mission_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- XP EVENTS (server-written only)
CREATE TABLE public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  mission_id UUID REFERENCES public.missions ON DELETE SET NULL,
  challenge_id UUID,
  date TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX xp_events_user_idx ON public.xp_events (user_id, date DESC);
GRANT SELECT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp_events_select_own" ON public.xp_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- LEVEL EVENTS (server-written only)
CREATE TABLE public.level_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  old_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX level_events_user_idx ON public.level_events (user_id, date DESC);
GRANT SELECT ON public.level_events TO authenticated;
GRANT ALL ON public.level_events TO service_role;
ALTER TABLE public.level_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "level_events_select_own" ON public.level_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- CHALLENGES
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  objective_id UUID REFERENCES public.objectives ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_progress INTEGER NOT NULL DEFAULT 0,
  required_progress INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status public.challenge_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX challenges_user_idx ON public.challenges (user_id, status);
GRANT SELECT ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_select_own" ON public.challenges FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- CONTEXT ADAPTATIONS
CREATE TABLE public.context_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  original_mission_id UUID REFERENCES public.missions ON DELETE SET NULL,
  replacement_mission_id UUID REFERENCES public.missions ON DELETE SET NULL,
  reason TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX context_adaptations_user_idx ON public.context_adaptations (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.context_adaptations TO authenticated;
GRANT ALL ON public.context_adaptations TO service_role;
ALTER TABLE public.context_adaptations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "context_adaptations_select_own" ON public.context_adaptations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "context_adaptations_insert_own" ON public.context_adaptations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);