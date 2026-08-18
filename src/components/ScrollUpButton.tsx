import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

type ScrollUpButtonProps = {
  onVisibilityChange?: (visible: boolean) => void;
};

export default function ScrollUpButton({ onVisibilityChange }: ScrollUpButtonProps) {
  const [visible, setVisible] = useState(false);
  const [scrollingUp, setScrollingUp] = useState(false);

  useEffect(() => {
    let lastScroll = window.scrollY;
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setVisible(currentScroll > 300);
      setScrollingUp(currentScroll < lastScroll);
      lastScroll = currentScroll;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (!visible) {
    return null;
  }

  return (
    <motion.button
      onClick={scrollTop}
      initial={{ opacity: 0, y: 24 }}
      animate={{
        opacity: 1,
        y: scrollingUp ? -2 : 0,
        boxShadow: "0 5px 20px rgba(26, 35, 126, 0.35)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-6 right-4 sm:right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-gradient-to-br from-[#1a237e] to-[#283593] text-white shadow-lg shadow-[#1a237e]/40"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-4 w-4" />
      <span className="sr-only">Scroll to top</span>
    </motion.button>
  );
}
