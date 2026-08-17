import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { apiFetch } from "../services/api";
import type { ProfileResponse } from "../types/api";

export function useProfile() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          const data = await apiFetch<ProfileResponse>("/profile/me", token);
          setProfile(data);
        }
      } catch {
        // Profile not found yet — user hasn't completed onboarding
      }
      setLoading(false);
    })();
  }, []);

  return { profile, loading };
}