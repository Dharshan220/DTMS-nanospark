import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
    target: string;
    duration?: number;
}

export default function AnimatedCounter({ target, duration = 1500 }: AnimatedCounterProps) {
    const [display, setDisplay] = useState("0");
    const ref = useRef<HTMLSpanElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;

                    // Check if target is purely numeric
                    const numericMatch = target.match(/^(\d+)/);
                    const suffix = target.replace(/^\d+/, "");

                    if (numericMatch) {
                        const end = parseInt(numericMatch[1], 10);
                        const start = 0;
                        const startTime = performance.now();

                        const animate = (now: number) => {
                            const elapsed = now - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            // Ease out cubic
                            const eased = 1 - Math.pow(1 - progress, 3);
                            const current = Math.round(start + (end - start) * eased);
                            setDisplay(`${current}${suffix}`);

                            if (progress < 1) {
                                requestAnimationFrame(animate);
                            }
                        };

                        requestAnimationFrame(animate);
                    } else {
                        setDisplay(target);
                    }
                }
            },
            { threshold: 0.3 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [target, duration]);

    return <span ref={ref}>{display}</span>;
}
