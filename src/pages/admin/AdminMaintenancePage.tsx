import { Wrench } from "lucide-react";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminMaintenancePage() {
  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Track servicing, repairs and compliance for every bus."
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Wrench className="h-4 w-4 text-[#1a237e]" />
            Maintenance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            message="Maintenance tracking is planned for a future release."
            hint="This module will allow you to record servicing, repairs and compliance status for every bus in the fleet."
          />
        </CardContent>
      </Card>
    </>
  );
}
