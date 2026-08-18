import { useState, useMemo, useEffect } from "react";
import { Bus, Phone, User, Clock, MapPin, ChevronDown, ChevronUp, X, History, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import { busRoutes, BusRoute } from "@/data/routes";
import driverAvatar from "@/assets/driver_avatar.png";

const RECENT_SEARCHES_KEY = "dhaanish_recent_searches";
const MAX_RECENT = 8;

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSearch(query: string) {
  if (!query.trim()) return;
  const recent = getRecentSearches().filter((s) => s.toLowerCase() !== query.toLowerCase());
  recent.unshift(query.trim());
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

const searchData = busRoutes.flatMap((route) =>
  route.boardingPoints.map((bp) => ({
    routeNumber: route.routeNumber.toString(),
    driverName: route.driverName,
    vehicleNumber: route.vehicleNumber,
    boardingPoint: bp.name,
    _route: route,
  }))
);

const fuse = new Fuse(searchData, {
  keys: ["routeNumber", "boardingPoint", "driverName", "vehicleNumber"],
  threshold: 0.35,
  includeScore: true,
});

const allBoardingPoints = Array.from(
  new Set(busRoutes.flatMap((r) => r.boardingPoints.map((bp) => bp.name).filter((n) => n !== "COLLEGE")))
).sort();

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 40, rotateX: -10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.08,
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
      mass: 1
    },
  }),
};

export default function BusRoutesPage() {
  const [search, setSearch] = useState("");
  const [boardingFilter, setBoardingFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());
  const [showRecent, setShowRecent] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [swapUpdate, setSwapUpdate] = useState("");
  const [swapIndex, setSwapIndex] = useState(0);
  const currentTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time", []);
  const routeOptions = useMemo(
    () => busRoutes.map((r, idx) => ({ label: `${r.routeNumber}`, index: idx })),
    []
  );
  const formattedNow = useMemo(
    () =>
      now.toLocaleString(undefined, {
        dateStyle: "full",
        timeStyle: "medium",
      }),
    [now]
  );

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const filteredRoutes = useMemo(() => {
    let results: BusRoute[] = busRoutes;

    if (search.trim()) {
      const fuseResults = fuse.search(search);
      const routeIds = new Set(fuseResults.map((r) => r.item._route.routeNumber));
      results = busRoutes.filter((r) => routeIds.has(r.routeNumber));
    }

    if (boardingFilter) {
      results = results.filter((r) =>
        r.boardingPoints.some((bp) => bp.name === boardingFilter)
      );
    }

    return results;
  }, [search, boardingFilter]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setShowRecent(false);
  };

  const handleSearchSubmit = () => {
    if (search.trim()) {
      saveSearch(search);
      setRecentSearches(getRecentSearches());
    }
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleSwap = (direction: "prev" | "next") => {
    setSwapIndex((prevIndex) => {
      const nextIndex =
        direction === "next"
          ? (prevIndex + 1) % busRoutes.length
          : (prevIndex - 1 + busRoutes.length) % busRoutes.length;
      const previousRoute = busRoutes[prevIndex];
      const nextRoute = busRoutes[nextIndex];
      setSwapUpdate(
        `Bus ${previousRoute.routeNumber} swapped with Bus ${nextRoute.routeNumber}`
      );
      return nextIndex;
    });
  };

  const handleSwapSelect = (nextIndex: number) => {
    setSwapIndex((prevIndex) => {
      const previousRoute = busRoutes[prevIndex];
      const nextRoute = busRoutes[nextIndex];
      setSwapUpdate(`Bus ${previousRoute.routeNumber} swapped with Bus ${nextRoute.routeNumber}`);
      return nextIndex;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page header with gradient text */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-start gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 shadow-sm">
              <Clock className="h-4 w-4 text-primary" />
              <div className="text-left leading-tight">
                <p className="text-xs font-semibold text-foreground">Current date & time</p>
                <p className="text-[11px] text-muted-foreground">{formattedNow}</p>
                <p className="text-[10px] text-muted-foreground/80">{currentTimeZone}</p>
              </div>
            </div>
            <div>
              <h1 className="mb-1 text-2xl font-bold">
                <span className="text-gradient-hero">Bus Routes</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                {busRoutes.length} routes serving {allBoardingPoints.length}+ boarding points across Chennai
              </p>
            </div>
          </div>
        </div>

        {/* Mini bus visual */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card/60 px-4 py-3 shadow-sm">
          <div className="relative h-16">
            {/* Road */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#343741] to-[#23252c] shadow-inner border border-black/10" />
            <div className="absolute left-3 right-3 top-1/2 h-[2px] -translate-y-1/2 bg-[repeating-linear-gradient(90deg,_#ffffff_0px,_#ffffff_16px,_transparent_16px,_transparent_32px)] opacity-95" />

            {[
              { top: 26, duration: 12, delay: 0 },
              { top: 26, duration: 12, delay: 4 },
              { top: 26, duration: 12, delay: 8 },
            ].map((bus, idx) => (
              <motion.div
                key={idx}
                initial={{ left: "-35%" }}
                animate={{ left: "110%" }}
                transition={{
                  duration: bus.duration,
                  ease: "linear",
                  repeat: Infinity,
                  repeatType: "loop",
                  delay: bus.delay,
                  repeatDelay: 4,
                }}
                className="absolute -translate-y-1/2"
                style={{ top: bus.top }}
              >
                <div className="relative h-6 w-12 rounded-[1px] border border-[#f1c400] bg-[#FFD700] shadow-sm overflow-hidden">
                  {/* roof shine */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
                  {/* windows */}
                  <div className="absolute left-1 right-4 top-1 flex h-2 gap-1">
                    <div className="flex-1 bg-gradient-to-b from-white to-white/70" />
                    <div className="flex-1 bg-gradient-to-b from-white to-white/70" />
                    <div className="flex-1 bg-gradient-to-b from-white to-white/70" />
                  </div>
                  {/* front / driver window */}
                  <div className="absolute right-1 top-1 h-2 w-3 bg-gradient-to-b from-[#e0f2fe] to-[#bfdbfe]" />
                  {/* stripe */}
                  <div className="absolute inset-x-0 bottom-2 h-[2px] bg-[#1a237e]/25" />
                  {/* headlights */}
                  <div className="absolute right-0.5 bottom-0.5 h-1 w-1 rounded-full bg-white/80" />
                  <div className="absolute right-0.5 bottom-2 h-1 w-1 rounded-full bg-white/80" />
                  {/* wheels */}
                  <div
                    className="absolute -bottom-1 left-2 h-2.5 w-2.5 rounded-full bg-[#1a237e] shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                    style={{ animation: "spin 0.45s linear infinite" }}
                  >
                    <div className="absolute left-1/2 top-0.5 h-1 w-1 -translate-x-1/2 rounded-full bg-white/90" />
                    <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300" />
                  </div>
                  <div
                    className="absolute -bottom-1 right-2 h-2.5 w-2.5 rounded-full bg-[#1a237e] shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                    style={{ animation: "spin 0.45s linear infinite" }}
                  >
                    <div className="absolute left-1/2 top-0.5 h-1 w-1 -translate-x-1/2 rounded-full bg-white/90" />
                    <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Search and filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search route, stop, or driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchSubmit();
            }}
            className="w-full rounded-xl border border-border bg-card py-3 pl-4 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 input-focus-glow transition-all"
          />

          {/* Recent searches dropdown */}
          <AnimatePresence>
            {showRecent && recentSearches.length > 0 && !search && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                className="absolute left-0 right-0 top-full z-20 mt-1.5 rounded-xl border border-border bg-card p-2 shadow-elevated"
              >
                <div className="mb-1.5 flex items-center justify-between px-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <History className="h-3 w-3" /> Recent Searches
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClearRecent}
                    className="text-xs text-destructive hover:underline"
                  >
                    Clear
                  </motion.button>
                </div>
                {recentSearches.map((term, i) => (
                  <motion.button
                    key={term}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 4, backgroundColor: "hsl(var(--secondary))" }}
                    whileTap={{ scale: 0.98 }}
                    onMouseDown={() => {
                      handleSearch(term);
                      saveSearch(term);
                      setRecentSearches(getRecentSearches());
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors"
                  >
                    <History className="h-3.5 w-3.5 text-muted-foreground" />
                    {term}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <select
          value={boardingFilter}
          onChange={(e) => setBoardingFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        >
          <option value="">All Boarding Points</option>
          {allBoardingPoints.map((bp) => (
            <option key={bp} value={bp}>{bp}</option>
          ))}
        </select>

      </motion.div>

      {/* Active filters */}
      {(search || boardingFilter) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex flex-wrap items-center gap-2"
        >
          <span className="text-xs text-muted-foreground">Filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              "{search}"
              <button onClick={() => setSearch("")}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {boardingFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {boardingFilter}
              <button onClick={() => setBoardingFilter("")}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <span className="text-xs text-muted-foreground">- {filteredRoutes.length} route(s) found</span>
        </motion.div>
      )}

      {/* Route cards */}
      <div className="space-y-4">
        {filteredRoutes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-border bg-card p-12 text-center"
          >
            <Bus className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No routes found</p>
            <p className="text-xs text-muted-foreground">Try a different search term or filter</p>
          </motion.div>
        )}

        {filteredRoutes.map((route, i) => (
          <motion.div
            key={route.routeNumber}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={cardVariants}
            layout
            whileHover={{ y: -4, boxShadow: "0 20px 40px -12px hsl(220 40% 30% / 0.15)" }}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all"
          >
            {/* Header */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setExpanded(expanded === route.routeNumber ? null : route.routeNumber);
              }}
              className="flex w-full items-center justify-between p-5 text-left hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero text-lg font-bold text-primary-foreground shadow-md"
                >
                  {route.routeNumber}
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-foreground">Route {route.routeNumber}</p>
                  <p className="text-xs text-muted-foreground">{route.vehicleNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden items-center gap-4 sm:flex">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" /> {route.driverName}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {route.boardingPoints.length} stops
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                    <Clock className="h-3 w-3" /> {route.arrivalTime}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: expanded === route.routeNumber ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </motion.div>
              </div>
            </motion.button>

            {/* Expanded content */}
            <AnimatePresence>
              {expanded === route.routeNumber && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border p-5">
                    {/* Driver info on mobile */}
                    <div className="mb-4 flex flex-wrap gap-3 sm:hidden">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5" /> {route.driverName}
                      </span>
                      <a
                        href={`tel:${route.driverPhone}`}
                        className="flex items-center gap-1.5 text-xs text-primary"
                      >
                        <Phone className="h-3.5 w-3.5" /> {route.driverPhone}
                      </a>
                    </div>

                    {/* Driver card with verified badge */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mb-5 flex items-center gap-4 rounded-2xl bg-secondary/50 p-4"
                    >
                      {/* Round driver avatar with verified badge */}
                      <div className="relative flex-shrink-0">
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                          className="h-16 w-16 rounded-full overflow-hidden shadow-lg"
                          style={{ border: "3px solid #1a237e" }}
                        >
                          <img
                            src={driverAvatar}
                            alt={`Driver ${route.driverName}`}
                            className="h-full w-full object-cover"
                          />
                        </motion.div>
                        {/* Verified badge */}
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
                          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full shadow-md"
                          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-white" />
                        </motion.div>
                      </div>

                      {/* Driver info + verified text */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-foreground">{route.driverName}</p>
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
                            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Verified Driver
                          </motion.span>
                        </div>
                        <a href={`tel:${route.driverPhone}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Phone className="h-3 w-3" /> {route.driverPhone}
                        </a>
                        <p className="text-[10px] text-muted-foreground mt-1">Licensed & background verified by DACE Transport</p>
                      </div>
                    </motion.div>

                    {/* Boarding points */}
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Boarding Points
                    </h4>
                    <div className="space-y-0">
                      {route.boardingPoints.map((bp, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          whileHover={{ x: 5, backgroundColor: "hsl(var(--secondary) / 0.4)" }}
                          className="flex items-center gap-3 border-l-2 border-primary/20 py-2 pl-4 last:border-primary transition-colors rounded-r-lg"
                        >
                          <div className={`h-2.5 w-2.5 rounded-full transition-all ${idx === route.boardingPoints.length - 1 ? "bg-primary scale-125" : "bg-primary/30"}`} />
                          <span className="flex-1 text-sm text-foreground">{bp.name}</span>
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {bp.time}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
