import { Badge } from "@/components/ui/badge";
import { COMPLAINT_STATUS_LABELS, type ComplaintStatus } from "@/types/faculty";
import { BOARDING_LABELS, BOARDING_TONE, BUS_STATUS_TONE } from "@/lib/faculty";
import type { BoardingStatus, BusDisplayStatus } from "@/types/faculty";

const STATUS_TONE: Record<ComplaintStatus, string> = {
  OPEN: "border-amber-200 bg-amber-50 text-amber-700",
  IN_REVIEW: "border-sky-200 bg-sky-50 text-sky-700",
  RESOLVED: "border-green-200 bg-green-50 text-green-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <Badge variant="outline" className={`whitespace-nowrap ${STATUS_TONE[status]}`}>
      {COMPLAINT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function BusStatusBadge({ status }: { status: BusDisplayStatus }) {
  return (
    <Badge variant="outline" className={`whitespace-nowrap ${BUS_STATUS_TONE[status]}`}>
      {status}
    </Badge>
  );
}

export function BoardingBadge({ status }: { status: BoardingStatus }) {
  return (
    <Badge variant="outline" className={`whitespace-nowrap ${BOARDING_TONE[status]}`}>
      {BOARDING_LABELS[status]}
    </Badge>
  );
}