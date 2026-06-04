import { motion, AnimatePresence } from "framer-motion";

export function BadgeUnlock({
  open,
  badge,
  onClose,
}: {
  open: boolean;
  badge: string | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="glass relative rounded-3xl p-10 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="mx-auto h-28 w-28 rounded-full"
              style={{ background: "var(--gradient-magic)", boxShadow: "var(--shadow-glow-magic)" }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">Badge Unlocked</p>
            <h3 className="mt-2 text-3xl font-display text-glow-magic">{badge}</h3>
            <button onClick={onClose} className="btn-moon mt-6 text-sm hover:scale-105">
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
