import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PAID: "default",
    PARTIALLY_PAID: "secondary",
    OVERDUE: "destructive",
    DRAFT: "outline",
    APPROVED: "default",
    SENT: "secondary",
  };

  return (
    <Badge variant={colors[status] || "outline"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
