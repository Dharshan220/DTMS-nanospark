import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { SystemSettings } from "@/types/faculty";

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SystemSettings | null>(null);
  const [newCategory, setNewCategory] = useState("");

  const query = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get<SystemSettings>("/settings"),
  });

  const saveMutation = useMutation({
    mutationFn: (s: SystemSettings) => api.put<{ settings: SystemSettings }>("/settings", s),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["complaint-categories"] });
      toast.success("Settings saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save settings"),
  });

  if (query.isLoading) return <PageSkeleton rows={6} />;
  if (query.isError) {
    return <PageError message="Could not load settings." onRetry={() => void query.refetch()} />;
  }

  const s = form ?? query.data!;

  const togglePref = (key: string) => {
    setForm({
      ...s,
      notificationPreferences: {
        ...s.notificationPreferences,
        [key]: !s.notificationPreferences[key],
      },
    });
  };

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    if (s.complaintCategories.includes(name)) {
      toast.error("That category already exists.");
      return;
    }
    setForm({ ...s, complaintCategories: [...s.complaintCategories, name] });
    setNewCategory("");
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Transport department branding, categories and notification preferences."
        actions={
          <Button
            className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
            disabled={saveMutation.isPending}
            onClick={() => {
              saveMutation.mutate(s);
              setForm(null);
            }}
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Saving…" : "Save All"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Settings className="h-4 w-4 text-[#1a237e]" />
              Department
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Transport name
              </Label>
              <Input
                value={s.transportName}
                onChange={(e) => setForm({ ...s, transportName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Academic year
              </Label>
              <Input
                value={s.academicYear}
                onChange={(e) => setForm({ ...s, academicYear: e.target.value })}
                placeholder="e.g. 2026-2027"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Bus status types
              </Label>
              <div className="flex flex-wrap gap-2">
                {s.busStatusTypes.map((t) => (
                  <Badge key={t} variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e] capitalize">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Emergency categories
              </Label>
              <div className="flex flex-wrap gap-2">
                {s.emergencyCategories.map((t) => (
                  <Badge key={t} variant="outline" className="border-red-200 bg-red-50 capitalize text-red-700">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-extrabold">Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(s.notificationPreferences).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
                <div>
                  <p className="text-sm font-bold capitalize text-foreground">{key.replace(/([A-Z])/g, " $1")}</p>
                  <p className="text-[11px] text-muted-foreground">Default preference for this alert type.</p>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={() => togglePref(key)}
                  className="data-[state=checked]:bg-[#1a237e]"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-extrabold">Complaint Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {s.complaintCategories.length === 0 ? (
              <EmptyState message="No categories — complaints can't be raised without at least one." />
            ) : (
              s.complaintCategories.map((c) => (
                <Badge key={c} variant="outline" className="gap-1 border-[#1a237e]/20 bg-[#1a237e]/5 py-1.5 pl-3 pr-1.5 text-[#1a237e]">
                  {c}
                  <button
                    type="button"
                    className="rounded-full p-0.5 text-muted-foreground transition hover:text-destructive"
                    title="Remove category"
                    onClick={() =>
                      setForm({ ...s, complaintCategories: s.complaintCategories.filter((x) => x !== c) })
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                New category
              </Label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Driver Behaviour"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCategory();
                }}
              />
            </div>
            <Button variant="outline" className="gap-2" onClick={addCategory}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Categories appear in the complaint forms for students and faculty.
          </p>
        </CardContent>
      </Card>
    </>
  );
}