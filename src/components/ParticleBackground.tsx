import { useMemo } from "react";

interface Particle {
    id: number;
    left: string;
    size: number;
    duration: string;
    delay: string;
    opacity: number;
}

export default function ParticleBackground() {
    const particles: Particle[] = useMemo(() => {
        return Array.from({ length: 30 }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            size: Math.random() * 4 + 2,
            duration: `${Math.random() * 8 + 6}s`,
            delay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.3 + 0.1,
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full animate-float-particle"
                    style={{
                        left: p.left,
                        bottom: `-${p.size}px`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: `rgba(255, 255, 255, ${p.opacity})`,
                        animationDuration: p.duration,
                        animationDelay: p.delay,
                    }}
                />
            ))}
            {/* Glowing orbs */}
            <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-white/5 blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/3 left-1/6 w-48 h-48 rounded-full bg-white/5 blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
        </div>
    );
}
