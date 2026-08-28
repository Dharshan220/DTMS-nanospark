import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Calendar, Plus, Pencil, Ban, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FormDialog from "@/components/admin/FormDialog";
import type { Schedule, BusInfo, RouteInfo, Paginated } from "@/types/faculty";

interface ScheduleForm {
  busId: string;
  routeId: string;
  tripType: "MORNING" | "EVENING";
  departureTime: string;
  expectedArrivalTime: string;
  effectiveFrom: string;
  effectiveUntil: string;
}

interface OverrideForm {
  date: string;
  replacementBusId: string;
  reason: string;
}

const EMPTY_SCHEDULE: ScheduleForm = {
  busId: "",
  routeId: "",
  tripType: "MORNING",
  departureTime: "",
  expectedArrivalTime: "",
  effectiveFrom: "",
  effectiveUntil: "",
};

const EMPTY_OVERRIDE: OverrideForm = {
  date: "",
  replacementBusId: "",
  reason: "",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  INACTIVE: "bg-amber-100 text-amber-800 border-amber-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

function statusBadge(status: string) {
  return STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export default function AdminSchedulesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ScheduleForm>(EMPTY_SCHEDULE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<Schedule | null>(null);
  const [overrideForm, setOverrideForm] = useState<OverrideForm>(EMPTY_OVERRIDE);

  const schedulesQuery = useQuery({
    queryKey: ["admin-schedules"],
    queryFn: () => api.get<Paginated<Schedule>>("/admin/schedules?page=1&limit=50"),
  });

  const busesQuery = useQuery({
    queryKey: ["admin-buses"],
    queryFn: () => api.get<Paginated<BusInfo>>("/admin/buses?page=1&limit=100"),
  });

  const routesQuery = useQuery({
    queryKey: ["admin-routes"],
    queryFn: () => api.get<Paginated<RouteInfo>>("/admin/routes?page=1&limit=100"),
  });

  const createMutation = useMutation({
    mutationFn: (f: ScheduleForm) => {
      const body: Record<string, unknown> = {
        busId: f.busId,
        routeId: f.routeId,
        tripType: f.tripType,
        departureTime: f.departureTime,
        expectedArrivalTime: f.expectedArrivalTime,
        effectiveFrom: f.effectiveFrom,
      };
      if (f.effectiveUntil) body.effectiveUntil = f.effectiveUntil;
      return api.post<Schedule>("/admin/schedules", body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      setDialogOpen(false);
      setForm(EMPTY_SCHEDULE);
      toast.success("Schedule created");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not create schedule"),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.patch<Schedule>(`/admin/schedules/${id}/activate`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      toast.success("Schedule activated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not activate schedule"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch<Schedule>(`/admin/schedules/${id}/deactivate`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      toast.success("Schedule deactivated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not deactivate schedule"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch<Schedule>(`/admin/schedules/${id}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      toast.success("Schedule cancelled");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not cancel schedule"),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ scheduleId, ...body }: { scheduleId: string; date: string; replacementBusId?: string; reason?: string }) =>
      api.post(`/admin/schedules/${scheduleId}/overrides`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      setOverrideTarget(null);
      setOverrideForm(EMPTY_OVERRIDE);
      toast.success("Override created");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not create override"),
  });

  if (schedulesQuery.isLoading || busesQuery.isLoading || routesQuery.isLoading) return <PageSkeleton rows={6} />;
  if (schedulesQuery.isError) {
    return <PageError message="Could not load schedules." onRetry={() => void schedulesQuery.refetch()} />;
  }

  const schedules = schedulesQuery.data!.data;
  const buses = busesQuery.data?.data ?? [];
  const routes = routesQuery.data?.data ?? [];

  const openCreate = () => {
    setForm(EMPTY_SCHEDULE);
    setDialogOpen(true);
  };

  const handleOverrideSubmit = () => {
    if (!overrideTarget || !overrideForm.date) return;
    const body: Record<string, unknown> = { date: overrideForm.date };
    if (overrideForm.replacementBusId) body.replacementBusId = overrideForm.replacementBusId;
    if (overrideForm.reason) body.reason = overrideForm.reason;
    overrideMutation.mutate({ scheduleId: overrideTarget.id, ...body });
  };

  return (
    <>
      <PageHeader
        title="Schedules"
        description="Manage bus schedules, trip timings, and daily overrides."
        action={{ label: "Add Schedule", onClick: openCreate, icon: Plus }}
      />

      {schedules.length === 0 ? (
        <Card className="shadow-card">
          <CardContent>
            <EmptyState message="No schedules defined yet." />
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Calendar className="h-4 w-4 text-[#1a237e]" />
              All Schedules
              <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                {schedules.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Trip</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Arrival</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold">
                      {s.bus.busNumber}
                      <span className="ml-1 text-xs text-muted-foreground">({s.bus.registrationNumber})</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{s.route.routeCode}</span>
                      <span className="ml-1 text-xs text-muted-foreground">{s.route.routeName}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={s.tripType === "MORNING" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-orange-200 bg-orange-50 text-orange-700"}>
                        {s.tripType}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex items-center gap-1 text-sm">
                      <Clock className="h-3.5 w-3.5 text-[#FFD700]" />
                      {s.departureTime}
                    </TableCell>
                    <TableCell className="flex items-center gap-1 text-sm">
                      <Clock className="h-3.5 w-3.5 text-[#1a237e]" />
                      {s.expectedArrivalTime}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.effectiveFrom}
                      {s.effectiveUntil ? ` – ${s.effectiveUntil}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadge(s.status)}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      {s.status === "ACTIVE" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-amber-600 hover:text-amber-700"
                            onClick={() => deactivateMutation.mutate(s.id)}
                            title="Deactivate"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-red-600 hover:text-red-700"
                            onClick={() => cancelMutation.mutate(s.id)}
                            title="Cancel"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {s.status === "INACTIVE" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-emerald-600 hover:text-emerald-700"
                          onClick={() => activateMutation.mutate(s.id)}
                          title="Activate"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          setOverrideTarget(s);
                          setOverrideForm(EMPTY_OVERRIDE);
                        }}
                        title="Add override"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Schedules define recurring bus trips. Use overrides for day-specific changes.
      </p>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Create Schedule"
        onSubmit={() => {
          if (!form.busId || !form.routeId || !form.departureTime || !form.expectedArrivalTime || !form.effectiveFrom) {
            toast.error("Please fill in all required fields");
            return;
          }
          createMutation.mutate(form);
        }}
        submitting={createMutation.isPending}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Bus *</Label>
              <Select value={form.busId} onValueChange={(v) => setForm({ ...form, busId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      Bus {b.busNumber} — {b.registrationNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Route *</Label>
              <Select value={form.routeId} onValueChange={(v) => setForm({ ...form, routeId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.routeCode} — {r.routeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Trip Type *</Label>
            <Select value={form.tripType} onValueChange={(v: "MORNING" | "EVENING") => setForm({ ...form, tripType: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MORNING">Morning</SelectItem>
                <SelectItem value="EVENING">Evening</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Departure Time *</Label>
              <Input
                type="time"
                value={form.departureTime}
                onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Arrival *</Label>
              <Input
                type="time"
                value={form.expectedArrivalTime}
                onChange={(e) => setForm({ ...form, expectedArrivalTime: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Effective From *</Label>
              <Input
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Effective Until</Label>
              <Input
                type="date"
                value={form.effectiveUntil}
                onChange={(e) => setForm({ ...form, effectiveUntil: e.target.value })}
              />
            </div>
          </div>
        </div>
      </FormDialog>

      <FormDialog
        open={!!overrideTarget}
        onOpenChange={(open) => {
          if (!open) {
            setOverrideTarget(null);
            setOverrideForm(EMPTY_OVERRIDE);
          }
        }}
        title={`Override — ${overrideTarget?.bus.busNumber ?? ""} (${overrideTarget?.route.routeCode ?? ""})`}
        onSubmit={handleOverrideSubmit}
        submitting={overrideMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              value={overrideForm.date}
              onChange={(e) => setOverrideForm({ ...overrideForm, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Replacement Bus</Label>
            <Select
              value={overrideForm.replacementBusId || "__none__"}
              onValueChange={(v) => setOverrideForm({ ...overrideForm, replacementBusId: v === "__none__" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Keep original bus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Keep original bus</SelectItem>
                {buses
                  .filter((b) => b.id !== overrideTarget?.bus.id)
                  .map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      Bus {b.busNumber} — {b.registrationNumber}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input
              placeholder="Optional reason"
              value={overrideForm.reason}
              onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
            />
          </div>
        </div>
      </FormDialog>
    </>
  );
}
