import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bus, Phone, User, Users, Clock } from "lucide-react";
import { busRoutes } from "@/data/routes";

type CoordinatorDetails = {
  name: string;
  phone: string;
};

type RouteCoordinators = {
  faculty: CoordinatorDetails;
  student: CoordinatorDetails;
};

type CoordinatorsByRoute = Record<number, RouteCoordinators>;

const COORDINATORS_STORAGE_KEY = "dace_bus_coordinators_v1";

function loadCoordinators(): CoordinatorsByRoute {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COORDINATORS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as CoordinatorsByRoute;
  } catch {
    return {};
  }
}

export default function CoordinatorsPage() {
  const routesSorted = useMemo(
    () => busRoutes.slice().sort((a, b) => a.routeNumber - b.routeNumber),
    []
  );

  const coordinators = useMemo<CoordinatorsByRoute>(() => loadCoordinators(), []);
  const [now, setNow] = useState<Date>(new Date());
  const formattedDate = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [now]
  );
  const formattedTime = useMemo(
    () =>
      now.toLocaleTimeString(undefined, {
        timeStyle: "medium",
      }),
    [now]
  );

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8 space-y-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              Coordinators
            </div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Bus <span className="text-gradient-hero">Coordinators</span>
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Coordinator editing is disabled. A PDF with the latest coordinators will be uploaded soon.
            </p>
          </div>

          <div className="sticky top-4 flex items-center gap-2 self-start rounded-xl border border-border bg-card/90 px-3 py-2 shadow-sm backdrop-blur">
            <Clock className="h-4 w-4 text-primary" />
            <div className="text-right leading-tight">
              <p className="text-xs font-semibold text-foreground">Date</p>
              <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Time: {formattedTime}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        {routesSorted.map((route) => {
          const current = coordinators[route.routeNumber];
          const facultyName = current?.faculty.name || "Not set";
          const facultyPhone = current?.faculty.phone || "Not set";
          const studentName = current?.student.name || "Not set";
          const studentPhone = current?.student.phone || "Not set";

          return (
            <div key={route.routeNumber} className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFD700]/15 text-[#1a237e]">
                    <Bus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Route {route.routeNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Bus: {route.vehicleNumber} &middot; Driver: {route.driverName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <User className="h-4 w-4 text-primary" />
                    Faculty Coordinator
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-foreground">{facultyName}</p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {facultyPhone}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <User className="h-4 w-4 text-primary" />
                    Student Coordinator
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-foreground">{studentName}</p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {studentPhone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Note: Editing is disabled. A PDF with official coordinator details will be shared soon.
      </p>
    </div>
  );
}
