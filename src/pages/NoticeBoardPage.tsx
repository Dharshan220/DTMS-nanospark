import { useEffect, useMemo, useState } from "react";
import { Bell, ClipboardList, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  formatDate,
  formatDelay,
  formatTime,
  issueMeta,
  reporterRoleLabels,
  type UpdateEntry,
  type UpdateKind,
} from "@/lib/updates";
import { loadUpdates, removeUpdate, UPDATES_CHANGED_EVENT, UPDATES_STORAGE_KEY } from "@/lib/updatesStorage";
import { busRoutes } from "@/data/routes";

export default function NoticeBoardPage() {
  const [updates, setUpdates] = useState<UpdateEntry[]>(() => loadUpdates());
  const [activeKind, setActiveKind] = useState<UpdateKind>("instant");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dace_user_role");
    }
    return null;
  });

  // Map any bus input to its route number when possible (accepts route number, "Route 24", or vehicle number)
  const findRouteNumber = (input: string): number | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (/^\d{1,3}$/.test(trimmed)) {
      const direct = busRoutes.find((r) => String(r.routeNumber) === trimmed);
      if (direct) return direct.routeNumber;
    }

    const routeMatch = trimmed.match(/route\s*(\d{1,3})/i);
    if (routeMatch) {
      const match = busRoutes.find((r) => r.routeNumber === Number(routeMatch[1]));
      if (match) return match.routeNumber;
    }

    const normalized = trimmed.replace(/\s+/g, "").toLowerCase();
    const vehicle = busRoutes.find(
      (r) => r.vehicleNumber.replace(/\s+/g, "").toLowerCase() === normalized
    );
    return vehicle?.routeNumber ?? null;
  };

  // Format the swap title with bus numbers only (hides vehicle plates)
  const formatSwapTitle = (swapFrom: string | undefined, swapTo: string | undefined): string => {
    const formatSide = (value: string | undefined) => {
      if (!value) return "";
      const routeNumber = findRouteNumber(value);
      return routeNumber ? `Bus ${routeNumber}` : value.trim();
    };

    const fromDisplay = formatSide(swapFrom);
    const toDisplay = formatSide(swapTo);

    return [fromDisplay, "->", toDisplay].filter(Boolean).join(" ");
  };

  useEffect(() => {
    const refresh = () => setUpdates(loadUpdates());

    const onStorage = (event: StorageEvent) => {
      if (event.key === UPDATES_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(UPDATES_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(UPDATES_CHANGED_EVENT, refresh);
    };
  }, []);

  const shownUpdates = useMemo(
    () => updates.filter((update) => update.kind === activeKind),
    [updates, activeKind]
  );

  const handleDelete = (id: string) => {
    const confirmed = window.confirm("Remove this update from the Notice Board?");
    if (!confirmed) return;
    setUpdates(removeUpdate(id));
  };

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
            className="mb-4 inline-block"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Bell className="mx-auto h-12 w-12" style={{ color: "#FFD700" }} />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4"
          >
            Notice <span style={{ color: "#FFD700" }}>Board</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base text-white/70 max-w-2xl mx-auto"
          >
            Bus alerts and swapping updates posted from Key Updates appear here instantly.
          </motion.p>
        </div>
      </section>

      {/* Notice Board Feed */}
      <section className="mx-auto max-w-3xl w-full px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="rounded-[2rem] border-2 shadow-elevated overflow-hidden"
          style={{ borderColor: "#FFD700", background: "linear-gradient(180deg, #fffdf0, #fff9e0)" }}
        >
          {/* Header bar */}
          <div
            className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ background: "linear-gradient(135deg, #1a237e, #283593)" }}
          >
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" style={{ color: "#FFD700" }} />
              <div>
                <span className="block text-sm font-bold text-white">Latest Bus Updates</span>
                <span className="block text-[11px] text-white/70">{updates.length} total update(s)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveKind("instant")}
                aria-pressed={activeKind === "instant"}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  activeKind === "instant"
                    ? "border-white/40 bg-white/15 text-white"
                    : "border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white"
                }`}
              >
                Bus Alerts
              </button>
              <button
                type="button"
                onClick={() => setActiveKind("swap")}
                aria-pressed={activeKind === "swap"}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  activeKind === "swap"
                    ? "border-white/40 bg-white/15 text-white"
                    : "border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white"
                }`}
              >
                Bus Swaps
              </button>
              <Link
                to="/updates"
                className="rounded-full border border-white/20 bg-transparent px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
              >
                Post Update
              </Link>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {shownUpdates.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white/60 p-10 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <ClipboardList className="h-16 w-16 mx-auto mb-4" style={{ color: "rgba(26,35,126,0.12)" }} />
                </motion.div>
                <h2 className="text-lg font-bold text-foreground/70 mb-2">No updates yet</h2>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Post a bus alert or swap update from <span className="font-semibold">Key Updates</span> and it will appear here.
                </p>
              </div>
            ) : (
              shownUpdates.map((update) => {
                const meta = issueMeta[update.issue];
                const title =
                  update.kind === "swap"
                    ? formatSwapTitle(update.swapFrom, update.swapTo)
                    : update.route;
                const when = update.effectiveAt ?? update.timestamp;
                const roleLabel = reporterRoleLabels[update.reporterRole];
                return (
                  <div key={update.id} className="rounded-2xl border border-border bg-white/70 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <meta.Icon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{title}</p>
                          <p className="text-xs text-muted-foreground/70">
                            {formatDate(when)} &middot; {formatTime(when)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${meta.badge}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    {update.kind === "instant" && update.issue === "late" && update.delayMinutes !== undefined && (
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">
                        Late by {formatDelay(update.delayMinutes)}
                      </p>
                    )}

                    {update.details ? <p className="mt-3 text-sm text-foreground">{update.details}</p> : null}

                {update.image && (
                  <div className="mt-3 rounded-2xl border border-border bg-muted/20 p-2">
                    <img
                      src={update.image}
                      alt={update.imageName ?? `${title} attachment`}
                          className="mx-auto max-h-[420px] w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground/80">
                      <span>
                        Posted by {roleLabel}
                        {update.reporterName ? ` - ${update.reporterName}` : ""}
                      </span>
                      {(currentUserRole === "driver" || currentUserRole === "manager" || currentUserRole === "faculty" || currentUserRole === "admin") && (
                        <button
                          type="button"
                          onClick={() => handleDelete(update.id)}
                          className="inline-flex items-center gap-1 font-semibold text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
