import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { audioSystem } from "@/lib/audio";
import { LogOut, Settings } from "lucide-react";

export function SiteHeader() {
  const { profile, signOut } = useAuth();
  
  const handlePlayClick = () => {
    audioSystem.playClick();
  };

  const handleSignOut = () => {
    audioSystem.playClick();
    signOut();
  };

  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" onClick={handlePlayClick} className="flex items-center gap-3">
          <span className="inline-block h-8 w-8 rounded-full" style={{ background: "var(--gradient-moon)", boxShadow: "var(--shadow-glow-moon)" }} />
          <span className="font-display text-lg tracking-wide text-glow-moon">
            Moonlight Garden
          </span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/" onClick={handlePlayClick} className="hover:text-foreground transition-colors">Story</Link>
          <Link to="/dashboard" onClick={handlePlayClick} className="hover:text-foreground transition-colors">Dashboard</Link>
          <Link to="/play" onClick={handlePlayClick} className="hover:text-foreground transition-colors">Play</Link>
          <Link to="/settings" onClick={handlePlayClick} className="hover:text-foreground transition-colors">Settings</Link>
        </nav>
        <div className="flex items-center gap-4">
          {profile ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Hi, <span className="text-foreground font-semibold">{profile.name}</span>
              </span>
              <button
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-rose-300 transition-colors p-1.5 rounded-full hover:bg-white/5"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={handlePlayClick} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Log In
            </Link>
          )}
          <Link to="/play" onClick={handlePlayClick} className="btn-magic text-sm hover:scale-105">
            Play
          </Link>
        </div>
      </div>
    </header>
  );
}
