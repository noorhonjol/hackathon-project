-- ============================================================================
-- Qoffa — Initial Schema
-- ============================================================================
-- Tables: profiles, stores, reports, points_ledger, daily_point_caps
-- Trigger: auto-create profile row on auth.users insert (Supabase Auth)
-- RLS: enabled on all tables; permissive read for authenticated users
-- ============================================================================

-- 1. PROFILES ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id          uuid PRIMARY KEY,                     -- matches auth.users id
    role        text DEFAULT NULL                     -- 'citizen','store_owner','admin'
                CHECK (role IS NULL OR role IN ('citizen', 'store_owner', 'admin')),
    display_name text,
    points_total int NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. STORES ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stores (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name              text NOT NULL,
    qr_code           text NOT NULL UNIQUE,
    bags_avoided_count int NOT NULL DEFAULT 0,
    points_total      int NOT NULL DEFAULT 0,
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- 3. REPORTS -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lat               float NOT NULL,
    lng               float NOT NULL,
    photo_before_url  text NOT NULL,
    photo_after_url   text,
    status            text NOT NULL DEFAULT 'pending_review'
                      CHECK (status IN ('pending_review','rejected','open','claimed','cleaned')),
    claimed_by_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
    cleaned_by_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 4. POINTS LEDGER -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS points_ledger (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
    store_id      uuid REFERENCES stores(id) ON DELETE CASCADE,
    amount        int NOT NULL,
    source        text NOT NULL
                  CHECK (source IN ('store_scan', 'report_approved', 'report_cleaned')),
    reference_id  uuid,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- 5. DAILY POINT CAPS --------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_point_caps (
    profile_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date          date NOT NULL,
    points_earned int NOT NULL DEFAULT 0,
    PRIMARY KEY (profile_id, date)
);

-- Indexes for common queries -------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_stores_owner_id       ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id   ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status        ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at    ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_points_ledger_profile  ON points_ledger(profile_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_store    ON points_ledger(store_id);
CREATE INDEX IF NOT EXISTS idx_daily_point_caps_date  ON daily_point_caps(date);

-- 6. TRIGGER — auto-create profile on auth sign-up (Supabase Auth) -----------
-- NOTE: This function + trigger rely on the `auth` schema which exists
-- automatically on Supabase-managed Postgres instances.  On a standalone
-- Postgres the trigger will simply never fire; the tables work without it.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$;

-- Drop first so the migration is idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. ROW LEVEL SECURITY ------------------------------------------------------
-- RLS is enforced by Supabase's API gateway.  The FastAPI backend uses the
-- service_role key and bypasses RLS entirely.  Policies below allow
-- authenticated users to read all rows (the front-end may need to show
-- store / report listings).  Write operations go through the backend only.

ALTER TABLE IF EXISTS profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS points_ledger  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_point_caps ENABLE ROW LEVEL SECURITY;

-- Per-drop to keep the migration re-runnable
DROP POLICY IF EXISTS "Authenticated users can read all profiles"       ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all stores"         ON stores;
DROP POLICY IF EXISTS "Authenticated users can read all reports"        ON reports;
DROP POLICY IF EXISTS "Authenticated users can read all points_ledger"  ON points_ledger;
DROP POLICY IF EXISTS "Authenticated users can read all daily_point_caps" ON daily_point_caps;

CREATE POLICY "Authenticated users can read all profiles"
    ON profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all stores"
    ON stores FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all reports"
    ON reports FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all points_ledger"
    ON points_ledger FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all daily_point_caps"
    ON daily_point_caps FOR SELECT USING (auth.role() = 'authenticated');