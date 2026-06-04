import { useEffect, useState, useCallback } from "react";
import { supabase, hasSupabaseConfig } from "./supabase";
import { SCENES, SceneId } from "./scenes";

export interface GameState {
  playerName: string;
  totalScore: number;
  completedScenes: SceneId[];
  badges: string[];
  quizResults: Record<string, { score: number; total: number; attempts: number }>;
}

const KEY = "moonlight_garden_v1";

const empty: GameState = {
  playerName: "",
  totalScore: 0,
  completedScenes: [],
  badges: [],
  quizResults: {},
};

// Read local state
function readLocal(): GameState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // Check if guest name is set in auth storage
      const guestName = localStorage.getItem("moonlight_guest_name");
      if (guestName) return { ...empty, playerName: guestName };
      return empty;
    }
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

// Write local state and dispatch update
function writeLocal(state: GameState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("moonlight:update"));
}

// Sync local state to Supabase
export async function syncLocalToSupabase() {
  if (!hasSupabaseConfig) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const local = readLocal();
    const userId = session.user.id;

    // 1. Fetch remote data to merge
    const [remoteProgress, remoteBadges, remoteQuizzes, profileResult] = await Promise.all([
      supabase.from("progress").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("badges").select("badge_name").eq("user_id", userId),
      supabase.from("quiz_results").select("*").eq("user_id", userId),
      supabase.from("profiles").select("name").eq("id", userId).maybeSingle()
    ]);

    // Name merge
    let finalName = local.playerName || profileResult.data?.name || "Detective";
    if (profileResult.data?.name && !local.playerName) {
      local.playerName = profileResult.data.name;
    }

    // Completed scenes merge
    const remoteCompleted = (remoteProgress.data?.completed_levels as SceneId[]) || [];
    const mergedScenes = Array.from(new Set([...local.completedScenes, ...remoteCompleted])) as SceneId[];

    // Badges merge
    const remoteBadgeNames = remoteBadges.data?.map(b => b.badge_name) || [];
    const mergedBadges = Array.from(new Set([...local.badges, ...remoteBadgeNames]));

    // Quiz results merge
    const mergedQuizzes = { ...local.quizResults };
    remoteQuizzes.data?.forEach((q: any) => {
      const chId = SCENES.find(s => s.number === q.chapter)?.id;
      if (chId) {
        const localQ = mergedQuizzes[chId];
        mergedQuizzes[chId] = {
          score: Math.max(localQ?.score || 0, q.score),
          total: q.total || localQ?.total || 2, // fallback
          attempts: Math.max(localQ?.attempts || 0, q.attempts)
        };
      }
    });

    // Recompute total score based on unique completed scenes
    const finalScore = mergedScenes.reduce((total, scId) => {
      const sc = SCENES.find(s => s.id === scId);
      return total + (sc ? sc.points : 0);
    }, 0);

    // Auto-unlock Light Detective Master if all 6 chapters are completed
    if (mergedScenes.length === 6 && !mergedBadges.includes("Light Detective Master")) {
      mergedBadges.push("Light Detective Master");
    }

    const mergedState: GameState = {
      playerName: finalName,
      totalScore: finalScore,
      completedScenes: mergedScenes,
      badges: mergedBadges,
      quizResults: mergedQuizzes
    };

    // Update local storage with merged state
    writeLocal(mergedState);

    // 2. Upload merged state to Supabase
    await Promise.all([
      // Profile update if name changed
      supabase.from("profiles").update({ name: finalName }).eq("id", userId),
      
      // Progress upsert
      supabase.from("progress").upsert({
        user_id: userId,
        current_level: mergedScenes.length + 1,
        completed_levels: mergedScenes,
        progress_percentage: Math.round((mergedScenes.length / SCENES.length) * 100),
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" }),

      // Leaderboard upsert
      supabase.from("leaderboard").upsert({
        user_id: userId,
        total_score: finalScore,
        last_updated: new Date().toISOString()
      }, { onConflict: "user_id" }),

      // Badges upload (insert ignore conflicts)
      ...mergedBadges.map(badge => 
        supabase.from("badges").upsert({
          user_id: userId,
          badge_name: badge,
          earned_at: new Date().toISOString()
        }, { onConflict: "user_id,badge_name" })
      ),

      // Quiz results upload
      ...Object.keys(mergedQuizzes).map(chId => {
        const q = mergedQuizzes[chId];
        const chNum = SCENES.find(s => s.id === chId)?.number || 1;
        return supabase.from("quiz_results").upsert({
          user_id: userId,
          chapter: chNum,
          score: q.score,
          attempts: q.attempts,
          created_at: new Date().toISOString()
        }, { onConflict: "user_id,chapter" }); // assuming unique user_id + chapter constraint added or handle normal upserts
      })
    ]);

  } catch (error) {
    console.error("Sync error:", error);
  }
}

export function useGame() {
  const [state, setState] = useState<GameState>(empty);

  const fetchAndLoad = useCallback(() => {
    setState(readLocal());
  }, []);

  useEffect(() => {
    fetchAndLoad();
    
    // Initial sync
    syncLocalToSupabase();

    const onUpdate = () => fetchAndLoad();
    window.addEventListener("moonlight:update", onUpdate);
    window.addEventListener("storage", onUpdate);
    window.addEventListener("online", syncLocalToSupabase);

    // Set up auth state change triggers
    let unsubscribeAuth: (() => void) | undefined;
    if (hasSupabaseConfig) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        syncLocalToSupabase();
      });
      unsubscribeAuth = subscription.unsubscribe;
    }

    return () => {
      window.removeEventListener("moonlight:update", onUpdate);
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("online", syncLocalToSupabase);
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [fetchAndLoad]);

  const setName = useCallback(async (playerName: string) => {
    const s = readLocal();
    const next = { ...s, playerName };
    writeLocal(next);

    // Save to guest storage if guest
    const guestName = localStorage.getItem("moonlight_guest_name");
    if (guestName) {
      localStorage.setItem("moonlight_guest_name", playerName);
    }

    if (hasSupabaseConfig) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from("profiles")
          .update({ name: playerName })
          .eq("id", session.user.id);
        
        await syncLocalToSupabase();
      }
    }
  }, []);

  const completeScene = useCallback(
    async (id: SceneId, points: number, badge?: string) => {
      const s = readLocal();
      const next: GameState = { ...s };
      if (!next.completedScenes.includes(id)) {
        next.completedScenes = [...next.completedScenes, id];
        next.totalScore = s.totalScore + points;
      }
      if (badge && !next.badges.includes(badge)) {
        next.badges = [...next.badges, badge];
      }

      // Check for grand master badge
      if (next.completedScenes.length === 6 && !next.badges.includes("Light Detective Master")) {
        next.badges = [...next.badges, "Light Detective Master"];
      }

      writeLocal(next);

      if (hasSupabaseConfig) {
        await syncLocalToSupabase();
      }
    },
    [],
  );

  const recordQuiz = useCallback(
    async (id: string, score: number, total: number) => {
      const s = readLocal();
      const prev = s.quizResults[id];
      const next: GameState = {
        ...s,
        quizResults: {
          ...s.quizResults,
          [id]: {
            score,
            total,
            attempts: (prev?.attempts ?? 0) + 1,
          },
        },
      };
      writeLocal(next);

      if (hasSupabaseConfig) {
        await syncLocalToSupabase();
      }
    },
    [],
  );

  const reset = useCallback(async () => {
    writeLocal(empty);
    localStorage.removeItem("moonlight_guest_name");

    if (hasSupabaseConfig) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;
        
        // Reset Supabase tables
        await Promise.all([
          supabase.from("progress").delete().eq("user_id", userId),
          supabase.from("badges").delete().eq("user_id", userId),
          supabase.from("quiz_results").delete().eq("user_id", userId),
          supabase.from("certificates").delete().eq("user_id", userId),
          supabase.from("leaderboard").upsert({
            user_id: userId,
            total_score: 0,
            last_updated: new Date().toISOString()
          }, { onConflict: "user_id" })
        ]);
      }
    }
  }, []);

  return { state, setName, completeScene, recordQuiz, reset };
}
