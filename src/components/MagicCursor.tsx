import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

const ringSpring = { stiffness: 260, damping: 24, mass: 0.35 };
const dotSpring = { stiffness: 520, damping: 30, mass: 0.25 };

/**
 * Soft animated cursor that follows the pointer with a glow + ripple on click.
 * Disabled automatically on touch / coarse pointers.
 */
export default function MagicCursor() {
  const [enabled, setEnabled] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [clickWave, setClickWave] = useState(0);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, ringSpring);
  const ringY = useSpring(y, ringSpring);
  const dotX = useSpring(x, dotSpring);
  const dotY = useSpring(y, dotSpring);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return; // skip on touch devices

    setEnabled(true);

    const handleMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const handleDown = () => {
      setPressed(true);
      setClickWave((c) => c + 1);
    };
    const handleUp = () => setPressed(false);
    const handleLeave = () => setEnabled(false);
    const handleEnter = () => setEnabled(true);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointerleave", handleLeave);
    window.addEventListener("pointerenter", handleEnter);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointerleave", handleLeave);
      window.removeEventListener("pointerenter", handleEnter);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] mix-blend-screen">
      {/* Outer ring */}
      <motion.div
        aria-hidden
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          x: ringX,
          y: ringY,
          width: 46,
          height: 46,
          border: "2px solid hsl(var(--primary) / 0.35)",
          boxShadow: "0 0 40px -10px hsl(var(--primary) / 0.7)",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 60%)",
          backdropFilter: "blur(4px)",
        }}
        animate={{
          scale: pressed ? 0.9 : 1,
          opacity: pressed ? 0.75 : 0.55,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      />

      {/* Inner dot */}
      <motion.div
        aria-hidden
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          x: dotX,
          y: dotY,
          width: 10,
          height: 10,
          background: "radial-gradient(circle, #FFD700 0%, hsl(var(--primary)) 70%)",
          boxShadow: "0 0 14px 2px rgba(255, 215, 0, 0.4)",
        }}
        animate={{
          scale: pressed ? 0.7 : 1,
          opacity: 1,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 26 }}
      />

      {/* Ripple on click */}
      <AnimatePresence>
        <motion.span
          key={clickWave}
          aria-hidden
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-transparent"
          style={{
            x: dotX,
            y: dotY,
            width: 20,
            height: 20,
            borderColor: "hsl(var(--primary) / 0.45)",
          }}
          initial={{ scale: 0.2, opacity: 0.45 }}
          animate={{ scale: 2.2, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </AnimatePresence>
    </div>
  );
}
