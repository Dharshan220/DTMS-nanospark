import { Settings } from "lucide-react";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState } from "@/components/faculty/DataState";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Transport department branding, categories and notification preferences."
      />

      <EmptyState
        icon={<Settings className="h-12 w-12 text-muted-foreground/40" />}
        message="System settings are planned for a future release. This section will allow you to configure department branding, complaint categories, and notification preferences."
      />
    </>
  );
}
