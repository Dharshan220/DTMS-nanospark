import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Bus, CalendarDays, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/faculty";
import { PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { StudentProfile } from "@/types/faculty";

export default function StudentProfileSetupPage() {
  const profileQuery = useQuery({
    queryKey: ["student-profile"],
    queryFn: () => api.get<StudentProfile>("/student/profile"),
  });

  if (profileQuery.isLoading) return <PageSkeleton />;
  if (profileQuery.isError) {
    return (
      <PageError
        message="Could not load your profile."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data!;
  const transport = profile.transport;
  const bus = transport?.bus ?? null;
  const busStop = transport?.busStop ?? null;
  const route = bus?.route ?? null;

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden border-[#dce2ff] shadow-xl">
        <div className="h-1.5 bg-gradient-to-r from-[#1a237e] via-[#FFD700] to-[#1a237e]" />
        <CardHeader className="border-b border-[#dce2ff] bg-[#f7f9ff]">
          <CardTitle className="flex items-center gap-2 text-lg font-extrabold text-[#1a237e]">
            <UserRound className="h-5 w-5 text-[#b8860b]" />
            My Transport Profile
          </CardTitle>
          <p className="text-xs text-slate-600">
            Your profile is managed by the transport office. Contact admin to update your details.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#1a237e]">
              <UserRound className="h-3.5 w-3.5" />
              Personal Details
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField icon={<UserRound className="h-3.5 w-3.5 text-[#1a237e]" />} label="Full Name" value={profile.name} />
              <InfoField icon={<Mail className="h-3.5 w-3.5 text-[#1a237e]" />} label="Email" value={profile.email} />
              <InfoField icon={<UserRound className="h-3.5 w-3.5 text-[#1a237e]" />} label="Register Number" value={profile.registerNumber} />
              <InfoField icon={<Phone className="h-3.5 w-3.5 text-[#1a237e]" />} label="Phone" value={profile.phone || "—"} />
              <InfoField label="Department" value={profile.department || "—"} />
              <InfoField label="Year" value={profile.year || "—"} />
              <InfoField label="Section" value={profile.section || "—"} />
              <InfoField label="Gender" value={profile.gender || "—"} />
              <InfoField label="Status">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    profile.status === "ACTIVE"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {profile.status}
                </Badge>
              </InfoField>
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#1a237e]">
              <Bus className="h-3.5 w-3.5" />
              Transport Details
            </h3>
            {bus ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#1a237e] to-[#283593] p-4 text-white shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#FFD700] ring-1 ring-white/20">
                    <Bus className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-extrabold tracking-wide">{bus.registrationNumber}</p>
                    <p className="text-xs font-semibold text-white/70">
                      Route {bus.busNumber} · {bus.status}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoField label="Driver" value={bus.driver?.name || "—"} />
                  <InfoField label="Driver Phone" value={bus.driver?.phone || "—"} />
                  <InfoField
                    icon={<MapPin className="h-3.5 w-3.5 text-[#1a237e]" />}
                    label="Boarding Stop"
                    value={busStop?.name || "—"}
                  />
                  {route && (
                    <InfoField
                      icon={<CalendarDays className="h-3.5 w-3.5 text-[#1a237e]" />}
                      label="Route"
                      value={`${route.routeCode} — ${route.routeName}`}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                No bus has been assigned to your profile yet. Contact the transport office.
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#1a237e]">
              <CalendarDays className="h-3.5 w-3.5" />
              Assignment Info
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField label="Transport Status" value={transport?.status || "—"} />
              <InfoField label="Assignment Start" value={transport?.startDate ? formatDateTime(transport.startDate) : "—"} />
            </div>
          </div>

          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Your profile is managed by the transport office. To update your details, contact the admin or your faculty coordinator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoField({
  icon,
  label,
  value,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-bold text-foreground">
        {icon}
        {children ?? <span className="truncate">{value}</span>}
      </div>
    </div>
  );
}
