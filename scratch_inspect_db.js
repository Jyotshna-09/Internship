import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || ""
);

async function run() {
  console.log("Supabase URL:", process.env.VITE_SUPABASE_URL);
  
  console.log("Fetching profiles...");
  const { data: profiles, error: pErr } = await supabase.from("profiles").select("*");
  if (pErr) console.error("Profiles error:", pErr);
  else console.log("Profiles count:", profiles.length);

  console.log("Fetching progress...");
  const { data: progress, error: prErr } = await supabase.from("progress").select("*");
  if (prErr) console.error("Progress error:", prErr);
  else console.log("Progress:", JSON.stringify(progress, null, 2));

  console.log("Fetching leaderboard...");
  const { data: leaderboard, error: lErr } = await supabase.from("leaderboard").select("*");
  if (lErr) console.error("Leaderboard error:", lErr);
  else console.log("Leaderboard:", JSON.stringify(leaderboard, null, 2));
}

run();
