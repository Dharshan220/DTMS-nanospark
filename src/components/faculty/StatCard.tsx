import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TONES = {
  navy: "bg-[#1a237e] text-white",
  gold: "bg-gradient-to-br from-[#FFD700] to-[#FFC107] text-[#1a237e]",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
} as const;

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  return (
    <Card className="card-hover shadow-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${TONES[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-extrabold text-foreground">{value}</p>
          {sub ? <p className="truncate text-[11px] text-muted-foreground">{sub}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}