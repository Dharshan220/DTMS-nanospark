import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, Save, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser, RouteInfo } from "@/types/faculty";

export default function StudentProfileSetupPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [rollNo, setRollNo] = useState(user?.rollNo ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [year, setYear] = useState(user?.year ?? "");
  const [section, setSection] = useState(user?.section ?? "");
  const [routeNumber, setRouteNumber] = useState<string>(user?.routeNumber != null ? String(user.routeNumber) : "");
  const [boardingStop, setBoardingStop] = useState(user?.boardingStop ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const routesQuery = useQuery({
    queryKey: ["routes", "setup"],
    queryFn: () => api.get<{ items: RouteInfo[] }>("/transport"),
  });
  const routes = routesQuery.data?.items ?? [];

  const selectedRoute = routes.find((r) => String(r.routeNumber) === routeNumber);
  const boardingPoints = useMemo(
    () => selectedRoute?.boardingPoints ?? selectedRoute?.stops ?? [],
    [selectedRoute]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.put<{ user: AuthUser }>("/auth/profile", {
        name: name.trim(),
        rollNo: rollNo.trim(),
        phone: phone.trim(),
        department: department.trim() || null,
        year: year.trim() || null,
        section: section.trim() || null,
        routeNumber: routeNumber ? Number(routeNumber) : null,
        boardingStop: boardingStop,
      });
      await refresh();
      navigate("/student", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden border-[#dce2ff] shadow-xl">
        <div className="h-1.5 bg-gradient-to-r from-[#1a237e] via-[#FFD700] to-[#1a237e]" />
        <CardHeader className="border-b border-[#dce2ff] bg-[#f7f9ff]">
          <CardTitle className="flex items-center gap-2 text-lg font-extrabold text-[#1a237e]">
            <UserRound className="h-5 w-5 text-[#b8860b]" />
            Complete your transport profile
          </CardTitle>
          <p className="text-xs text-slate-600">
            Fill in your details to get your bus route, boarding point and trip updates.{" "}
            <span className="font-bold text-[#8a6d00]">
              You can fill this only once — after saving, contact the transport office (admin/faculty) to change it.
            </span>
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="setup-name" className="text-xs font-semibold text-slate-600">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="setup-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-roll" className="text-xs font-semibold text-slate-600">
                  Roll Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="setup-roll"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. 21CS101"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-phone" className="text-xs font-semibold text-slate-600">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="setup-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  pattern="[0-9+ -]{10,15}"
                  title="Enter a valid mobile number"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-dept" className="text-xs font-semibold text-slate-600">
                  Department <span className="text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="setup-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. CSE"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-year" className="text-xs font-semibold text-slate-600">
                  Year <span className="text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="setup-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 3rd Year"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-section" className="text-xs font-semibold text-slate-600">
                  Section <span className="text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="setup-section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. A"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-route" className="text-xs font-semibold text-slate-600">
                  Bus Route Number <span className="text-red-500">*</span>
                </Label>
                <Select value={routeNumber} onValueChange={(v) => { setRouteNumber(v); setBoardingStop(""); }}>
                  <SelectTrigger id="setup-route" className={routeNumber ? "font-semibold" : "text-muted-foreground"}>
                    <SelectValue placeholder={routesQuery.isLoading ? "Loading routes…" : "Select your route"} />
                  </SelectTrigger>
                  <SelectContent>
                    {routes
                      .slice()
                      .sort((a, b) => a.routeNumber - b.routeNumber)
                      .map((r) => (
                        <SelectItem key={r.routeNumber} value={String(r.routeNumber)}>
                          Route {r.routeNumber} — {r.boardingPoints[0]?.name ?? "College"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-stop" className="text-xs font-semibold text-slate-600">
                  Boarding Point <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={boardingStop}
                  onValueChange={setBoardingStop}
                  disabled={!routeNumber || boardingPoints.length === 0}
                >
                  <SelectTrigger id="setup-stop" className={boardingStop ? "font-semibold" : "text-muted-foreground"}>
                    <SelectValue
                      placeholder={routeNumber ? (boardingPoints.length === 0 ? "No stops on this route" : "Select your boarding point") : "Select a route first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {boardingPoints.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name} {p.time ? `— ${p.time}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || routesQuery.isLoading}
              className="w-full gap-2 bg-gradient-to-r from-[#FFD700] to-[#FFC107] font-bold text-[#1a237e] shadow-lg hover:opacity-90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {submitting ? "Saving…" : "Save & Continue"}
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              After saving, your profile is locked. To change it, contact the admin or your faculty coordinator.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}