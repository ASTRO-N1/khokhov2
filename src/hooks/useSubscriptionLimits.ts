import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export type ResourceType = "tournaments" | "matches" | "scorers";

interface Limits {
  tournaments: { used: number; max: number };
  matches: { used: number; max: number };
  scorers: { used: number; max: number };
}

export function useSubscriptionLimits() {
  const [limits, setLimits] = useState<Limits | null>(null);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState("Basic");

  const refreshLimits = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get User Profile (Limits)
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_type, tournaments_limit, matches_limit, scorers_limit")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      setPlanName(profile.plan_type || "Basic");

      // 2. Get Usage Counts
      // A. Tournaments
      const { count: tournamentCount } = await supabase
        .from("tournaments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // B. Matches
      const { count: matchCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // C. Scorers (Profiles created by me)
      const { count: scorerCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id)
        .eq("role", "scorer");

      // FIX: Use ?? (Nullish Coalescing) so 0 is treated as a real number
      setLimits({
        tournaments: {
          used: tournamentCount || 0,
          max: profile.tournaments_limit ?? 5, // Changed || to ??
        },
        matches: {
          used: matchCount || 0,
          max: profile.matches_limit ?? 20, // Changed || to ??
        },
        scorers: {
          used: scorerCount || 0,
          max: profile.scorers_limit ?? 5, // Changed || to ??
        },
      });
    } catch (error) {
      console.error("Error fetching limits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLimits();
  }, []);

  // Helper to check if an action is allowed
  const checkLimit = (resource: ResourceType): boolean => {
    if (!limits) return true; // Default to allow if limits haven't loaded (or block if you prefer)

    const { used, max } = limits[resource];

    // If usage is LESS than max, we are good.
    // Example: Used 0, Max 0 -> 0 < 0 is FALSE. Action Blocked. Correct.
    // Example: Used 0, Max 1 -> 0 < 1 is TRUE. Action Allowed. Correct.
    return used < max;
  };

  return { limits, loading, planName, checkLimit, refreshLimits };
}
