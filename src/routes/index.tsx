import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MoonlitBackground } from "@/components/MoonlitBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SCENES, ALL_BADGES } from "@/lib/scenes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Mystery of the Moonlight Garden — Learn Light & Shadows" },
      {
        name: "description",
        content:
          "A magical adventure for Class 5 students. Learn about light, visibility, reflection and shadows through interactive scenes, quizzes, and badges.",
      },
      { property: "og:title", content: "The Mystery of the Moonlight Garden" },
      {
        property: "og:description",
        content:
          "Become a Light Detective and restore a moonlit garden by mastering the science of light.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <MoonlitBackground />
      <SiteHeader />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-10 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs uppercase tracking-[0.3em] text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-firefly animate-pulse" />
              Class 5 · Science Adventure
            </p>
            <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">
              The Mystery of the{" "}
              <span className="text-glow-moon" style={{ color: "var(--color-moon)" }}>
                Moonlight
              </span>{" "}
              Garden
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              The flowers have vanished. Become a <strong className="text-foreground">Light Detective</strong> and restore the garden by mastering light, shadows and reflection.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/play" className="btn-magic hover:scale-105">
                ▶ Begin the adventure
              </Link>
              <Link
                to="/dashboard"
                className="rounded-full border border-border bg-card/40 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-card"
              >
                My progress
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
              <Stat label="Scenes" value="3" />
              <Stat label="Quizzes" value="6" />
              <Stat label="Badges" value="4" />
            </div>
          </motion.div>

          {/* Character preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative mx-auto"
          >
            <div className="glass relative aspect-square w-[18rem] rounded-[2.5rem] p-8 md:w-[22rem]">
              <DetectiveAvatar />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-card px-5 py-2 text-sm shadow-xl">
                Luna · Light Detective
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Story intro */}
      <section className="relative mx-auto max-w-5xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-10 md:p-14"
        >
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">The Story</p>
          <h2 className="font-display text-3xl md:text-4xl">A garden lost in darkness</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One moonless night, every flower in the garden disappeared. The fireflies whisper that the
            light itself has gone missing. Only a young detective with a curious mind — and a love of
            science — can restore the magic.
          </p>
        </motion.div>
      </section>

      {/* Scenes preview */}
      <section className="relative mx-auto max-w-7xl px-6 py-12">
        <h2 className="mb-2 text-center font-display text-3xl md:text-4xl">Chapters of the adventure</h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
          Each chapter teaches one science idea through play.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {SCENES.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass group rounded-3xl p-7 transition-transform hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full font-display"
                   style={{ background: "var(--gradient-magic)" }}>
                {s.number}
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p>
              <p className="mt-4 text-sm">{s.outcome}</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                +{s.points} pts {s.badge ? `· 🏅 ${s.badge}` : ""}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Outcomes */}
      <section className="relative mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass rounded-3xl p-10">
            <h3 className="font-display text-2xl">What you'll learn</h3>
            <ul className="mt-6 space-y-3 text-muted-foreground">
              {[
                "Why light is needed to see objects",
                "Natural vs artificial light sources",
                "How light travels in straight lines",
                "Reflection with mirrors",
                "How shadows form and change",
              ].map((it) => (
                <li key={it} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full" style={{ background: "var(--color-firefly)" }} />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-3xl p-10">
            <h3 className="font-display text-2xl">Badges to collect</h3>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {ALL_BADGES.map((b) => (
                <div key={b.name} className="rounded-2xl border border-border bg-card/40 p-4">
                  <div className="mb-3 h-10 w-10 rounded-full" style={{ background: "var(--gradient-magic)" }} />
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-4xl px-6 pb-24 text-center">
        <h2 className="font-display text-4xl md:text-5xl">Ready, Detective?</h2>
        <p className="mt-3 text-muted-foreground">The garden is waiting for its light.</p>
        <div className="mt-8">
          <Link to="/play" className="btn-magic text-base hover:scale-105">
            ▶ Play now
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Made with ✨ for curious Class 5 explorers.
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-foreground">{value}</div>
      <div className="uppercase tracking-widest">{label}</div>
    </div>
  );
}

function DetectiveAvatar() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <defs>
        <radialGradient id="halo" cx="50%" cy="40%">
          <stop offset="0%" stopColor="oklch(0.9 0.14 90)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="oklch(0.9 0.14 90)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="95" fill="url(#halo)" />
      {/* Hat */}
      <path d="M55 90 Q100 40 145 90 L150 100 L50 100 Z" fill="#2a1668" />
      <rect x="50" y="98" width="100" height="8" rx="2" fill="#3a2680" />
      {/* Face */}
      <circle cx="100" cy="120" r="32" fill="#f4d9b5" />
      {/* Eyes */}
      <circle cx="90" cy="118" r="3" fill="#1a0b3d" />
      <circle cx="110" cy="118" r="3" fill="#1a0b3d" />
      {/* Smile */}
      <path d="M88 132 Q100 142 112 132" stroke="#1a0b3d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Magnifying glass */}
      <circle cx="150" cy="150" r="18" fill="none" stroke="oklch(0.9 0.14 90)" strokeWidth="4" />
      <line x1="163" y1="163" x2="180" y2="180" stroke="oklch(0.9 0.14 90)" strokeWidth="5" strokeLinecap="round" />
      {/* Firefly */}
      <circle cx="50" cy="60" r="4" fill="oklch(0.88 0.16 195)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
