import { Download, ExternalLink, MapPin, Smartphone, ShieldCheck, BarChart3, Navigation } from "lucide-react";
import { motion } from "framer-motion";

import locateIconImg from "@/assets/locate_icon.jpg";
import locateLoginImg from "@/assets/locate_login.jpg";
import locateDashboardImg from "@/assets/locate_dashboard.jpg";
import locateAnalyticsImg from "@/assets/locate_analytics.jpg";
import locateLivemapImg from "@/assets/locate_livemap.jpg";

const steps = [
  {
    step: 1,
    title: "Download The Locate App",
    desc: "Head to the Google Play Store and search for 'The Locate' by Gtropy Systems Pvt. Ltd. It's free to download, rated 4.0★ with 1L+ downloads. Tap Install and wait for it to complete.",
    img: locateIconImg,
    color: "#FFD700",
  },
  {
    step: 2,
    title: "Login with Your Credentials",
    desc: "Open the app and enter the username & password provided by the DACE Transport Office. Tick 'Remember Me' to stay logged in. If you don't have credentials, contact the transport office at +91 9962022222.",
    img: locateLoginImg,
    color: "#FFC107",
  },
  {
    step: 3,
    title: "Explore the Dashboard",
    desc: "After login, you'll see the Locate Dashboard. It shows Services like Location tracking, Fastag, Fuel Card, Insurance, and Offers. Tap 'Location' to view all DACE buses in real-time on the map.",
    img: locateDashboardImg,
    color: "#FFB300",
  },
  {
    step: 4,
    title: "Track Your Bus Analytics",
    desc: "The tracking screen shows Vehicle Status (Running, Idle, Unreachable), last 7 days KM run charts, idle time analysis, and a live map of India showing your bus's exact position. Monitor speed, route deviation, and ETA.",
    img: locateAnalyticsImg,
    color: "#FFA000",
  },
  {
    step: 5,
    title: "View Live Bus Location",
    desc: "See the exact real-time location of your DACE bus on the map! The live view shows the vehicle number (e.g. TN11F0258), current status (Running/Not Moving), and street-level position on Google Maps. Track your bus as it moves through Chennai.",
    img: locateLivemapImg,
    color: "#FF8F00",
  },
];

const features = [
  { icon: Navigation, title: "Live GPS Location", desc: "See exactly where your bus is on the map in real time" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "View KM run, idle time, speed charts for any vehicle" },
  { icon: ShieldCheck, title: "Route Deviation Alerts", desc: "Get notified if the bus goes off its regular route" },
  { icon: Smartphone, title: "Mobile Friendly", desc: "Track from your phone anytime, anywhere" },
];

export default function LocatePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <section
        className="relative overflow-hidden px-4 py-16 sm:py-20"
        style={{ background: "linear-gradient(135deg, #1a237e, #0d1452)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,215,0,0.08),_transparent_60%)]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-sm border border-white/10"
          >
            <div className="h-12 w-12 rounded-xl overflow-hidden shadow-lg border-2" style={{ borderColor: "#FFD700" }}>
              <img src={locateIconImg} alt="The Locate" className="h-full w-full object-cover" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-white">The Locate App</h3>
              <p className="text-xs text-white/60">by Gtropy Systems Pvt. Ltd.</p>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4"
          >
            Track Your Bus{" "}
            <span style={{ color: "#FFD700" }}>In Real-Time</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base text-white/70 max-w-2xl mx-auto mb-8"
          >
            DACE buses are equipped with GPS tracking via The Locate app. Parents and students can monitor bus location, speed, and route in real-time.
          </motion.p>

          <motion.a
            href="https://play.google.com/store/apps/details?id=com.track.gt"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold shadow-xl transition-all hover:shadow-2xl"
            style={{ background: "linear-gradient(135deg, #FFD700, #FFC107)", color: "#1a237e" }}
          >
            <Download className="h-5 w-5" />
            Download from Play Store
            <ExternalLink className="h-4 w-4 opacity-60" />
          </motion.a>
        </div>
      </section>

      {/* Step-by-Step Tutorial */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            📱 How to Use The Locate App
          </h2>
          <p className="text-sm text-muted-foreground">Follow these simple steps to start tracking your DACE bus</p>
        </motion.div>

        <div className="space-y-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 40, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 80, damping: 14 }}
              className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-8`}
            >
              {/* Image */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                className="relative flex-shrink-0 w-64 sm:w-72"
              >
                <div
                  className="absolute -inset-3 rounded-[2rem] blur-xl opacity-30"
                  style={{ background: step.color }}
                />
                <div
                  className="relative rounded-[2rem] overflow-hidden border-4 shadow-2xl"
                  style={{ borderColor: step.color }}
                >
                  <img
                    src={step.img}
                    alt={step.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black shadow-lg mb-4"
                  style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`, color: "#1a237e" }}
                >
                  {step.step}
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Google Maps Location Section */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-[2.5rem] border-4 p-8 sm:p-12 text-center shadow-elevated overflow-hidden bg-card transition-all"
          style={{ borderColor: "rgba(255,215,0,0.5)" }}
        >
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-hero shadow-lg">
            <MapPin className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">Visit Our Campus</h2>
          <p className="text-base text-muted-foreground mb-8 max-w-2xl mx-auto font-medium">
            Not just the bus, you can reach the college directly from anywhere! Use the link below to get precise driving directions to Dhaanish Ahmed College of Engineering.
          </p>
          <motion.a
            href="https://maps.app.goo.gl/KkpF1QRDoh7J9yMM6"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 rounded-2xl px-10 py-4 text-base font-bold shadow-elevated transition-all"
            style={{ backgroundColor: "#1a237e", color: "#FFD700" }}
          >
            <Navigation className="h-5 w-5" />
            Open in Google Maps
            <ExternalLink className="h-4 w-4 opacity-70" />
          </motion.a>
          <p className="mt-4 text-xs text-muted-foreground font-semibold uppercase tracking-widest">
            Tap to reach the college from wherever you are!
          </p>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16 sm:px-6" style={{ background: "linear-gradient(135deg, #1a237e, #283593)" }}>
        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-2xl font-bold text-white mb-10"
          >
            ✨ App Features
          </motion.h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20, rotateY: 30 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                whileHover={{ y: -12, scale: 1.05, rotateZ: i % 2 === 0 ? 1 : -1 }}
                className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-center cursor-default transition-all shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors">
                  <feat.icon className="h-6 w-6" style={{ color: "#FFD700" }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-white/70 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-[2rem] p-10 text-center shadow-2xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #1a237e, #283593)" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,215,0,0.08),_transparent_70%)]" />
          <div className="relative">
            <MapPin className="mx-auto mb-4 h-10 w-10 animate-bounce" style={{ color: "#FFD700" }} />
            <h2 className="text-2xl font-bold text-white mb-3">Ready to Track?</h2>
            <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
              Download The Locate app now and never miss your DACE college bus again. Real-time GPS tracking at your fingertips.
            </p>
            <motion.a
              href="https://play.google.com/store/apps/details?id=com.track.gt"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold shadow-xl"
              style={{ background: "linear-gradient(135deg, #FFD700, #FFC107)", color: "#1a237e" }}
            >
              <Download className="h-4 w-4" />
              Get it on Google Play
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </motion.a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
