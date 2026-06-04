import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !profile) {
      navigate({ to: "/login" });
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <motion.div
            className="mx-auto h-16 w-16 rounded-full border-4 border-t-ring border-r-transparent border-b-transparent border-l-transparent"
            style={{ borderColor: "var(--color-ring) transparent transparent transparent" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading adventure...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return <>{children}</>;
}
