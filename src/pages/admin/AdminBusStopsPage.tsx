import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Search, X } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BusStop {
  id: string;
  stopCode: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminBusStopsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStop, setEditingStop] = useState<BusStop | null>(null);
  const [formData, setFormData] = useState({
    stopCode: "",
    name: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  const LIMIT = 50;

  const stopsQuery = useQuery({
    queryKey: ["admin-bus-stops", page, search],
    queryFn: () =>
      api.get<PaginatedResponse<BusStop>>(
        `/admin/bus-stops?page=${page}&limit=${LIMIT}${search ? `&search=${encodeURIComponent(search)}` : ""}`
      ),
  });

  const createMutation = useMutation({
    mutationFn: (data: { stopCode: string; name: string; address?: string; latitude?: number; longitude?: number }) =>
      api.post<BusStop>("/admin/bus-stops", data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-bus-stops"] });
      toast.success("Bus stop created");
      resetForm();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not create bus stop"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; address?: string; latitude?: number; longitude?: number }) =>
      api.patch<BusStop>(`/admin/bus-stops/${id}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-bus-stops"] });
      toast.success("Bus stop updated");
      resetForm();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update bus stop"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) =>
      api.patch(`/admin/bus-stops/${id}/status`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-bus-stops"] });
      toast.success("Bus stop status updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update status"),
  });

  const resetForm = () => {
    setFormData({ stopCode: "", name: "", address: "", latitude: "", longitude: "" });
    setEditingStop(null);
    setShowForm(false);
  };

  const startEdit = (stop: BusStop) => {
    setEditingStop(stop);
    setFormData({
      stopCode: stop.stopCode,
      name: stop.name,
      address: stop.address ?? "",
      latitude: stop.latitude?.toString() ?? "",
      longitude: stop.longitude?.toString() ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.stopCode.trim() || !formData.name.trim()) {
      toast.error("Stop code and name are required.");
      return;
    }
    const payload = {
      stopCode: formData.stopCode.trim(),
      name: formData.name.trim(),
      address: formData.address.trim() || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
    };
    if (editingStop) {
      updateMutation.mutate({ id: editingStop.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (stopsQuery.isLoading) return <PageSkeleton rows={6} />;
  if (stopsQuery.isError) {
    return <PageError message="Could not load bus stops." onRetry={() => void stopsQuery.refetch()} />;
  }

  const stops = stopsQuery.data!.data;
  const pagination = stopsQuery.data!.pagination;

  return (
    <>
      <PageHeader
        title="Bus Stops"
        description="Manage all bus stops across the system."
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <MapPin className="h-4 w-4 text-[#1a237e]" />
            All Bus Stops ({pagination.total})
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearch(searchInput);
                    setPage(1);
                  }
                }}
                placeholder="Search stops..."
                className="pl-8"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
              onClick={() => { resetForm(); setShowForm(true); }}
            >
              <Plus className="h-4 w-4" /> Add Bus Stop
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="mb-6 rounded-lg border border-[#1a237e]/20 bg-[#1a237e]/5 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#1a237e]">
                  {editingStop ? "Edit Bus Stop" : "New Bus Stop"}
                </h4>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Stop Code *
                  </Label>
                  <Input
                    value={formData.stopCode}
                    onChange={(e) => setFormData((p) => ({ ...p, stopCode: e.target.value }))}
                    placeholder="e.g. BUS001"
                    disabled={!!editingStop}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Name *
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Anna Salai"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Address
                  </Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Full address"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Latitude
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData((p) => ({ ...p, latitude: e.target.value }))}
                    placeholder="13.0827"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Longitude
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData((p) => ({ ...p, longitude: e.target.value }))}
                    placeholder="80.2707"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button
                  className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingStop ? "Save Changes" : "Create"}
                </Button>
              </div>
            </div>
          )}

          {stops.length === 0 ? (
            <EmptyState message="No bus stops found." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Stop</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stops.map((stop) => (
                      <TableRow key={stop.id}>
                        <TableCell>
                          <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e] font-mono text-xs">
                            {stop.stopCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#1a237e]" />
                            {stop.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {stop.address || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {stop.latitude != null && stop.longitude != null
                            ? `${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={stop.status === "ACTIVE" ? "default" : "secondary"}
                            className={stop.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"}
                          >
                            {stop.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEdit(stop)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                statusMutation.mutate({
                                  id: stop.id,
                                  status: stop.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                                })
                              }
                              title={stop.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            >
                              <span className={`text-xs font-bold ${stop.status === "ACTIVE" ? "text-amber-600" : "text-green-600"}`}>
                                {stop.status === "ACTIVE" ? "Off" : "On"}
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} stops)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
