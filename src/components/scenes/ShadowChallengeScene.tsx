import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { audioSystem } from "@/lib/audio";
import { Zap, Sparkles } from "lucide-react";

type Round = 1 | 2;

export function ShadowChallengeScene({ onComplete }: { onComplete: () => void }) {
  const [round, setRound] = useState<Round>(1);
  
  // Round 1 state: Triangle position
  // position in percentage of game container (0..100)
  const [obj1X, setObj1X] = useState(50); // initial middle position

  // Round 2 state: Two objects
  const [obj2XSquare, setObj2XSquare] = useState(65); // Square block
  const [obj2XCircle, setObj2XCircle] = useState(35); // Circle block

  const [lockTimer, setLockTimer] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Positions (out of 100% width)
  const lampX = 10;
  const wallX = 90;

  // Round 1 calculations:
  // Similar triangles: scale = (wallX - lampX) / (objX - lampX)
  // width of wall is 80% (90 - 10)
  const dist1 = Math.max(5, obj1X - lampX);
  const scale1 = 80 / dist1; // if obj1X = 50 -> dist = 40 -> scale = 2x

  // Round 1 target: Triangle, scale should be around 2.5x (meaning dist = 32, obj1X = 42)
  const r1TargetScale = 2.5;
  const r1Within = round === 1 && Math.abs(scale1 - r1TargetScale) < 0.18;

  // Round 2 calculations:
  const distSquare = Math.max(5, obj2XSquare - lampX);
  const scaleSquare = 80 / distSquare; // target scale: 1.8x -> dist = 44.4 -> X = 54.4

  const distCircle = Math.max(5, obj2XCircle - lampX);
  const scaleCircle = 80 / distCircle; // target scale: 3.2x -> dist = 25 -> X = 35

  // Round 2 target: Combined silhouette
  const r2SquareTarget = 1.8;
  const r2CircleTarget = 3.2;
  const r2Within = round === 2 && 
                   Math.abs(scaleSquare - r2SquareTarget) < 0.16 &&
                   Math.abs(scaleCircle - r2CircleTarget) < 0.16;

  const within = round === 1 ? r1Within : r2Within;

  // Success Lock Timer
  useEffect(() => {
    let t: any;
    if (within) {
      t = setInterval(() => {
        setLockTimer((p) => {
          if (p >= 100) {
            clearInterval(t);
            handleNextRound();
            return 100;
          }
          return p + 12; // 1s delay
        });
      }, 100);
    } else {
      setLockTimer(0);
    }
    return () => clearInterval(t);
  }, [within, round]);

  const handleNextRound = () => {
    audioSystem.playSuccess();
    setLockTimer(0);
    if (round === 1) {
      setRound(2);
    } else {
      audioSystem.playLevelComplete();
    }
  };

  const handleDrag1 = (event: any, info: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = info.point.x - rect.left;
    const pct = Math.max(20, Math.min(80, (currentX / rect.width) * 100));
    setObj1X(pct);
  };

  const handleDrag2Square = (event: any, info: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = info.point.x - rect.left;
    const pct = Math.max(20, Math.min(80, (currentX / rect.width) * 100));
    setObj2XSquare(pct);
  };

  const handleDrag2Circle = (event: any, info: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = info.point.x - rect.left;
    const pct = Math.max(20, Math.min(80, (currentX / rect.width) * 100));
    setObj2XCircle(pct);
  };

  return (
    <div className="mx-auto w-full max-w-4xl select-none">
      <div
        ref={containerRef}
        className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-indigo-950/70 to-purple-950/60 shadow-2xl"
      >
        {/* Round Badge */}
        <div className="absolute left-6 top-6 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground z-10 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
          <span>Puzzles:</span>
          <span className={`px-2 py-0.5 rounded-full bg-primary/25 text-primary-foreground font-bold`}>
            Puzzle {round}/2
          </span>
        </div>

        {/* Dynamic Light Beam SVG representation */}
        <svg viewBox="0 0 100 56.25" className="absolute inset-0 h-full w-full pointer-events-none">
          {/* Main lamp beam */}
          <polygon
            points={`${lampX},28.1 90,2 90,54.25`}
            fill="url(#lightBeamGrad)"
            opacity="0.25"
          />
          <defs>
            <linearGradient id="lightBeamGrad" x1="0" y1="0.5" x2="1" y2="0.5">
              <stop offset="0%" stopColor="oklch(0.9 0.14 90)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="oklch(0.9 0.14 90)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Right Wall (Projection screen) */}
        <div className="absolute right-0 top-0 h-full w-[15%] bg-gradient-to-l from-indigo-900/60 to-transparent border-l border-white/5 flex flex-col items-center justify-center">
          
          {/* Target Silhouette outlines */}
          {round === 1 ? (
            <div className="scale-[2.5] opacity-50 stroke-dasharray animate-pulse">
              <ShapeSVG shape="triangle" fill="none" stroke="oklch(0.9 0.14 90)" strokeWidth={1} />
            </div>
          ) : (
            // Round 2 Combined silhouette (Circle sitting on Square Pedestal)
            <div className="relative h-28 w-12 flex flex-col items-center justify-center opacity-40">
              {/* Square target */}
              <div
                className="absolute border border-dashed border-amber-300 rounded"
                style={{
                  width: `${18 * 1.8}px`,
                  height: `${18 * 1.8}px`,
                  bottom: "15%",
                }}
              />
              {/* Circle target */}
              <div
                className="absolute border border-dashed border-amber-300 rounded-full"
                style={{
                  width: `${15 * 3.2}px`,
                  height: `${15 * 3.2}px`,
                  bottom: "48%",
                }}
              />
            </div>
          )}

          {/* PROJECTED SHADOWS */}
          {round === 1 ? (
            <motion.div
              className="absolute pointer-events-none"
              style={{ filter: "blur(2.5px)" }}
              animate={{ scale: scale1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <ShapeSVG shape="triangle" fill="black" stroke="transparent" />
            </motion.div>
          ) : (
            // Round 2: Overlapping projected shadows
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {/* Square Shadow */}
              <motion.div
                className="absolute"
                style={{ filter: "blur(2px)", bottom: "24%", transformOrigin: "bottom center" }}
                animate={{ scale: scaleSquare }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                <ShapeSVG shape="square" fill="black" stroke="transparent" size={18} />
              </motion.div>
              {/* Circle Shadow */}
              <motion.div
                className="absolute"
                style={{ filter: "blur(2.2px)", bottom: "52%", transformOrigin: "bottom center" }}
                animate={{ scale: scaleCircle }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                <ShapeSVG shape="circle" fill="black" stroke="transparent" size={15} />
              </motion.div>
            </div>
          )}
        </div>

        {/* Fixed Lamp Light Source */}
        <div
          className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${lampX}%` }}
        >
          <div
            className="h-12 w-12 rounded-full animate-pulse-glow"
            style={{
              background: "var(--gradient-moon)",
              boxShadow: "0 0 50px 16px color-mix(in oklab, var(--moon) 60%, transparent)",
            }}
          />
          <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Lamp</span>
        </div>

        {/* DRAGGABLE OBJECTS IN THE PATH */}
        {round === 1 ? (
          /* Object 1: Draggable Triangle */
          <motion.div
            drag="x"
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleDrag1}
            className="absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20 flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-sm"
            style={{ left: `${obj1X}%`, x: "-50%" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShapeSVG shape="triangle" fill="#2d2d5c" stroke="#8866ff" strokeWidth={1.5} />
            <span className="text-[8px] uppercase tracking-wider text-muted-foreground mt-2">Drag Object</span>
          </motion.div>
        ) : (
          /* Round 2: Draggable Square and Draggable Circle */
          <>
            {/* Draggable Object A: Square */}
            <motion.div
              drag="x"
              dragElastic={0}
              dragMomentum={false}
              onDrag={handleDrag2Square}
              className="absolute top-2/3 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20 flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-3 shadow-xl backdrop-blur-sm"
              style={{ left: `${obj2XSquare}%`, x: "-50%" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShapeSVG shape="square" fill="#2d2d5c" stroke="#8866ff" strokeWidth={1.5} size={20} />
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground mt-1">Pedestal</span>
            </motion.div>

            {/* Draggable Object B: Circle */}
            <motion.div
              drag="x"
              dragElastic={0}
              dragMomentum={false}
              onDrag={handleDrag2Circle}
              className="absolute top-1/3 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20 flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-3 shadow-xl backdrop-blur-sm"
              style={{ left: `${obj2XCircle}%`, x: "-50%" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShapeSVG shape="circle" fill="#2d2d5c" stroke="#8866ff" strokeWidth={1.5} size={18} />
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground mt-1">Sphere</span>
            </motion.div>
          </>
        )}

        {/* Lock Timer Alert */}
        {within && lockTimer < 100 && (
          <div className="absolute left-1/2 bottom-8 -translate-x-1/2 bg-black/60 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 backdrop-blur-md z-30">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-yellow-300 font-bold">Locking Shadow</span>
            <div className="h-1.5 w-16 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-300" style={{ width: `${lockTimer}%` }} />
            </div>
          </div>
        )}

      </div>

      <p className="mt-3 text-center text-sm text-muted-foreground">
        {round === 1 
          ? "Drag the triangle object. Notice how moving it **closer to the lamp** makes its shadow **bigger**!"
          : "Drag both the Square block and Circle sphere to match the combined silhouette target on the wall."}
      </p>

      {/* Chapter completion buttons */}
      {round === 2 && within && lockTimer >= 100 && (
        <div className="mt-4 flex justify-center">
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={onComplete}
            className="btn-magic hover:scale-105"
          >
            Unlock shadow lock — Continue →
          </motion.button>
        </div>
      )}
    </div>
  );
}

function ShapeSVG({
  shape, fill, stroke, strokeWidth = 2, size = 32,
}: {
  shape: "circle" | "square" | "triangle"; fill: string; stroke: string; strokeWidth?: number; size?: number;
}) {
  const props = { fill, stroke, strokeWidth };
  
  if (shape === "circle") {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" {...props} />
      </svg>
    );
  }
  
  if (shape === "square") {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40">
        <rect x="4" y="4" width="32" height="32" rx="3" {...props} />
      </svg>
    );
  }
  
  // Triangle
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <polygon points="20,4 36,36 4,36" {...props} />
    </svg>
  );
}
