import { Link } from "react-router-dom";
import { Bus, MapPin, Clock, Shield, ArrowRight, GraduationCap, Sparkles, Award, Users, Star, Globe, TrendingUp, BookOpen, Smartphone, Route, Wifi, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { busRoutes } from "@/data/routes";
import ParticleBackground from "@/components/ParticleBackground";
import { publicAsset } from "@/lib/publicAsset";
// AnimatedBus removed - replaced with college entrance showcase
import AnimatedCounter from "@/components/AnimatedCounter";

import collegeEntranceImg from "@/assets/college_entrance_hero.jpg";
import busFleetImg from "@/assets/bus_fleet.png";
import campusLifeImg from "@/assets/campus_life.png";

const stats = [
  { icon: Bus, label: "Active Buses", value: busRoutes.length.toString() },
  { icon: MapPin, label: "Total Stops", value: busRoutes.reduce((a, r) => a + r.boardingPoints.length, 0).toString() },
  { icon: Clock, label: "Daily Trips", value: (busRoutes.length * 2).toString() },
  { icon: Shield, label: "Safe Rides", value: "100%" },
];

const placements = [
  { icon: TrendingUp, label: "Highest Salary", value: "₹27 LPA" },
  { icon: Award, label: "Average Salary", value: "₹8 LPA" },
  { icon: Users, label: "Recruiters", value: "95+" },
  { icon: BookOpen, label: "Offers", value: "250+" },
  { icon: Star, label: "Placement", value: "92%" },
];

const achievements = [
  { icon: Award, title: "Top 20 in Tamil Nadu", desc: "Consistently ranked among the top 20 for five consecutive years, currently holding the 17th position out of 350 engineering colleges." },
  { icon: Star, title: "NAAC A+ Accredited", desc: "Recognized for academic excellence with NAAC A+ accreditation and 4-Star India Rating by AICTE." },
  { icon: Globe, title: "Autonomous Institution", desc: "Granted Autonomous Status by UGC from the 2025-26 academic year. Approved by Anna University." },
  { icon: TrendingUp, title: "Career Success", desc: "The 2025 batch secured an average salary of ₹8 LPA with the highest offer at ₹27 LPA." },
];

const galleryImages = [
  { src: collegeEntranceImg, title: "College Entrance", desc: "The grand entrance of Dhaanish Ahmed College of Engineering" },
  { src: busFleetImg, title: "Our Bus Fleet", desc: "Yellow college transport buses ready for daily service" },
  { src: campusLifeImg, title: "Campus Life", desc: "Students enjoying their vibrant college experience" },
];

const homeQuickLinks = [
  { label: "Home", path: "/" },
  { label: "Bus Routes", path: "/routes" },
  { label: "Safety Rules", path: "/safety" },
  { label: "Feedback", path: "/feedback" },
  { label: "Contact", path: "/contact" },
  { label: "Key Updates", path: "/updates" },
  { label: "Locate", path: "/locate" },
  { label: "Notice Board", path: "/notices" },
  { label: "Coordinators", path: "/coordinators" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1 + 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

// New massive animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const massiveScaleIn = {
  hidden: { opacity: 0, scale: 0.5, y: 60, rotateX: -15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15, mass: 1 },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 80, damping: 14 },
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero px-4 py-14 sm:py-20">
        <ParticleBackground />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,215,0,0.08),_transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl flex flex-col lg:flex-row items-center gap-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm border border-white/10"
            >
              <Sparkles className="h-3.5 w-3.5 animate-bounce-soft" style={{ color: "#FFD700" }} /> Smart Campus Transport
            </motion.div>
            <h1 className="mb-4 text-4xl font-extrabold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="block"
              >
                Dhaanish Ahmed
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="block"
                style={{ color: "#FFD700" }}
              >
                College of Engineering
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-2 text-sm font-medium text-primary-foreground/70"
            >
              An Autonomous Institution | NAAC A+ | 4 Star India Rating | Anna University | AICTE Approved
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-8 max-w-lg text-base text-primary-foreground/70"
            >
              Track your bus, find your stop, and travel safely every day. Real-time route information for {busRoutes.length} college buses across Chennai.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex flex-wrap gap-3 justify-center lg:justify-start"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/routes"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-elevated transition-all hover:shadow-xl"
                  style={{ backgroundColor: "#FFD700", color: "#1a237e" }}
                >
                  View Bus Routes <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/safety"
                  className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/20 px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/10"
                >
                  Safety Rules
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* College Entrance Video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="relative flex-shrink-0 animate-float"
          >
            {/* Ripple glow rings */}
            <span className="absolute inset-0 rounded-[3rem] animate-ripple" style={{ background: "rgba(255,215,0,0.12)" }} />
            <span className="absolute inset-0 rounded-[3rem] animate-ripple" style={{ background: "rgba(255,215,0,0.08)", animationDelay: "0.7s" }} />
            <div className="absolute -inset-3 rounded-[3rem] blur-xl animate-pulse-slow" style={{ background: "rgba(255,215,0,0.15)" }} />
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-[2.5rem] border-4 shadow-elevated overflow-hidden" style={{ borderColor: "rgba(255,215,0,0.5)" }}>
              <img
                src={collegeEntranceImg}
                alt="Dhaanish Ahmed College Entrance"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-10 px-4 bg-gradient-to-b from-[hsl(232,75%,28%)] to-[hsl(220,20%,97%)]">
        <div className="mx-auto max-w-5xl">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center text-sm font-semibold text-white/60 mb-5 uppercase tracking-widest"
          >
            Quick Links
          </motion.p>
          <div className="flex flex-wrap justify-center gap-4">
            {homeQuickLinks.map((item, i) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 + 0.2 }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to={item.path}
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold shadow-elevated transition-all"
                  style={{ backgroundColor: "#FFD700", color: "#1a237e" }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== QUICK LINKS ===== */}
      <section className="hidden py-10 px-4 bg-gradient-to-b from-[hsl(232,75%,28%)] to-[hsl(220,20%,97%)]">
        <div className="mx-auto max-w-5xl">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center text-sm font-semibold text-white/60 mb-5 uppercase tracking-widest"
          >
            Quick Links
          </motion.p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: "🏠 Home", path: "/" },
              { label: "🚌 Bus Routes", path: "/routes" },
              { label: "🛡️ Safety Rules", path: "/safety" },
              { label: "💬 Feedback", path: "/feedback" },
              { label: "📞 Contact", path: "/contact" },
            ].map((item, i) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 + 0.2 }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to={item.path}
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-bold shadow-elevated transition-all"
                  style={{ backgroundColor: "#FFD700", color: "#1a237e" }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video under quick links */}
      <section className="px-4 pb-10" style={{ background: "linear-gradient(180deg, #e8ecff, #fff7d6)" }}>
        <div className="mx-auto w-full max-w-6xl overflow-hidden shadow-2xl">
          <video
            src={publicAsset("/login-hero.mp4")}
            className="w-full h-auto object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={collegeEntranceImg}
            style={{ filter: "brightness(1.12) saturate(1.08)" }}
          />
        </div>
      </section>

      {/* Transport Stats */}
      <section className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-6 text-center text-xl font-bold text-foreground"
        >
          🚌 Transport at a Glance
        </motion.h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              whileHover={{ y: -6, boxShadow: "0 20px 40px -12px hsl(220 40% 30% / 0.15)" }}
              whileTap={{ scale: 0.95 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-card transition-colors cursor-default"
            >
              <stat.icon className="mb-3 h-6 w-6 text-primary animate-bounce-soft" />
              <p className="text-2xl font-bold text-foreground">
                <AnimatedCounter target={stat.value} />
              </p>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== PREMIUM TRANSPORT FEATURES / APP DETAILS ===== */}
      <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/5 blur-[100px] w-[600px] h-[600px]" />

        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, type: "spring" }}
            className="text-center mb-16"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#1a237e]/10 px-4 py-1.5 text-xs font-semibold" style={{ color: "#1a237e" }}>
              <Smartphone className="h-4 w-4" /> Next-Gen Transport Tech
            </div>
            <h2 className="text-3xl font-black text-foreground sm:text-4xl lg:text-5xl tracking-tight mb-4">
              Premium <span style={{ color: "#1a237e" }}>Transport Features</span>
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground">
              Experience the state-of-the-art GPS tracking and security features implemented across the entire DACE fleet.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto"
          >
            {[
              {
                icon: MapPin,
                title: "Live GPS Tracking",
                desc: "Every bus is equipped with real-time GPS tracking. Parents and students can monitor the exact location of the bus through the parent portal.",
                features: ["Accurate ETA updates", "Route deviation alerts", "Live speed monitoring"]
              },
              {
                icon: Wifi,
                title: "Smart Connectivity",
                desc: "Our modern fleet features comfortable seating and advanced communication systems directly linked to the college transport hub.",
                features: ["Emergency panic buttons", "Automated attendance", "Direct hub communication"]
              }
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                variants={massiveScaleIn}
                whileHover={{ y: -12, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group relative rounded-[2rem] border border-border bg-card p-8 shadow-card transition-all"
              >
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-transparent to-[#1a237e]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" style={{ backgroundImage: "linear-gradient(135deg, #1a237e, #283593)" }}>
                  <feature.icon className="h-8 w-8 text-white" style={{ color: "#FFD700" }} />
                </div>

                <h3 className="mb-3 text-xl font-bold text-foreground">{feature.title}</h3>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>

                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CheckCircle className="h-4 w-4" style={{ color: "#1a237e" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground">How It Works</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            Simple steps to find your bus and board on time.
          </p>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: "01", title: "Find Your Route", desc: "Search by route number or your boarding point to locate your bus." },
            { step: "02", title: "Check Timings", desc: "View exact pickup times for each stop along your route." },
            { step: "03", title: "Board Safely", desc: "Arrive at your stop on time and follow all safety guidelines." },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              whileHover={{ y: -8, boxShadow: "0 20px 40px -12px hsl(220 40% 30% / 0.18)" }}
              whileTap={{ scale: 0.95 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-card cursor-default transition-all"
            >
              <span className="mb-3 inline-block text-3xl font-extrabold" style={{ color: "#1a237e" }}>{item.step}</span>
              <h3 className="mb-2 text-base font-bold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== GALLERY SECTION ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">📸 Campus Gallery</h2>
          <p className="text-sm text-muted-foreground">A glimpse into life at Dhaanish Ahmed College of Engineering</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((img, i) => (
            <motion.div
              key={img.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={massiveScaleIn}
              whileHover={{ y: -15, scale: 1.05, rotate: i % 2 === 0 ? 1 : -1 }}
              whileTap={{ scale: 0.95 }}
              className="group relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-elevated cursor-default transition-all duration-500"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <motion.img
                  src={img.src}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  whileHover={{ scale: 1.1 }}
                />
              </div>
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <h3 className="text-base font-bold text-white">{img.title}</h3>
                <p className="text-xs text-white/80">{img.desc}</p>
              </div>
              {/* Title bar */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-foreground">{img.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{img.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== COLLEGE ABOUT SECTION ===== */}
      <section className="px-4 py-16 sm:px-6" style={{ background: "linear-gradient(135deg, #1a237e, #283593)" }}>
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
              Welcome to Dhaanish Ahmed College of Engineering
            </h2>
            <p className="text-sm font-medium" style={{ color: "#FFD700" }}>Top Engineering College in Tamil Nadu</p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {achievements.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={massiveScaleIn}
                whileHover={{ y: -10, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-6 transition-all cursor-default shadow-elevated"
              >
                <item.icon className="mb-3 h-7 w-7" style={{ color: "#FFD700" }} />
                <h3 className="mb-2 text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-white/70 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLACEMENTS 2024 ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">🎓 Placements 2025</h2>
          <p className="text-sm text-muted-foreground">Outstanding career outcomes for our graduates</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {placements.map((item, i) => (
            <motion.div
              key={item.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={massiveScaleIn}
              whileHover={{ y: -12, scale: 1.1, boxShadow: "0 25px 50px -12px hsl(220 40% 30% / 0.25)" }}
              whileTap={{ scale: 0.95 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-elevated text-center cursor-default transition-all"
            >
              <item.icon className="mx-auto mb-3 h-7 w-7 text-primary" />
              <p className="text-2xl font-bold" style={{ color: "#1a237e" }}>
                {item.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-1">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== QUICK ACCESS LINKS (Bottom) ===== */}
      <section className="hidden py-12 px-4 bg-gradient-to-b from-[hsl(220,20%,97%)] to-white">
        <div className="mx-auto max-w-5xl">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center text-sm font-semibold text-[#1a237e]/80 mb-5 uppercase tracking-widest"
          >
            Quick Links
          </motion.p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: "🏠 Home", path: "/" },
              { label: "🌐 Bus Routes", path: "/routes" },
              { label: "🛡️ Safety Rules", path: "/safety" },
              { label: "💬 Feedback", path: "/feedback" },
              { label: "📞 Contact", path: "/contact" },
              { label: "📌 Key Updates", path: "/updates" },
              { label: "📍 Locate", path: "/locate" },
              { label: "📜 Notice Board", path: "/notices" },
              { label: "👥 Coordinators", path: "/coordinators" },
            ].map((item, i) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to={item.path}
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-bold shadow-elevated transition-all"
                  style={{ backgroundColor: "#FFD700", color: "#1a237e" }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 100, rotateX: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ type: "spring", stiffness: 80, damping: 15, mass: 1 }}
          className="relative overflow-hidden rounded-[2.5rem] p-12 text-center shadow-2xl animate-gradient-sweep"
          style={{ background: "linear-gradient(135deg, #1a237e, #283593, #303f9f, #1565c0, #1a237e)", backgroundSize: "300% 300%" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,215,0,0.08),_transparent_70%)]" />
          <div className="relative">
            <GraduationCap className="mx-auto mb-4 h-10 w-10 animate-bounce-soft" style={{ color: "#FFD700" }} />
            <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Ready to Find Your Bus?</h2>
            <p className="mb-6 text-sm text-white/70 max-w-md mx-auto">
              Search {busRoutes.length} routes, {busRoutes.reduce((a, r) => a + r.boardingPoints.length, 0)}+ stops across Chennai. Never miss your college bus again.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/routes"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold shadow-elevated transition-all hover:shadow-xl"
                style={{ backgroundColor: "#FFD700", color: "#1a237e" }}
              >
                Explore All Routes <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
