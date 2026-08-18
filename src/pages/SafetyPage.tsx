import { Shield, IdCard, Clock, AlertTriangle, DoorOpen, Headphones, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

const rules = [
  {
    icon: IdCard,
    title: "ID Card Mandatory",
    description: "Students must carry and display their valid college ID card while boarding and traveling on the bus.",
    color: "#22c55e",
  },
  {
    icon: DoorOpen,
    title: "No Standing Near Doors",
    description: "Never stand near the entrance or exit doors while the bus is in motion. Remain seated at all times.",
    color: "#1a237e",
  },
  {
    icon: Clock,
    title: "Be On Time",
    description: "Arrive at your boarding point at least 5 minutes before the scheduled pickup time. Buses will not wait.",
    color: "#f59e0b",
  },
  {
    icon: AlertTriangle,
    title: "No Leaning Out",
    description: "Do not lean out of windows or extend any body part outside the bus while it is moving or stationary.",
    color: "#ef4444",
  },
  {
    icon: BadgeCheck,
    title: "Follow Driver Instructions",
    description: "Always follow the instructions given by the bus driver or transport coordinator for your safety.",
    color: "#8b5cf6",
  },
  {
    icon: Headphones,
    title: "Maintain Discipline",
    description: "Avoid loud music, shouting, or any behavior that may distract the driver. Keep the bus clean.",
    color: "#0284c7",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 40, rotateX: -12 },
  visible: (i: number) => ({
    opacity: 1, scale: 1, y: 0, rotateX: 0,
    transition: { delay: i * 0.08, type: "spring" as const, stiffness: 100, damping: 12 },
  }),
};

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", repeatDelay: 2 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5 text-xs font-semibold text-destructive"
        >
          <Shield className="h-3.5 w-3.5" /> Safety Guidelines
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 120 }}
          className="mb-2 text-3xl font-bold text-foreground"
        >
          Bus Safety Rules
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-muted-foreground"
        >
          Your safety is our priority. Please follow these guidelines during your commute.
        </motion.p>
      </motion.div>

      <motion.div
        className="grid gap-5 sm:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {rules.map((rule, i) => (
          <motion.div
            key={rule.title}
            custom={i}
            variants={cardVariants}
            whileHover={{ y: -8, scale: 1.03, boxShadow: `0 20px 40px -12px ${rule.color}33` }}
            whileTap={{ scale: 0.97 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card transition-all cursor-default group"
          >
            {/* Animated icon */}
            <motion.div
              className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${rule.color}15` }}
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
              transition={{ duration: 0.5 }}
            >
              <rule.icon className="h-6 w-6 transition-transform" style={{ color: rule.color }} />
              {/* Colored dot pulsing */}
              <motion.span
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full"
                style={{ backgroundColor: rule.color }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
              />
            </motion.div>

            {/* Rule number */}
            <motion.span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: rule.color }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 + 0.3 }}
            >
              Rule {String(i + 1).padStart(2, "0")}
            </motion.span>

            <h3 className="mt-1 mb-2 text-base font-bold text-foreground group-hover:text-primary transition-colors">{rule.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{rule.description}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 80, damping: 14 }}
        whileHover={{ scale: 1.02 }}
        className="mt-10 rounded-2xl bg-gradient-hero p-6 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.12),_transparent_70%)]" />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="relative"
        >
          <Shield className="mx-auto mb-3 h-8 w-8 text-primary-foreground" />
          <h3 className="mb-2 text-lg font-bold text-primary-foreground">Emergency Contact</h3>
          <p className="text-sm text-primary-foreground/80">
            In case of any emergency, contact the Transport Office immediately.
          </p>
          <motion.a
            href="tel:+919962022222"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 mt-4 rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg"
            style={{ backgroundColor: "#FFD700", color: "#1a237e" }}
          >
            📞 +91 9962022222
          </motion.a>
        </motion.div>
      </motion.div>
    </div>
  );
}

