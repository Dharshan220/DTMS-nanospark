import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Bus, Mail, MapPin, Phone, Route as RouteIcon, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { initials } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import { PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { AuthUser, DashboardResponse } from "@/types/faculty";

export default function FacultyProfilePage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const dashQuery = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: () => api.get<DashboardResponse>("/dashboard"),
  });

  if (dashQuery.isLoading) return <PageSkeleton rows={4} />;
  if (dashQuery.isError) {
    return <PageError message="Could not load your profile." onRetry={() => void dashQuery.refetch()} />;
  }

  const me: AuthUser | null = dashQuery.data!.user ?? user;
  const bus = dashQuery.data!.myBus;
  const route = dashQuery.data!.route;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await api.put<{ user: AuthUser }>("/auth/profile", { name: name.trim(), phone: phone.trim() || null });
      await refresh();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const details: { label: string; value: string; icon: typeof UserRound }[] = [
    { label: "Faculty ID", value: me?.id ?? "—", icon: BadgeCheck },
    { label: "Department", value: me?.department ?? "—", icon: UserRound },
    { label: "Email", value: me?.email ?? "—", icon: Mail },
    { label: "Phone", value: me?.phone ?? "—", icon: Phone },
    {
      label: "Assigned bus",
      value: bus ? `Route ${bus.routeNumber} · ${bus.vehicleNumber}` : "—",
      icon: Bus,
    },
    { label: "Assigned route", value: route ? `Route ${route.routeNumber}` : "—", icon: RouteIcon },
  ];

  return (
    <>
      <PageHeader title="Profile" description="Your faculty account and transport assignments." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Avatar className="h-20 w-20 border-2 border-[#FFD700]/60 shadow-md">
              {me?.photoUrl ? <AvatarImage src={me.photoUrl} alt={me.name} /> : null}
              <AvatarFallback className="bg-[#1a237e] text-xl font-extrabold text-white">
                {me ? initials(me.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-extrabold text-foreground">{me?.name}</p>
              <p className="text-xs font-semibold text-muted-foreground">{me?.email}</p>
            </div>
            <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
              Faculty / Teacher
            </Badge>
            <div className="mt-2 flex w-full flex-col items-center gap-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Bus className="h-3.5 w-3.5 text-[#1a237e]" />
                {bus ? `Route ${bus.routeNumber} · ${bus.vehicleNumber}` : "No bus assigned"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#1a237e]" />
                {route ? `${route.stops[0]?.name} → College` : "No route assigned"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <UserRound className="h-4 w-4 text-[#1a237e]" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Full name
                </Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Phone
                </Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
              </div>
            </div>
            <Button size="sm" className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Changes are saved to the transport server through your authenticated account. Bus, route and
              driver assignments are managed by the transport department.
            </p>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {details.map((d) => (
                <div key={d.label} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
                  <d.icon className="h-4 w-4 shrink-0 text-[#1a237e]" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{d.label}</p>
                    <p className="truncate text-xs font-bold text-foreground">{d.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}