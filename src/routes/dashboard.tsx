import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MoonlitBackground } from "@/components/MoonlitBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { useGame } from "@/lib/game-state";
import { SCENES, ALL_BADGES } from "@/lib/scenes";
import { useAuth } from "@/hooks/useAuth";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";
import { audioSystem } from "@/lib/audio";
import { Trophy, Award, BookOpen, Download, Settings, RefreshCw } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your progress — Moonlight Garden" },
      { name: "description", content: "Track levels, scores, and badges you've earned in The Mystery of the Moonlight Garden." },
    ],
  }),
  component: Dashboard,
});

interface LeaderboardUser {
  userId: string;
  name: string;
  score: number;
  completedCount: number;
}

function Dashboard() {
  const { state, setName, reset } = useGame();
  const { profile, isGuest } = useAuth();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleReset = async () => {
    if (confirm("Are you absolutely sure you want to reset all progress? This will delete all your badges and scores permanently.")) {
      audioSystem.playFailure();
      await reset();
      alert("Progress reset successful!");
    }
  };

  const totalPossibleScore = SCENES.reduce((a, s) => a + s.points, 0);
  const completionPercentage = totalPossibleScore > 0 ? Math.round((state.totalScore / totalPossibleScore) * 100) : 0;
  const isGameFinished = state.completedScenes.length === SCENES.length;

  // Calculate quiz accuracy
  const totalQuizzes = Object.keys(state.quizResults).length;
  const totalCorrect = Object.values(state.quizResults).reduce((sum, res) => sum + res.score, 0);
  const totalQuestions = Object.values(state.quizResults).reduce((sum, res) => sum + res.total, 0);
  const quizAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Fetch Leaderboard
  const fetchLeaderboard = async () => {
    if (!hasSupabaseConfig) {
      // Mock leaderboard if Supabase is offline
      setLeaderboard([
        { userId: "1", name: "Detective Ada", score: 850, completedCount: 6 },
        { userId: "2", name: "Detective Isaac", score: 720, completedCount: 5 },
        { userId: "3", name: "Detective Marie", score: 600, completedCount: 4 },
        { userId: "4", name: state.playerName || "You (Guest)", score: state.totalScore, completedCount: state.completedScenes.length }
      ].sort((a, b) => b.score - a.score));
      return;
    }

    setLoadingLeaderboard(true);
    try {
      const { data: leaderboardData, error: lbError } = await supabase
        .from("leaderboard")
        .select(`
          user_id,
          total_score,
          profiles:user_id (name)
        `)
        .order("total_score", { ascending: false });

      if (!lbError && leaderboardData) {
        // Fetch progress for each leaderboard user
        const { data: progressData } = await supabase
          .from("progress")
          .select("user_id, completed_levels");

        const mapped = leaderboardData.map((item: any) => {
          const userProg = progressData?.find((p) => p.user_id === item.user_id);
          const completedCount = userProg ? (userProg.completed_levels as string[]).length : 0;
          return {
            userId: item.user_id,
            name: item.profiles?.name || "Anonymous Detective",
            score: item.total_score,
            completedCount,
          };
        });

        // Ensure current player is added if not yet in database
        if (profile?.id && !mapped.some(m => m.userId === profile.id)) {
          mapped.push({
            userId: profile.id,
            name: profile.name || "You",
            score: state.totalScore,
            completedCount: state.completedScenes.length
          });
        }

        setLeaderboard(mapped.sort((a, b) => b.score - a.score));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Fetch user certificate if exists
  const fetchCertificate = async () => {
    if (isGuest || !hasSupabaseConfig || !profile?.id) return;
    const { data, error } = await supabase
      .from("certificates")
      .select("certificate_url")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!error && data) {
      setCertificateUrl(data.certificate_url);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchCertificate();

    if (!hasSupabaseConfig) return;

    // Realtime subscriptions
    const channel = supabase
      .channel("leaderboard-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "leaderboard" }, () => {
        fetchLeaderboard();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "progress" }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, state.totalScore, state.completedScenes.length]);

  // Generate Certificate PDF
  const generateCertificate = async () => {
    if (generatingCert) return;
    setGeneratingCert(true);
    audioSystem.playClick();

    // Dynamically import jsPDF to prevent SSR execution reference errors
    const { jsPDF } = await import("jspdf");

    const nameToUse = state.playerName || profile?.name || "Light Detective";
    const dateStr = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not construct 2D context");

      // 1. Background Gradient
      const grad = ctx.createRadialGradient(400, 300, 50, 400, 300, 450);
      grad.addColorStop(0, "#191144");
      grad.addColorStop(1, "#07071c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 600);

      // 2. Add decorative stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 37) % 760 + 20;
        const sy = (i * 19) % 560 + 20;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Double Gold Border
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 760, 560);
      ctx.strokeStyle = "#ffeaa7";
      ctx.lineWidth = 1;
      ctx.strokeRect(27, 27, 746, 546);

      // 4. Decorative Corner Designs
      const drawCorner = (cx: number, cy: number, rot: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(0, 0);
        ctx.lineTo(20, 0);
        ctx.stroke();
        ctx.restore();
      };
      drawCorner(20, 20, 0);
      drawCorner(780, 20, Math.PI / 2);
      drawCorner(780, 580, Math.PI);
      drawCorner(20, 580, -Math.PI / 2);

      // 5. Header Title
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffeaa7";
      ctx.font = "italic normal 16px Georgia, serif";
      ctx.fillText("THE MYSTERY OF THE MOONLIGHT GARDEN", 400, 100);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px 'Fraunces', serif";
      ctx.fillText("Certificate of Achievement", 400, 145);

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("This is proudly awarded to", 400, 210);

      // 6. Player Name
      ctx.fillStyle = "#ffd166";
      ctx.font = "italic bold 42px Georgia, serif";
      ctx.fillText(nameToUse, 400, 270);

      // 7. Core achievement description
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(
        "for successfully mastering the science of Light, Shadows, and Reflection,",
        400,
        330
      );
      ctx.fillText("solving all puzzle chapters, and restoring the Moonlight Garden.", 400, 355);

      // 8. Statistics Box
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(200, 395, 400, 60);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.strokeRect(200, 395, 400, 60);

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "10px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("FINAL SCORE", 270, 415);
      ctx.fillText("COMPLETION", 400, 415);
      ctx.fillText("AWARD LEVEL", 530, 415);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`${state.totalScore} pts`, 270, 438);
      ctx.fillText("100%", 400, 438);
      ctx.fillStyle = "#88ecff";
      ctx.fillText("Light Detective Master", 530, 438);

      // 9. Signatures and Date
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("DATE", 150, 520);
      ctx.fillText("COUNCIL SIGNATURE", 650, 520);

      ctx.fillStyle = "#ffffff";
      ctx.font = "13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(dateStr, 150, 495);

      ctx.fillStyle = "#ffeaa7";
      ctx.font = "italic 20px 'Georgia', serif";
      ctx.fillText("Luna of the Garden", 650, 495);
      
      // Draw signature line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(70, 505);
      ctx.lineTo(230, 505);
      ctx.moveTo(570, 505);
      ctx.lineTo(730, 505);
      ctx.stroke();

      // 10. Draw a decorative detective gold seal in the center bottom
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(400, 505, 24, 0, Math.PI * 2);
      ctx.fill();
      
      // Seal star
      ctx.fillStyle = "#191144";
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 12 + 400,
                   Math.sin((18 + i * 72) * Math.PI / 180) * 12 + 505);
        ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 5 + 400,
                   Math.sin((54 + i * 72) * Math.PI / 180) * 5 + 505);
      }
      ctx.closePath();
      ctx.fill();

      // Convert canvas to image & load into PDF
      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [800, 600],
      });
      doc.addImage(imgData, "PNG", 0, 0, 800, 600);

      if (isGuest || !hasSupabaseConfig || !profile?.id) {
        // Direct download for guests
        doc.save(`${nameToUse.replace(/\s+/g, "_")}_moonlight_certificate.pdf`);
        audioSystem.playSuccess();
      } else {
        // Upload to storage for signed-in users
        const pdfBlob = doc.output("blob");
        const path = `${profile.id}/certificate.pdf`;

        // 1. Upload file
        const { error: uploadError } = await supabase.storage
          .from("certificates")
          .upload(path, pdfBlob, { upsert: true });

        if (uploadError) throw uploadError;

        // 2. Fetch URL
        const { data: urlData } = supabase.storage
          .from("certificates")
          .getPublicUrl(path);

        const publicUrl = urlData.publicUrl;

        // 3. Upsert to certificates database
        await supabase.from("certificates").upsert({
          user_id: profile.id,
          certificate_url: publicUrl,
          generated_at: new Date().toISOString(),
        });

        setCertificateUrl(publicUrl);
        
        // Trigger browser download
        doc.save(`${nameToUse.replace(/\s+/g, "_")}_moonlight_certificate.pdf`);
        audioSystem.playSuccess();
      }
    } catch (err) {
      console.error("Certificate generation error:", err);
      alert("Failed to sync certificate with the server, but triggering direct browser download instead!");
      // Fallback direct download
      try {
        const nameToUse = state.playerName || profile?.name || "Light Detective";
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [800, 600],
        });
        doc.setFont("Helvetica", "bold");
        doc.text("THE MYSTERY OF THE MOONLIGHT GARDEN", 400, 200, { align: "center" });
        doc.setFont("Helvetica", "normal");
        doc.text("Certificate of Completion", 400, 250, { align: "center" });
        doc.text(`Awarded to: ${nameToUse}`, 400, 300, { align: "center" });
        doc.text(`Final Score: ${state.totalScore} / ${totalPossibleScore}`, 400, 350, { align: "center" });
        doc.save(`${nameToUse.replace(/\s+/g, "_")}_moonlight_certificate_fallback.pdf`);
      } catch (innerErr) {
        console.error(innerErr);
      }
    } finally {
      setGeneratingCert(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen">
        <MoonlitBackground />
        <SiteHeader />

        <main className="mx-auto max-w-6xl px-6 py-10">
          {/* Header block */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mb-8 flex flex-col gap-6 rounded-3xl p-8 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Detective Dashboard</p>
              <h1 className="mt-1 font-display text-3xl md:text-4xl">
                {profile?.name ? `Detective ${profile.name}` : "Detective"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {isGuest 
                  ? "Playing in Guest Mode. Connect an account to sync progress and show on the leaderboard." 
                  : "Synced with Moonlight database."}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <input
                defaultValue={state.playerName}
                onChange={(e) => setName(e.target.value)}
                placeholder="Edit profile name"
                className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm outline-none focus:border-ring w-48"
              />
              <Link to="/settings" className="rounded-full border border-border bg-card/40 p-2.5 hover:bg-card text-muted-foreground hover:text-foreground transition-colors" title="Settings">
                <Settings className="h-4 w-4" />
              </Link>
              <Link to="/play" className="btn-magic text-sm">
                {state.completedScenes.length > 0 ? "Continue Quest" : "Start Adventure"}
              </Link>
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <div className="grid gap-6 md:grid-cols-4">
            <StatCard icon={<Trophy className="h-5 w-5 text-yellow-300" />} label="Total Score" value={state.totalScore} suffix={` / ${totalPossibleScore}`} />
            <StatCard icon={<BookOpen className="h-5 w-5 text-sky-300" />} label="Completed Chapters" value={state.completedScenes.length} suffix={` / ${SCENES.length}`} />
            <StatCard icon={<Award className="h-5 w-5 text-purple-300" />} label="Badges Collected" value={state.badges.length} suffix={` / ${ALL_BADGES.length}`} />
            <StatCard icon={<RefreshCw className="h-5 w-5 text-emerald-300" />} label="Quiz Accuracy" value={quizAccuracy} suffix="%" />
          </div>

          {/* Progress bar */}
          <div className="mt-8 glass rounded-3xl p-8">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Garden Restoration Completion</span>
              <span className="font-semibold">{completionPercentage}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-card/40">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full"
                style={{ background: "var(--gradient-magic)" }}
              />
            </div>
          </div>

          {/* Certificate Download Panel */}
          {isGameFinished && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-8 rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-purple-500/10 p-8 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div>
                <h3 className="font-display text-2xl text-yellow-300">Quest Fully Completed! 🏆</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  You have solved every chapter, restored moonlight to the garden, and collected all badges. Click below to generate your official, high-resolution downloadable PDF Certificate.
                </p>
              </div>
              <button
                onClick={generateCertificate}
                disabled={generatingCert}
                className="btn-moon flex items-center gap-2 hover:scale-105 disabled:opacity-50 min-w-[220px]"
              >
                <Download className="h-4 w-4" />
                {generatingCert ? "Generating..." : "Download Certificate"}
              </button>
            </motion.div>
          )}

          {/* Main Content Layout */}
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {/* Chapters Progress List */}
            <div className="md:col-span-2 space-y-6">
              <h2 className="font-display text-2xl">Chapters Overview</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {SCENES.map((s) => {
                  const done = state.completedScenes.includes(s.id);
                  const quizRes = state.quizResults[s.id];
                  return (
                    <Link
                      key={s.id}
                      to="/scene/$id"
                      params={{ id: s.id }}
                      className={`glass relative rounded-3xl p-6 transition-transform hover:-translate-y-1 block ${
                        done ? "border-emerald-500/20" : ""
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground">
                          Chapter {s.number}
                        </span>
                        {done && <span className="text-xs text-emerald-300 flex items-center gap-1 font-semibold">✓ Completed</span>}
                      </div>
                      <h3 className="text-lg font-semibold">{s.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{s.subtitle}</p>
                      
                      {done && quizRes ? (
                        <div className="mt-4 text-xs bg-black/25 rounded-lg px-3 py-1.5 inline-block text-muted-foreground">
                          Quiz: <span className="text-foreground font-semibold">{quizRes.score}/{quizRes.total}</span> · Attempts: {quizRes.attempts}
                        </div>
                      ) : (
                        <div className="mt-4 text-xs text-glow-magic uppercase tracking-wider font-semibold">
                          +{s.points} PTS
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Competitive Leaderboard */}
            <div className="glass rounded-3xl p-6 h-fit">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-300" />
                  Leaderboard
                </h2>
                <button onClick={fetchLeaderboard} className="text-xs text-muted-foreground hover:text-foreground">
                  Refresh
                </button>
              </div>

              {loadingLeaderboard ? (
                <p className="text-center text-sm text-muted-foreground py-10 animate-pulse">Retrieving ranks...</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((item, idx) => {
                    const isSelf = profile?.id === item.userId || (isGuest && item.userId === "4");
                    return (
                      <div
                        key={item.userId + idx}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                          isSelf 
                            ? "border-primary/40 bg-primary/10 shadow-[0_0_15px_rgba(180,100,255,0.1)]" 
                            : "border-border/30 bg-card/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-display text-lg font-semibold w-5 text-center ${
                            idx === 0 ? "text-yellow-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-600" : "text-muted-foreground"
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className={`font-semibold text-sm ${isSelf ? "text-glow-magic" : ""}`}>
                              {item.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {item.completedCount} chapters completed
                            </p>
                          </div>
                        </div>
                        <span className="font-display font-bold text-sm text-glow-moon">
                          {item.score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Badges Panel */}
          <section className="mt-10">
            <h2 className="mb-4 font-display text-2xl">Unlocked Badges</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {ALL_BADGES.map((b) => {
                const unlocked = state.badges.includes(b.name);
                return (
                  <div
                    key={b.name}
                    className={`rounded-2xl border p-5 text-center transition ${
                      unlocked 
                        ? "border-border bg-card/60 shadow-[0_4px_30px_rgba(0,0,0,0.1)]" 
                        : "border-border/20 bg-card/10 opacity-30"
                    }`}
                  >
                    <div
                      className="mx-auto mb-3 h-12 w-12 rounded-full flex items-center justify-center text-lg"
                      style={{
                        background: unlocked ? "var(--gradient-magic)" : "rgba(255,255,255,0.05)",
                        boxShadow: unlocked ? "var(--shadow-glow-magic)" : "none",
                      }}
                    >
                      🏅
                    </div>
                    <p className="font-semibold text-sm">{b.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{b.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Clear history footer */}
          <div className="mt-12 text-center border-t border-border/25 pt-6">
            <button
              onClick={handleReset}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-rose-300 transition-colors"
            >
              Reset progress & data
            </button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number; suffix?: string }) {
  return (
    <div className="glass rounded-3xl p-6 flex items-center gap-4">
      <div className="rounded-2xl bg-white/5 p-3 h-fit">
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-3xl text-glow-moon font-semibold">
          {value}
          {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}
