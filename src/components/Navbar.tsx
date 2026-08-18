import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { publicAsset } from "@/lib/publicAsset";

const navItems = [
  { label: "Bus Routes", path: "/routes" },
  { label: "Safety Rules", path: "/safety" },
  { label: "Feedback", path: "/feedback" },
  { label: "Contact", path: "/contact" },
  { label: "Key Updates", path: "/updates" },
  { label: "Locate", path: "/locate" },
  { label: "Notice Board", path: "/notices" },
  { label: "Coordinators", path: "/coordinators" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const isLogin = location.pathname === "/login" || location.pathname === "/";

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 inset-x-0 z-50 border-b transition-all duration-300 ${scrolled
          ? "border-border bg-card/95 backdrop-blur-xl shadow-lg"
          : "border-transparent bg-card/80 backdrop-blur-md"
        }`}
    >
      {/* Animated glow border at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] animate-nav-glow" style={{ background: "linear-gradient(90deg, transparent, #FFD700, #1a237e, #FFD700, transparent)" }} />

      <div
        className="grid h-20 w-full items-center gap-x-4 px-2 sm:px-4 lg:gap-x-8 lg:px-5"
        style={{ gridTemplateColumns: "auto minmax(0, 1fr) auto" }}
      >
        {/* Left: Main Logo */}
        <Link
          to={isLogin ? "/login" : "/home"}
          className="flex items-center justify-self-start gap-2"
          aria-label="Home"
        >
          <img src={publicAsset("/dhaanish-badge.png")} alt="Dhaanish Chennai" className="h-14 w-auto sm:h-16" />
        </Link>

        {/* Center: Home Button + All Nav Buttons together */}
        {!isLogin && (
          <div className="hidden md:flex items-center justify-center gap-3">
            {/* Home button - gold pill */}
            <motion.div
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
                <Link
                  to="/home"
                  className="inline-flex min-w-[90px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold shadow-lg transition-all hover:shadow-xl whitespace-nowrap text-center"
                  style={{
                    background: "linear-gradient(135deg, #FFD700, #FFC107)",
                    color: "#1a237e",
                    border: "2px solid rgba(26, 35, 126, 0.15)",
                  }}
              >
                <Home className="h-3 w-3" />
                Home
              </Link>
            </motion.div>

            {/* Other nav buttons - same gold style */}
            {navItems.map((item) => (
              <motion.div
                key={item.path}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={item.path}
                  className={`inline-flex min-w-[90px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold shadow-lg transition-all hover:shadow-xl whitespace-nowrap text-center ${location.pathname === item.path ? 'ring-2 ring-white/50' : ''}`}
                  style={{
                    background: location.pathname === item.path
                      ? "linear-gradient(135deg, #1a237e, #283593)"
                      : "linear-gradient(135deg, #FFD700, #FFC107)",
                    color: location.pathname === item.path ? "#FFD700" : "#1a237e",
                    border: "2px solid rgba(26, 35, 126, 0.15)",
                  }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Right: Search + Logout + Mobile toggle (hidden on login for desktop) */}
        <div className="flex items-center justify-self-end gap-2">
          {!isLogin && (
            <>
                  <Link
                to="/login"
                className="hidden md:inline-flex items-center justify-center rounded-full border border-border bg-white px-2 py-1 text-primary shadow-sm transition hover:-translate-y-[1px]"
                title="Log out"
              >
                <LogOut className="h-3 w-3" />
              </Link>
              <div className="hidden md:flex flex-col items-center text-[9px] font-semibold text-muted-foreground leading-tight">
                <span>{now.toLocaleDateString()}</span>
                <span>{now.toLocaleTimeString()}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setOpen(!open)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary md:hidden"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
              <Link
                to="/login"
                className="md:hidden rounded-full border border-border bg-white p-2 text-primary shadow-sm transition hover:-translate-y-[1px]"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Link>
              <div className="md:hidden flex flex-col items-center text-[9px] font-semibold text-muted-foreground leading-tight">
                <span>{now.toLocaleDateString()}</span>
                <span>{now.toLocaleTimeString()}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && !isLogin && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-border bg-card md:hidden"
          >
            <div className="flex flex-col gap-1 p-3">
              {[{ label: "🏠 Home", path: "/home" }, ...navItems].map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${location.pathname === item.path
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                      }`}
                    style={location.pathname === item.path ? { backgroundColor: "#1a237e" } : undefined}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-secondary"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


    </motion.nav>
  );
}
