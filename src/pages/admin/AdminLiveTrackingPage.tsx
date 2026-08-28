import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState } from "@/components/faculty/DataState";
import { Gauge } from "lucide-react";

export default function AdminLiveTrackingPage() {
  return (
    <>
      <PageHeader
        title="Live Tracking"
        description="Real-time GPS tracking for all active buses."
      />
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Gauge className="h-4 w-4 text-[#1a237e]" />
            GPS Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="Live GPS tracking will be available when GPS hardware is integrated with the system." />
        </CardContent>
      </Card>
    </>
  );
}
