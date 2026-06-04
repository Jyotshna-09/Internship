import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { QuizQuestion } from "@/lib/scenes";

interface QuizProps {
  id: string;
  questions: QuizQuestion[];
  onDone: (score: number, total: number) => void;
}

import { audioSystem } from "@/lib/audio";

export function Quiz({ id, questions, onDone }: QuizProps) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [failedCurrent, setFailedCurrent] = useState(false);
  const q = questions[idx];

  function pick(i: number) {
    if (reveal) return;
    setSelected(i);
    setReveal(true);
    
    if (i === q.correct) {
      audioSystem.playSuccess();
      if (!failedCurrent) {
        setScore((s) => s + 1);
      }
    } else {
      audioSystem.playFailure();
      setFailedCurrent(true);
    }
  }

  function next() {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setSelected(null);
      setReveal(false);
      setFailedCurrent(false);
    } else {
      // Calculate final score logic
      const finalScore = score + (selected === q.correct && !failedCurrent ? 1 : 0);
      // Wait, score is already updated in pick(), so we just pass score!
      onDone(score, questions.length);
    }
  }

  function retry() {
    setSelected(null);
    setReveal(false);
  }

  return (
    <div className="glass mx-auto w-full max-w-2xl rounded-3xl p-8" key={id}>
      <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        <span>Quick Check</span>
        <span>Question {idx + 1} / {questions.length}</span>
      </div>
      <h3 className="mb-6 text-2xl font-semibold">{q.q}</h3>
      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          const isCorrect = reveal && i === q.correct;
          const isWrong = reveal && i === selected && i !== q.correct;
          return (
            <motion.button
              key={i}
              whileHover={{ scale: reveal ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => pick(i)}
              className={[
                "rounded-2xl border px-5 py-4 text-left transition-all",
                isCorrect
                  ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
                  : isWrong
                  ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                  : "border-border bg-card/40 hover:bg-card/70",
              ].join(" ")}
            >
              <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {reveal && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-2xl border border-border bg-card/40 p-5"
          >
            <p className="text-sm text-muted-foreground">
              {selected === q.correct ? "✨ Correct!" : "Not quite — try to remember:"}
            </p>
            <p className="mt-2">{q.explain}</p>
            <div className="mt-4 flex gap-3">
              {selected !== q.correct && (
                <button onClick={retry} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-card">
                  Try again
                </button>
              )}
              <button onClick={next} className="btn-magic text-sm">
                {idx + 1 < questions.length ? "Next question" : "Finish quiz"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
