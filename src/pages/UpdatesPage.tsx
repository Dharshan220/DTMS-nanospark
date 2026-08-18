import { useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { motion } from "framer-motion";
import { Bus, Camera, ArrowLeftRight } from "lucide-react";
import { Link } from "react-router-dom";
import { busRoutes } from "@/data/routes";
import { issueMeta, type IssueType, type ReporterRole, type UpdateEntry, type UpdateKind } from "@/lib/updates";
import { addUpdate } from "@/lib/updatesStorage";

type UpdateForm = {
  kind: UpdateKind;
  route: string;
  issue: IssueType;
  details: string;
  reporterRole: ReporterRole;
  reporterName: string;
  delayMinutes: string;
  swapFrom: string;
  swapTo: string;
};

const defaultForm: UpdateForm = {
  kind: "instant",
  route: "",
  issue: "late",
  details: "",
  reporterRole: "student",
  reporterName: "",
  delayMinutes: "",
  swapFrom: "",
  swapTo: "",
};

export default function UpdatesPage() {
  const [activeKind, setActiveKind] = useState<UpdateKind>("instant");
  const [form, setForm] = useState<UpdateForm>(() => ({ ...defaultForm }));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dace_user_role");
    }
    return null;
  });

  const clearImage = () => {
    setImagePreview(null);
    setImageName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const setKind = (nextKind: UpdateKind) => {
    setActiveKind(nextKind);
    setError(null);
    setSuccess(null);
    clearImage();
    setForm((prev) => ({
      ...defaultForm,
      kind: nextKind,
      issue: nextKind === "swap" ? "swap" : prev.kind === "instant" ? prev.issue : "late",
      reporterRole:
        nextKind === "swap"
          ? (prev.reporterRole === "staff" || prev.reporterRole === "driver" || prev.reporterRole === "manager"
              ? prev.reporterRole
              : "driver")
          : (prev.reporterRole === "student" || prev.reporterRole === "faculty" || prev.reporterRole === "driver"
              ? prev.reporterRole
              : "student"),
      reporterName: prev.reporterName,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const now = Date.now();

    const delayMinutes = form.delayMinutes.trim() ? Number(form.delayMinutes) : undefined;
    if (form.issue === "late" && form.delayMinutes.trim()) {
      if (!Number.isFinite(delayMinutes) || delayMinutes! < 0) {
        setError("Delay minutes must be a valid number.");
        return;
      }
      if (delayMinutes === 0) {
        setError("Delay time must be greater than 0.");
        return;
      }
    }

    if (activeKind === "swap") {
      if (!(form.reporterRole === "staff" || form.reporterRole === "driver" || form.reporterRole === "manager")) {
        setError("Bus swapping updates can be posted by Staff, Driver, or Transport Authority Manager only.");
        return;
      }

      const from = form.swapFrom.trim();
      const to = form.swapTo.trim();
      if (!from || !to) {
        setError("Please enter both the current bus/route and the swapped bus/route.");
        return;
      }

      const details = form.details.trim();
      setError(null);
      const nextEntry: UpdateEntry = {
        id: `update-${now}-${Math.floor(Math.random() * 1000)}`,
        kind: "swap",
        route: from,
        issue: "swap",
        details,
        timestamp: now,
        reporterRole: form.reporterRole,
        reporterName: form.reporterName.trim() || undefined,
        swapFrom: from,
        swapTo: to,
        image: undefined,
        imageName: undefined,
      };
      addUpdate(nextEntry);
      setSuccess("Update shared. It is now visible in the Notice Board.");
    } else {
      const effectiveAt = now;

      if (!(form.reporterRole === "student" || form.reporterRole === "faculty" || form.reporterRole === "driver")) {
        setError("Instant updates can be posted by Student, Faculty, or Driver only.");
        return;
      }

      const route = form.route.trim();
      if (!route) {
        setError("Please select the bus number.");
        return;
      }

      const details =
        form.details.trim() ||
        (form.issue === "late" && delayMinutes !== undefined ? `Bus will be late by ${delayMinutes} mins.` : "");

      if (!details) {
        setError("Please add details, or provide delay minutes for a late update.");
        return;
      }

      setError(null);
      const nextEntry: UpdateEntry = {
        id: `update-${now}-${Math.floor(Math.random() * 1000)}`,
        kind: "instant",
        route,
        issue: form.issue,
        details,
        timestamp: now,
        reporterRole: form.reporterRole,
        reporterName: form.reporterName.trim() || undefined,
        delayMinutes,
        effectiveAt,
        image: imagePreview ?? undefined,
        imageName: imageName || undefined,
      };
      addUpdate(nextEntry);
      setSuccess("Update shared. It is now visible in the Notice Board.");
    }

    setForm((prev) => ({
      ...defaultForm,
      kind: activeKind,
      issue: activeKind === "swap" ? "swap" : prev.issue,
      reporterRole: prev.reporterRole,
      reporterName: prev.reporterName,
    }));
    clearImage();
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      setImageName("");
      return;
    }

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8 space-y-3"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Bus className="h-4 w-4 text-primary" />
          Key Updates
        </div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Share bus alerts with every student
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Report delays, accidents, punctures, breakdowns, or traffic alerts. Shared updates appear on the Notice Board instantly so every rider can make a safer decision.
        </p>
      </motion.div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setKind("instant")}
          aria-pressed={activeKind === "instant"}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
            activeKind === "instant"
              ? "border-primary bg-primary text-white"
              : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          Instant Updates
        </button>
        {currentUserRole !== "student" && (
          <button
            type="button"
            onClick={() => setKind("swap")}
            aria-pressed={activeKind === "swap"}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              activeKind === "swap"
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            Bus Swapping Updates
          </button>
        )}
      </div>

      {currentUserRole === "student" && activeKind === "instant" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-semibold text-sm">!</div>
          <div>
            <h3 className="font-semibold text-amber-900">Bus Swapping Updates Not Available</h3>
            <p className="text-sm text-amber-800 mt-1">Student accounts can only post Instant Updates. Bus Swapping Updates are exclusively available to Faculty, Drivers, and Admin.</p>
          </div>
        </motion.div>
      )}

      <div className="mx-auto max-w-2xl">
        <motion.form
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="rounded-3xl border border-border bg-card p-6 space-y-5 shadow-card"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">Post an update</h2>
            <p className="text-xs text-muted-foreground">
              Every shared update appears in the Notice Board instantly.
            </p>
            <Link to="/notices" className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline">
              Open Notice Board
            </Link>
          </div>

          {activeKind === "instant" ? (
            <>
              <div className="flex flex-wrap gap-2">
                {Object.entries(issueMeta)
                  .filter(([key]) => key !== "swap")
                  .map(([key, meta]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setForm((prev) => ({ ...prev, issue: key as IssueType }))}
                      aria-pressed={form.issue === key}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                        form.issue === key
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      <meta.Icon className="h-4 w-4" />
                      {meta.label}
                    </button>
                  ))}
              </div>

              <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bus Number
                <select
                  value={form.route}
                  onChange={(event) => setForm((prev) => ({ ...prev, route: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  required
                >
                  <option value="">Select bus number</option>
                  {busRoutes.map((route) => (
                    <option key={route.routeNumber} value={route.vehicleNumber}>
                      {route.vehicleNumber} (Route {route.routeNumber})
                    </option>
                  ))}
                </select>
              </label>

              {form.issue === "late" && (
                <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Late By (mins) (optional)
                  <input
                    value={form.delayMinutes}
                    onChange={(event) => setForm((prev) => ({ ...prev, delayMinutes: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="e.g. 10"
                  />
                </label>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm font-semibold text-foreground">
                <ArrowLeftRight className="h-4 w-4 text-primary" />
                Bus swapping update
              </div>

              <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Current Bus / Route
                <input
                  value={form.swapFrom}
                  onChange={(event) => setForm((prev) => ({ ...prev, swapFrom: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  type="text"
                  list="route-number-options"
                  placeholder="e.g. 33"
                />
              </label>

              <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Swapped Bus / Route (Today Only)
                <input
                  value={form.swapTo}
                  onChange={(event) => setForm((prev) => ({ ...prev, swapTo: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  type="text"
                  list="route-number-options"
                  placeholder="e.g. 24"
                />
              </label>

              <datalist id="route-number-options">
                {busRoutes.map((route) => (
                  <option
                    key={route.routeNumber}
                    value={route.routeNumber}
                    label={`Route ${route.routeNumber}`}
                  >
                    Route {route.routeNumber}
                  </option>
                ))}
              </datalist>
            </>
          )}

          <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {activeKind === "swap" ? "Reason (optional)" : "Details (optional if late mins is set)"}
            <textarea
              value={form.details}
              onChange={(event) => setForm((prev) => ({ ...prev, details: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
              placeholder={activeKind === "swap" ? "Why was the bus swapped? (optional)" : "Describe what happened and where."}
            />
          </label>

          {activeKind === "instant" && (
            <>
              <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary"
                >
                  <Camera className="h-4 w-4" />
                  Attach photo
                </button>
                {imageName && <span className="text-[11px] text-foreground/80">{imageName}</span>}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
              {imagePreview && (
                <div className="rounded-2xl border border-border p-1">
                  <div className="rounded-2xl bg-muted/20 p-2">
                    <img
                      src={imagePreview}
                      alt={imageName || "Attached update photo"}
                      className="mx-auto max-h-[360px] w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Posted by</p>
            <div className="flex flex-wrap gap-2">
              {(activeKind === "swap"
                ? ([
                    { key: "staff", label: "Staff" },
                    { key: "driver", label: "Driver" },
                    { key: "manager", label: "Transport Authority Manager" },
                  ] as const)
                : ([
                    { key: "student", label: "Student" },
                    { key: "faculty", label: "Faculty" },
                    { key: "driver", label: "Driver" },
                  ] as const)
              ).map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, reporterRole: role.key }))}
                  aria-pressed={form.reporterRole === role.key}
                  className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                    form.reporterRole === role.key
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
            <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Name (optional)
              <input
                value={form.reporterName}
                onChange={(event) => setForm((prev) => ({ ...prev, reporterName: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                type="text"
                placeholder="Enter your name"
              />
            </label>
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          {success && (
            <p className="text-xs text-green-600">{success}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl border border-transparent bg-gradient-to-r from-[#1A237E] to-[#283593] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1A237E]/30 transition hover:opacity-90"
          >
            Share update with everyone
          </button>
        </motion.form>
      </div>
    </div>
  );
}
